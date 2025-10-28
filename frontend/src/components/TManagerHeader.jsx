import { useState, useRef, useEffect } from "react";
import { FiBell, FiUser, FiMenu } from "react-icons/fi";
import { useLocation } from "react-router-dom";

export default function TManagerHeader({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();


  const user = {
    first_name: "Jane",
    last_name: "Doe",
    profile_picture: "https://via.placeholder.com/40",
  };

  const routeTitles = {
    "/tmanager/dashboard": "Dashboard",
    "/tmanager/accounts": "Accounts",
    "/tmanager/contacts": "Contacts",
    "/treports": "Reports",
    "/tleads": "Leads",
    "/tmanager/Audit": "Audit",
    "/tmanager/targets": "Targets",
    "tmanager/leads": "Leads",
    "/tmanager/quotes": "Quotes",
  };

  const currentTitle = routeTitles[location.pathname] || "Team Manager Panel";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-3 border-b relative">
      <div className="flex items-center gap-3">
        {/* ✅ Burger Menu - Mobile Only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-700 hover:text-gray-900"
        >
          <FiMenu className="text-2xl" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{currentTitle}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative text-gray-600 hover:text-gray-800">
          <FiBell className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            3
          </span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
          >
            <img
              src={user.profile_picture}
              alt=""
              className="w-8 aspect-square object-cover rounded-full"
            />
            <span className="text-sm font-medium text-gray-700">
              {user.first_name} {user.last_name}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Profile Picture */}
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />

                {/* Name */}
                <h2 className="text-gray-800 font-semibold text-sm">
                  {user.first_name} {user.middle_name} {user.last_name}
                </h2>
              </div>

              {/* Menu Options */}
              <div className="mt-4 space-y-1 px-4 text-left">
                <button className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-2 rounded text-left">
                  Invite Your Team
                </button>
                <button className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-2 rounded text-left">
                  Manage Your Account
                </button>

                <div className="border-t border-gray-200 my-2"></div>

                <button
                  onClick={() => alert('Logged out!')}
                  className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-2 rounded text-left text-red-600 hover:text-red-700"
                >
                  Sign Out
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}
