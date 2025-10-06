import React, { useState } from "react";
import { FiSearch, FiEdit, FiTrash2, FiX } from "react-icons/fi";

export default function AdminContacts() {
  const [showModal, setShowModal] = useState(false);

  // Close modal if user clicks on the backdrop
  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") {
      setShowModal(false);
    }
  };

  return (
    <div className="p-6">
      {/* Top controls */}
      <div className="flex items-center justify-between mb-4">
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Export to Excel
        </button>

        <div className="flex items-center space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Filter
          </button>

          {/* Search */}
          <div className="flex items-center border rounded px-2 py-1 w-64 bg-white">
            <FiSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by subject..."
              className="ml-2 flex-1 outline-none"
            />
          </div>

          {/* Add new contact */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded flex items-center space-x-1"
          >
            <span>Add New Contact</span>
            <span>✏️</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 bg-white shadow-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Account</th>
              <th className="border px-4 py-2 text-left">Title</th>
              <th className="border px-4 py-2 text-left">Department</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-left">Work Phone</th>
              <th className="border px-4 py-2 text-left">Assigned To</th>
              <th className="border px-4 py-2 text-left">Updated</th>
              <th className="border px-4 py-2 text-center">Edit</th>
            </tr>
          </thead>
          <tbody>
            {/* Example Row */}
            <tr>
              <td className="border px-4 py-2">Joshua Vergara</td>
              <td className="border px-4 py-2">Admin Corp</td>
              <td className="border px-4 py-2">Manager</td>
              <td className="border px-4 py-2">IT</td>
              <td className="border px-4 py-2">joshua@example.com</td>
              <td className="border px-4 py-2">+63 912 345 6789</td>
              <td className="border px-4 py-2">Maria Lopez</td>
              <td className="border px-4 py-2">2025-10-06</td>
              <td className="border px-4 py-2 flex justify-center space-x-3">
                <button className="text-blue-500 hover:text-blue-700">
                  <FiEdit />
                </button>
                <button className="text-red-500 hover:text-red-700">
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>

            <form className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Account</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Department</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Work Phone</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone 1</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone 2</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">Assigned To</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">Notes</label>
                <textarea rows="3" className="w-full border px-2 py-1 rounded"></textarea>
              </div>
            </form>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
