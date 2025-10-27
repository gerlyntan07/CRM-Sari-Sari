import React, { useState, useEffect } from "react";
import { FiSearch, FiEdit, FiTrash2, FiDownload, FiX, FiFileText } from "react-icons/fi";

export default function SalesQuotes() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    document.title = "Quotes | Sari-Sari CRM";
  }, []);

  const quotes = [
    {
      quoteId: "Q-2025-001",
      account: "Innovate Co.",
      deal: "Website Revamp Project for full e-commerce integration and redesign",
      status: "Pending",
      totalAmount: "₱125,000",
      presentedBy: "Jane Doe",
      expiryDate: "2025-10-10",
      assignedTo: "Joshua Vergara",
      notes:
        "Client requested initial pricing breakdown and additional feature estimation. Follow-up scheduled next week.",
    },
  ];

  const handleBackdropClick = () => {
    setShowModal(false);
    setShowDetailsModal(false);
    setSelectedQuote(null);
    setIsEditing(false);
  };

  const handleRowClick = (quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
    setIsEditing(false);
  };

  return (
    <div className="p-4 sm:p-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 sm:gap-0">
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiFileText className="mr-2 text-blue-600" /> Quotes
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => alert("Downloading quotes...")}
            className="flex items-center justify-center border border-tertiary text-tertiary px-4 py-2 gap-2 rounded-md hover:bg-gray-800 hover:text-white transition cursor-pointer w-full sm:w-auto"
          >
            <FiDownload /> Download
          </button>
          <button
            onClick={() => {
              setSelectedQuote(null);
              setShowModal(true);
              setIsEditing(true);
            }}
            className="flex items-center justify-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer w-full sm:w-auto"
          >
            ＋ Add Quote
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-8">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search Quotes..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm cursor-pointer w-full sm:w-auto">
          <option>All Quotes</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm overflow-x-auto">
        <div className="min-w-[900px] grid grid-cols-9 bg-gray-100 font-bold text-gray-600 px-4 py-3 text-sm">
          <div>Quotes ID</div>
          <div>Account</div>
          <div>Deal</div>
          <div>Status</div>
          <div>Total Amount</div>
          <div>Presented By</div>
          <div>Expiry Date</div>
          <div>Assigned To</div>
          <div className="text-center">Actions</div>
        </div>

        {quotes.map((quote, i) => (
          <div
            key={i}
            onClick={() => handleRowClick(quote)}
            className="min-w-[900px] grid grid-cols-9 px-4 py-3 text-xs hover:bg-gray-50 transition gap-x-4 cursor-pointer"
          >
            <div className="truncate">{quote.quoteId}</div>
            <div className="truncate">{quote.account}</div>
            <div className="truncate">{quote.deal}</div>
            <div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  quote.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : quote.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {quote.status}
              </span>
            </div>
            <div className="truncate">{quote.totalAmount}</div>
            <div className="truncate">{quote.presentedBy}</div>
            <div className="truncate">{quote.expiryDate}</div>
            <div className="truncate">{quote.assignedTo}</div>

            {/* Action Buttons */}
            <div
              className="flex justify-center space-x-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="text-blue-500 hover:text-blue-700">
                <FiEdit />
              </button>
              <button className="text-red-500 hover:text-red-700">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ======================== Add Quotes Modal ======================= */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-0"
        >
          <div
            className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-10 scale-[0.95] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              Add New Quotes
            </h2>

            {/* Form grid */}
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Deal Name</label>
                <input
                  type="text"
                  placeholder="Deals"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Amount</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Contact</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                  <option value="">Contact</option>
                  <option value="">galing sa contact po to</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Presented Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Validity Date</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Status</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                  <option>Draft</option>
                  <option>Presented</option>
                  <option>Accepted</option>
                  <option>Rejected</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Total Amount</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Created By</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Assign To</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                  <option>Assign To</option>
                  <option>Smith</option>
                  <option>Dinosaur</option>
                </select>
              </div>

              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="text-gray-700 font-medium mb-1">Notes</label>
                <textarea
                  placeholder="Additional details..."
                  rows={3}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2 col-span-1 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition-100 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition-100 w-full sm:w-auto"
                >
                  Save Quotes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== Quote Details Modal ======================= */}
      {showDetailsModal && selectedQuote && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 relative border border-gray-200 overflow-y-auto max-h-[85vh]"
          >
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              Quote Details
            </h2>

            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>Quote ID:</strong> {selectedQuote.quoteId}
              </p>
              <p>
                <strong>Account:</strong> {selectedQuote.account}
              </p>
              <p>
                <strong>Deal:</strong> {selectedQuote.deal}
              </p>
              <p>
                <strong>Status:</strong> {selectedQuote.status}
              </p>
              <p>
                <strong>Total Amount:</strong> {selectedQuote.totalAmount}
              </p>
              <p>
                <strong>Presented By:</strong> {selectedQuote.presentedBy}
              </p>
              <p>
                <strong>Expiry Date:</strong> {selectedQuote.expiryDate}
              </p>
              <p>
                <strong>Assigned To:</strong> {selectedQuote.assignedTo}
              </p>
              <p>
                <strong>Notes:</strong> {selectedQuote.notes}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowModal(true);
                  setShowDetailsModal(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition"
              >
                 Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this quote?')) {
                    alert(`Deleted quote ${selectedQuote.quoteId}`);
                    setShowDetailsModal(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition"
              >
                 Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
