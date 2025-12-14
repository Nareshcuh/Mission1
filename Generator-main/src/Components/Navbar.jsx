import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Dropdown, DropdownItem } from "flowbite-react";

const Header = () => {
  const navigate = useNavigate();
  const [width, setwiddth] = useState(0);
  useEffect(() => {
    setwiddth(window.innerWidth);
    window.addEventListener("resize", () => {
      setwiddth(window.innerWidth);
    });
  }, []);
  if (width >= 768) {
  return (
    <div className="w-full flex px-10 py-3 items-center bg-[#192F59] shadow-lg">
      <header className="w-full flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img className="h-20 w-auto" src="img/logo.png" alt="Logo" />
        </Link>
        
        {/* Navigation Links */}
        <ul className="flex gap-8 items-center list-none text-lg font-semibold">
          <li>
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) => 
                isActive 
                  ? "text-yellow-400 font-bold border-b-2 border-yellow-400 px-2 pb-1" 
                  : "text-white hover:text-yellow-300 px-2 pb-1 transition-all"
              }
              style={{ textDecoration: "none" }}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/FAQ" 
              className={({ isActive }) => 
                isActive 
                  ? "text-yellow-400 font-bold border-b-2 border-yellow-400 px-2 pb-1" 
                  : "text-white hover:text-yellow-300 px-2 pb-1 transition-all"
              }
              style={{ textDecoration: "none" }}
            >
              FAQS
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/Guide" 
              className={({ isActive }) => 
                isActive 
                  ? "text-yellow-400 font-bold border-b-2 border-yellow-400 px-2 pb-1" 
                  : "text-white hover:text-yellow-300 px-2 pb-1 transition-all"
              }
              style={{ textDecoration: "none" }}
            >
              Reference Guide
            </NavLink>
          </li>
        </ul>
      </header>
    </div>
  );
}
else {
return (
  <div className="w-full flex p-2 py-3 items-center bg-[#192F59] shadow-lg">
      <header className="w-full flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img className="h-16 w-auto" src="img/logo.png" alt="Logo" />
        </Link>
        
        {/* Navigation Links */}
        
      <Dropdown className="list-none bg-blue-400 drop border-none p-2" label="Dropdown button" dismissOnClick={false}>
      <DropdownItem className="bg-blue-400 text-white border-none"> <NavLink 
              to="/" 
              end 
              className={({ isActive }) => 
                isActive 
                  ? "text-yellow-400 font-bold border-b-2 border-yellow-400 px-2 pb-1" 
                  : "text-white hover:text-yellow-300 px-2 pb-1 transition-all"
              }
              style={{ textDecoration: "none" }}
            >
              Home
            </NavLink></DropdownItem>
      <DropdownItem className="bg-blue-400 text-white border-none"><NavLink 
              to="/FAQ" 
              className={({ isActive }) => 
                isActive 
                  ? "text-yellow-400 font-bold border-b-2 border-yellow-400 px-2 pb-1" 
                  : "text-white hover:text-yellow-300 px-2 pb-1 transition-all"
              }
              style={{ textDecoration: "none" }}
            >
              FAQS
            </NavLink></DropdownItem>
      <DropdownItem className="bg-blue-400 text-white border-none"><NavLink 
              to="/Guide" 
              className={({ isActive }) => 
                isActive 
                  ? "text-yellow-400 font-bold border-b-2 border-yellow-400 px-2 pb-1" 
                  : "text-white hover:text-yellow-300 px-2 pb-1 transition-all"
              }
              style={{ textDecoration: "none" }}
            >
              Reference Guide
            </NavLink></DropdownItem>
    </Dropdown>

      </header>
    </div>
);}
}

export default Header;
