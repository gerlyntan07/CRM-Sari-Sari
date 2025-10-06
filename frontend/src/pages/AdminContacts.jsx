import React from "react";
import { FiSearch, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminContacts() {
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
          <button className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded flex items-center space-x-1">
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

            {/* Empty row for layout like screenshot */}
            <tr>
              <td className="border px-4 py-6"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
