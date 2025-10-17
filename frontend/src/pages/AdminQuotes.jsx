import React, { useState, useEffect } from "react";
import { FiSearch, FiEdit, FiTrash2, FiDownload, FiX, FiFileText, } from "react-icons/fi";

export default function AdminQuotes() {
  const [showModal, setShowModal] = useState(false);
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
    setSelectedQuote(null);
    setIsEditing(false);
  };

  const handleRowClick = (quote) => {
    setSelectedQuote(quote);
    setShowModal(true);
    setIsEditing(false);
  };

  return (
    <div className="p-8 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiFileText className="mr-2 text-blue-600" /> Quotes
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => alert("Downloading quotes...")}
            className="flex items-center border border-tertiary text-tertiary px-4 py-2 gap-2 rounded-md hover:bg-gray-800 hover:text-white transition cursor-pointer"
          >
            <FiDownload /> Download
          </button>
          <button
            onClick={() => {
              setSelectedQuote(null);
              setShowModal(true);
              setIsEditing(true);
            }}
            className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer"
          >
            ＋ Add Quote
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center space-x-3 mb-8">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search Quotes..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm mt-2 sm:mt-0 cursor-pointer">
          <option>All Quotes</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-9 bg-gray-100 font-medium text-gray-700 px-4 py-3 text-sm">
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
            className="grid grid-cols-9 px-4 py-3 text-xs hover:bg-gray-50 transition gap-x-4 cursor-pointer"
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

      {/* ========================Add Qoutes====================================================== */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
          <div
            className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-10 scale-[0.95]"
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
              {/* Deal Name*/}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Deal Name</label>
                <input
                  type="text"
                  placeholder="Deals"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Amount */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Amount</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Contact */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Contact</label>
                   <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                   Contact
                  </option>
                  <option value="">galing sa contact po to</option>
                </select>
              </div>

             {/* Presented Date */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Presented Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
              {/* Validity Date */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Validity Date</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>


              {/* Status */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Status</label>
                 <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                   Draft
                  </option>
                  <option value="">Presented</option>
                  <option value="">Accepted</option>
                  <option value="">Rejected</option>
                </select>
              </div>

              {/* Total Amount  */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Total Amount</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Created By */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Created By</label>
                <input
                  type="text"
                  placeholder=""
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/*Assign to */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Assign To</label>
                 <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Assign To
                  </option>
                  <option value="">Smith</option>
                  <option value="">Dinosaur</option>

                </select>
              </div>
               {/* Notes */}
              <div className="flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="text-gray-700 font-medium mb-1">Notes</label>
                <textarea
                  placeholder="Additional details..."
                  rows={3}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>
              {/* Footer */}
              <div className="flex justify-end space-x-2 mt-2 col-span-1 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition-100"
                >
                  Save Quotes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 