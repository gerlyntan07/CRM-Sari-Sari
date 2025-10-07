import React, { useState } from "react";
import { FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function AdminTargets() {
  const [searchTerm, setSearchTerm] = useState("");

  const targets = [
    {
      id: 1,
      user: "Jane Sales",
      period: "October 2025",
      targetAmount: 100000,
      achieved: 80000,
      achievement: 80,
      status: "Active",
    },
  ];

  const filteredTargets = targets.filter((t) =>
    t.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <h1 className="text-xl font-semibold mb-6 text-gray-800">
        Sales Targets Management
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-2xl p-4 border border-gray-100">
          <h2 className="text-gray-500 text-sm">Active Targets</h2>
          <p className="text-2xl font-semibold text-gray-800 mt-1">1</p>
        </div>
        <div className="bg-white shadow rounded-2xl p-4 border border-gray-100">
          <h2 className="text-gray-500 text-sm">Total Target</h2>
          <p className="text-2xl font-semibold text-gray-800 mt-1">
            ₱100,000
          </p>
        </div>
        <div className="bg-white shadow rounded-2xl p-4 border border-gray-100">
          <h2 className="text-gray-500 text-sm">Total Achieved</h2>
          <p className="text-2xl font-semibold text-gray-800 mt-1">
            ₱80,000
          </p>
        </div>
        <div className="bg-white shadow rounded-2xl p-4 border border-gray-100">
          <h2 className="text-gray-500 text-sm">Overall Achievement</h2>
          <p className="text-2xl font-semibold text-green-600 mt-1">80%</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-1/3 mb-3 md:mb-0">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search user..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Add Target Button */}
        <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition">
          + Add Target
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-2xl border border-gray-100">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Target Period</th>
              <th className="px-6 py-3">Target Amount</th>
              <th className="px-6 py-3">Achieved</th>
              <th className="px-6 py-3">Achievement %</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTargets.map((t) => (
              <tr
                key={t.id}
                className="border-t hover:bg-gray-50 transition duration-150"
              >
                <td className="px-6 py-3 font-medium text-gray-800">{t.user}</td>
                <td className="px-6 py-3">{t.period}</td>
                <td className="px-6 py-3">₱{t.targetAmount.toLocaleString()}</td>
                <td className="px-6 py-3">₱{t.achieved.toLocaleString()}</td>
                <td className="px-6 py-3 text-green-600 font-semibold">
                  {t.achievement}%
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      t.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-3 flex justify-center gap-3">
                  <button className="text-indigo-600 hover:text-indigo-800">
                    <FiEdit2 />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
