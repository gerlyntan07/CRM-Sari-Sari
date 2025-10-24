// Header.jsx
import React from "react";

const Header = () => (
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

                {/* CTA Button */}
                <div className="flex items-center space-x-4">
                    <a href="/login" className="text-sm font-medium text-white hover:text-accent transition duration-500 hidden sm:block">
                        Log In
                    </a>
                    <a href="/signup" className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full shadow-lg border border-secondary text-white bg-secondary hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-500">
                        Start for Free 
                    </a>
                </div>
            </div>
        </div>
    </header>
);

export default Header;
