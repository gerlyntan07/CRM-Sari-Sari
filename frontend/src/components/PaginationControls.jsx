import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function PaginationControls({
  totalItems = 0,
  pageSize = 10,
  currentPage = 1,
  onPrev,
  onNext,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className = "",
  label = "records",
}) {
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const disabledPrev = currentPage <= 1 || totalItems === 0;
  const disabledNext = currentPage >= totalPages || totalItems === 0;

  const baseButtonClasses =
    "inline-flex items-center gap-1 px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-1";
  const activeClasses = "bg-black text-white hover:bg-gray-900";
  const disabledClasses =
    "bg-gray-200 text-gray-500 cursor-not-allowed focus:ring-transparent";

  // Universal input logic: always enforce integer >= 10, centered, compact, and no spinner, regardless of role or import context
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      {/* 1. Info Text */}
      <div className="text-sm text-gray-600 font-medium text-center sm:text-left w-full sm:w-auto order-1">
        Showing {totalItems === 0 ? 0 : startItem}-{endItem} of {totalItems}{" "}
        {label}
      </div>

      {/* 2. Rows Per Page Input (always works, all roles, all imports) */}
      {onPageSizeChange && (
        <div className="flex items-center justify-center gap-2 w-full sm:w-auto order-3 sm:order-2">
          <span className="text-sm text-gray-600 font-medium">
            Rows per page
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pageSize}
            onChange={e => {
              const val = e.target.value;
              // Only allow integer >= 10
              if (/^\d+$/.test(val)) {
                const num = parseInt(val, 10);
                if (num >= 10) onPageSizeChange(num);
                else onPageSizeChange(val); // allow typing but not set if < 10
              } else if (val === "") {
                // allow clearing for typing
                onPageSizeChange("");
              }
            }}
            onBlur={e => {
              // On blur, reset to 10 if invalid
              let num = parseInt(e.target.value, 10);
              if (isNaN(num) || num < 10) onPageSizeChange(10);
            }}
            className="border border-gray-300 rounded-md text-sm py-1 w-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center appearance-none"
            style={{ MozAppearance: 'textfield', textAlign: 'center', width: '2.5rem' }}
            autoComplete="off"
          />
        </div>
      )}

      {/* 3. Pagination Buttons */}
      <div className="flex items-center gap-3 justify-center sm:justify-end w-full sm:w-auto order-2 sm:order-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={disabledPrev}
          className={`${baseButtonClasses} ${
            disabledPrev ? disabledClasses : activeClasses
          }`}
        >
          <FiChevronLeft className="text-base" />
          Prev
        </button>
        <div className="text-sm font-semibold text-white bg-gray-900 border border-gray-900 shadow-sm px-3 py-1.5 rounded-full">
          Page {totalItems === 0 ? 0 : currentPage} of{" "}
          {totalItems === 0 ? 0 : totalPages}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={disabledNext}
          className={`${baseButtonClasses} ${
            disabledNext ? disabledClasses : activeClasses
          }`}
        >
          Next
          <FiChevronRight className="text-base" />
        </button>
      </div>
    </div>
  );
}
