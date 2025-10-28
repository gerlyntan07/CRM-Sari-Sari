import React, { useEffect, useState } from "react";
import { FiSearch, FiEdit2, FiTrash2, FiTarget, FiX } from "react-icons/fi";

export default function TManagerTargets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    document.title = "Target | Sari-Sari CRM";
  }, []);

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

  const handleBackdropClick = () => {
    setShowModal(false);
    setSelectedTarget(null);
    setIsEditing(false);
  };

  return (
    <div className="p-4 sm:p-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7 gap-3 sm:gap-0">
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiTarget className="mr-2 text-blue-600" /> Target
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedTarget(null);
              setShowModal(true);
              setIsEditing(true);
            }}
            className="flex items-center justify-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer w-full sm:w-auto"
          >
            ＋ Add Target
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center w-full lg:w-1/3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search Users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
            <option>Status</option>
            <option>Active</option>
            <option>Deactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow border border-gray-100 rounded-md">
        <table className="min-w-[800px] w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-600 text-sm font-bold">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Target Period</th>
              <th className="px-6 py-3">Target Amount</th>
              <th className="px-6 py-3">Achieved</th>
              <th className="px-6 py-3">Achievement %</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTargets.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-gray-50 transition duration-150 text-xs"
              >
                <td className="px-6 py-3 text-gray-800">{t.user}</td>
                <td className="px-6 py-3">{t.period}</td>
                <td className="px-6 py-3">₱{t.targetAmount.toLocaleString()}</td>
                <td className="px-6 py-3">₱{t.achieved.toLocaleString()}</td>
                <td className="px-6 py-3 text-green-600 font-semibold">
                  {t.achievement}%
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${t.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-3 flex justify-center gap-3">
                  <button
                    className="text-indigo-600 hover:text-indigo-800"
                    onClick={() => {
                      setSelectedTarget(t);
                      setIsEditing(true);
                      setShowModal(true);
                    }}
                  >
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

      {/* ======================== Add/Edit Target Modal ======================= */}
      {showModal && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-0 overflow-auto"
        >
          <div
            className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-10 scale-[0.95]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleBackdropClick}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              {isEditing ? "Edit Target" : "Add New Target"}
            </h2>

            {/* Form */}
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {/* User */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">User</label>
                <input
                  type="text"
                  defaultValue={selectedTarget?.user || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Target Period */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Target Period</label>
                <input
                  type="month"
                  defaultValue={selectedTarget?.period || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Target Amount */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Target Amount</label>
                <input
                  type="number"
                  defaultValue={selectedTarget?.targetAmount || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Achieved */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Achieved</label>
                <input
                  type="number"
                  defaultValue={selectedTarget?.achieved || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Status</label>
                <select
                  defaultValue={selectedTarget?.status || ""}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2 col-span-1 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleBackdropClick}
                  className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary w-full sm:w-auto"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
