import React, { useEffect, useRef, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); 

  // Close menu if click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-tertiary shadow-xl border-b border-tertiary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-2xl font-black text-white">
              Sari-Sari <span className="text-accent"> CRM</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 text-white font-medium">
            <a href="#platform" className="hover:text-accent transition duration-150">Platform</a>
            <a href="#solutions" className="hover:text-accent transition duration-150">Solutions</a>
            <a href="#insights" className="hover:text-accent transition duration-150">Insights</a>
            <a href="#pricing" className="hover:text-accent transition duration-150">Pricing</a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden sm:flex items-center space-x-4">
            <a href="/login" className="text-sm font-medium text-white hover:text-accent transition duration-500">
              Log In
            </a>
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full shadow-lg border border-secondary text-white bg-secondary hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-500"
            >
              Start for Free
            </a>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex sm:hidden items-center relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? (
                <FiX className="w-6 h-6 text-white" />
              ) : (
                <FiMenu className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Floating Mobile Menu */}
            {menuOpen && (
              <div className="absolute top-11 right-0 mt-2 w-48 border border-tertiary rounded-lg shadow-lg z-50 bg-primary">
                <nav className="flex flex-col">
                  <a
                    href="/login"
                    className="block px-4 py-2 text-center text-tertiary bg-white hover:bg-accent hover:text-secondary transition rounded-t-lg"
                  >
                    Log In
                  </a>
                  <a
                    href="/signup"
                    className="block px-4 py-2 text-center text-tertiary bg-white hover:bg-secondary hover:text-white transition rounded-b-lg"
                  >
                    Start for Free
                  </a>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
