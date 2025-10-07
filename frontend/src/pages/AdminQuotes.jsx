import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiX,
  FiFileText,
} from "react-icons/fi";

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
      <div className="bg-white shadow-sm overflow-hidden border-b border-gray-500">
        <div className="grid grid-cols-9 bg-gray-100 font-medium text-gray-700 px-4 py-3 text-sm border-b border-gray-500">
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
            className="grid grid-cols-9 px-4 py-3 text-sm hover:bg-gray-50 transition gap-x-4 border-b border-gray-100 cursor-pointer"
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

      {/* Add Qoutes */}
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
            {/* Close */}
            <button
              onClick={handleBackdropClick}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            {/* View Quote (1 Column) */}
            {selectedQuote && !isEditing ? (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  Quote Details
                </h2>
                <div className="space-y-3 text-sm text-gray-700">
                  <div><span className="font-medium">Quote ID:</span> {selectedQuote.quoteId}</div>
                  <div><span className="font-medium">Account:</span> {selectedQuote.account}</div>
                  <div><span className="font-medium">Deal:</span> {selectedQuote.deal}</div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        selectedQuote.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedQuote.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedQuote.status}
                    </span>
                  </div>
                  <div><span className="font-medium">Total Amount:</span> {selectedQuote.totalAmount}</div>
                  <div><span className="font-medium">Presented By:</span> {selectedQuote.presentedBy}</div>
                  <div><span className="font-medium">Expiry Date:</span> {selectedQuote.expiryDate}</div>
                  <div><span className="font-medium">Assigned To:</span> {selectedQuote.assignedTo}</div>
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-gray-600 mt-1 text-sm">{selectedQuote.notes}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end mt-6 space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                  >
                    <FiEdit /> Edit
                  </button>
                  <button
                    onClick={() => alert('Quote deleted')}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Add/Edit Quote (2 Columns) */}
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  {selectedQuote ? "Edit Quote" : "Add New Quote"}
                </h2>

                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Quote ID", key: "quoteId", type: "text" },
                    { label: "Account", key: "account", type: "text" },
                    { label: "Deal", key: "deal", type: "text" },
                    { label: "Status", key: "status", type: "select" },
                    { label: "Total Amount", key: "totalAmount", type: "text" },
                    { label: "Presented By", key: "presentedBy", type: "text" },
                    { label: "Expiry Date", key: "expiryDate", type: "date" },
                    { label: "Assigned To", key: "assignedTo", type: "text" },
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col">
                      <label className="font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          defaultValue={selectedQuote?.[field.key] || "Pending"}
                          className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                          <option>Pending</option>
                          <option>Approved</option>
                          <option>Rejected</option>
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          defaultValue={selectedQuote?.[field.key] || ""}
                          className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                      )}
                    </div>
                  ))}

                  {/* Notes full width */}
                  <div className="flex flex-col sm:col-span-2">
                    <label className="font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      defaultValue={selectedQuote?.notes || ""}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end sm:col-span-2 mt-2 space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-red-500 border border-red-300 rounded hover:bg-red-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-green-600 border border-green-300 rounded hover:bg-green-50 transition"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
 