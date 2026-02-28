import React, { useState, useRef, useEffect } from "react";
import { getFlagEmoji } from "../utils/flagEmoji";

export default function CurrencyDropdown({ currencies, value, onChange, disabled, loading }) {
    const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedCurrency = currencies.find((c) => c.code === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (currencyCode) => {
    onChange(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed text-left flex items-center justify-between bg-white"
      >
        <span className="flex items-center gap-2">
          {selectedCurrency ? (
            <>
              <span className="text-2xl">{selectedCurrency.symbol}</span>
              <span className="font-semibold">{selectedCurrency.code}</span>
              <span className="mx-1">-</span>
              <span>{selectedCurrency.country}</span>
            </>
          ) : (
            <span className="text-gray-400">Select Currency</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              autoFocus
            />
          </div>
          {currencies
            .filter(curr =>
              curr.code.toLowerCase().includes(search.toLowerCase()) ||
              curr.country.toLowerCase().includes(search.toLowerCase()) ||
              curr.name.toLowerCase().includes(search.toLowerCase()) ||
              curr.symbol.toLowerCase().includes(search.toLowerCase())
            )
            .map((curr, idx) => {
              const displayIcon = curr.symbol;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(curr.code)}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2 border-b border-gray-100 last:border-b-0 ${
                    value === curr.code ? "bg-blue-100" : ""
                  }`}
                >
                  <span className="text-2xl select-none">{displayIcon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      <span className="font-semibold">{curr.code}</span>
                      <span className="mx-1">-</span>
                      <span>{curr.country}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {curr.name}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
