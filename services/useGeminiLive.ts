import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState } from '../types';
import { SYSTEM_INSTRUCTION, MODEL_NAME } from '../constants';
import { createAudioBlob, decodeBase64, decodeAudioData } from './audioUtils';

export function useGeminiLive() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs to manage audio contexts and connection without re-renders
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const currentMediaStreamRef = useRef<MediaStream | null>(null);

  // Volume meter animation frame
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanupAudio = useCallback(() => {
    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // ignore already stopped sources
      }
    });
    sourcesRef.current.clear();

    // Close contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Stop microphone stream
    if (currentMediaStreamRef.current) {
      currentMediaStreamRef.current.getTracks().forEach(track => track.stop());
      currentMediaStreamRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setVolume(0);
    setIsSpeaking(false);
    nextStartTimeRef.current = 0;
  }, []);

  const updateVolume = () => {
    if (analyzerRef.current) {
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
      analyzerRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      setVolume(avg);
      
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    }
  };

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
        setError("API Key not found in environment variables.");
        return;
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Setup Output Analyzer for visuals
      analyzerRef.current = outputAudioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      
      // Gain node for output
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(analyzerRef.current);
      analyzerRef.current.connect(outputAudioContextRef.current.destination);

      // Start volume visualization
      updateVolume();

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      currentMediaStreamRef.current = stream;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } // Friendly voice
          },
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            setConnectionState(ConnectionState.CONNECTED);
            
            // Setup Input Processing
            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Interruption
             const interrupted = message.serverContent?.interrupted;
             if (interrupted) {
               console.log('Interrupted');
               setIsSpeaking(false);
               if (outputAudioContextRef.current) {
                 // Cancel scheduled audio
                 nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
               }
               sourcesRef.current.forEach(s => {
                   try { s.stop(); } catch(e){}
               });
               sourcesRef.current.clear();
               return;
             }

             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                setIsSpeaking(true);
                const ctx = outputAudioContextRef.current;
                
                // Ensure synchronization
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                try {
                    const audioBuffer = await decodeAudioData(
                        decodeBase64(base64Audio),
                        ctx,
                        24000
                    );

                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) {
                            setIsSpeaking(false);
                        }
                    });

                    source.start(nextStartTimeRef.current);
                    sourcesRef.current.add(source);
                    nextStartTimeRef.current += audioBuffer.duration;

                } catch (err) {
                    console.error("Error decoding audio", err);
                }
             }
          },
          onclose: () => {
            console.log('Session Closed');
            setConnectionState(ConnectionState.DISCONNECTED);
            cleanupAudio();
          },
          onerror: (err) => {
            console.error('Session Error', err);
            setConnectionState(ConnectionState.ERROR);
            setError("Connection error occurred.");
            cleanupAudio();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Connection failed", err);
      setConnectionState(ConnectionState.ERROR);
      setError(err.message || "Failed to connect to microphone or API.");
      cleanupAudio();
    }
  }, [cleanupAudio]);

  const disconnect = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        session.close();
      });
      sessionPromiseRef.current = null;
    }
    setConnectionState(ConnectionState.DISCONNECTED);
    cleanupAudio();
  }, [cleanupAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connect,
    disconnect,
    connectionState,
    isSpeaking,
    volume,
    error
  };
}