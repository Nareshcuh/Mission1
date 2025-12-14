import React from 'react';
import { useGeminiLive } from './services/useGeminiLive';
import AudioVisualizer from './components/AudioVisualizer';
import { ConnectionState } from './types';

function App() {
  const { connect, disconnect, connectionState, isSpeaking, volume, error } = useGeminiLive();

  const handleToggleConnection = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.DISCONNECTED: return "Ready to Chat";
      case ConnectionState.CONNECTING: return "Connecting to Saathi...";
      case ConnectionState.CONNECTED: return isSpeaking ? "Saathi is speaking..." : "Listening...";
      case ConnectionState.ERROR: return "Connection Error";
      default: return "";
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.DISCONNECTED: return "text-gray-500";
      case ConnectionState.CONNECTING: return "text-blue-500";
      case ConnectionState.CONNECTED: return isSpeaking ? "text-indigo-600" : "text-emerald-600";
      case ConnectionState.ERROR: return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-3xl opacity-50 z-0"></div>

      <div className="z-10 w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col items-center p-8 border border-slate-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Saathi</h1>
          <p className="text-sm text-slate-500">Your Citation Assistant</p>
          <div className="mt-2 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full inline-block">
            Indian Bibliographic Reference Style
          </div>
        </div>

        {/* Visualizer Area */}
        <div className="relative w-64 h-64 mb-8 flex items-center justify-center bg-slate-50 rounded-full border border-slate-100 shadow-inner">
           <AudioVisualizer 
             isActive={connectionState === ConnectionState.CONNECTED}
             volume={volume}
             isSpeaking={isSpeaking}
           />
        </div>

        {/* Status Text */}
        <div className={`text-lg font-medium mb-8 transition-colors duration-300 ${getStatusColor()}`}>
          {getStatusText()}
        </div>

        {/* Controls */}
        <div className="w-full flex justify-center">
          <button
            onClick={handleToggleConnection}
            disabled={connectionState === ConnectionState.CONNECTING}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95
              ${connectionState === ConnectionState.CONNECTED 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}
              ${connectionState === ConnectionState.CONNECTING ? 'opacity-70 cursor-wait' : ''}
            `}
            aria-label={connectionState === ConnectionState.CONNECTED ? "End Conversation" : "Start Conversation"}
          >
            {connectionState === ConnectionState.CONNECTED ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100 w-full">
            {error}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-slate-100 w-full text-center">
          <p className="text-xs text-slate-400">
            Supports Hindi & English
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Powered by Gemini Live API
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;