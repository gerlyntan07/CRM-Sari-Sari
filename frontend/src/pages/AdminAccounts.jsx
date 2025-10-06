import React, { useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPhone,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiUser,
  FiUserX,
  FiX,
  FiGlobe,
  FiMapPin,
  FiHome,
  FiLayers,
} from "react-icons/fi";

export default function AdminAccounts() {
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const accounts = [
    {
      company: "Acme Corporation",
      url: "https://acme.com",
      status: "CUSTOMER",
      industry: "Technology",
      territory: "North Region",
      phone_number: "+1-555-0100",
      billing_address: "123 Main St, North City",
      shipping_address: "456 Elm St, North City",
      created_by: "John Appleseed",
      created_date: "2024-01-10",
      last_updated: "2025-09-25 14:30",
    },
  ];

  const handleAccountClick = (acc) => setSelectedAccount(acc);
  const handleBackToList = () => setSelectedAccount(null);

  // ===================== ACCOUNT DETAILS VIEW ===================== //
  if (selectedAccount) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {selectedAccount.company}
          </h1>
          <span
            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
              selectedAccount.status === "CUSTOMER"
                ? "bg-green-600 text-white"
                : selectedAccount.status === "PROSPECT"
                ? "bg-purple-600 text-white"
                : selectedAccount.status === "PARTNER"
                ? "bg-pink-600 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {selectedAccount.status}
          </span>
        </div>

        <div className="flex space-x-3 mb-6">
          <button className="bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600">
            Delete
          </button>
          <button className="bg-gray-800 text-white px-5 py-2 rounded-md hover:bg-gray-900">
            Export
          </button>
          <button
            onClick={handleBackToList}
            className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500"
          >
            Back to List
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-3xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Account Details
          </h2>

          <div className="grid grid-cols-2 gap-y-4 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Website:</span> <br />
              <a
                href={selectedAccount.url}
                className="text-blue-600 hover:underline"
              >
                {selectedAccount.url}
              </a>
            </p>

            <p>
              <span className="font-semibold">Industry:</span> <br />
              {selectedAccount.industry}
            </p>

            <p>
              <span className="font-semibold">Territory:</span> <br />
              {selectedAccount.territory}
            </p>

            <p>
              <span className="font-semibold">Phone Number:</span> <br />
              {selectedAccount.phone_number}
            </p>

            <p>
              <span className="font-semibold">Billing Address:</span> <br />
              {selectedAccount.billing_address}
            </p>

            <p>
              <span className="font-semibold">Shipping Address:</span> <br />
              {selectedAccount.shipping_address}
            </p>

            <p>
              <span className="font-semibold">Created By:</span> <br />
              {selectedAccount.created_by} on {selectedAccount.created_date}
            </p>

            <p>
              <span className="font-semibold">Last Updated:</span> <br />
              {selectedAccount.last_updated}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================== ACCOUNTS TABLE VIEW ===================== //
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" />
          Accounts Management
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          <FiPlus className="mr-2" /> Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card title="Total" value="3" color="blue" icon={<FiUsers size={24} />} />
        <Card title="Customers" value="2" color="green" icon={<FiUserCheck size={24} />} />
        <Card title="Prospects" value="1" color="purple" icon={<FiUserPlus size={24} />} />
        <Card title="Partners" value="0" color="pink" icon={<FiUser size={24} />} />
        <Card title="Inactive" value="0" color="gray" icon={<FiUserX size={24} />} />
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm">
          <option>All Status</option>
          <option>Customer</option>
          <option>Prospect</option>
          <option>Partner</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg bg-white shadow-sm">
          <thead className="bg-gray-100 text-left text-sm text-gray-600 border-b">
            <tr>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Industry</th>
              <th className="py-3 px-4">Territory</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => (
              <tr
                key={i}
                className="border-b hover:bg-gray-50 text-sm text-gray-700 cursor-pointer"
                onClick={() => handleAccountClick(acc)}
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-blue-600 hover:underline">
                      {acc.company}
                    </div>
                    <div className="text-gray-500 text-xs">{acc.url}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      acc.status === "CUSTOMER"
                        ? "bg-green-100 text-green-700"
                        : acc.status === "PROSPECT"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {acc.status}
                  </span>
                </td>
                <td className="py-3 px-4">{acc.industry}</td>
                <td className="py-3 px-4">{acc.territory}</td>
                <td className="py-3 px-4 flex items-center space-x-2">
                  <FiPhone className="text-gray-500" />
                  <span>{acc.phone_number}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={(e) => e.target.id === "modalBackdrop" && setShowModal(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Add New Account</h2>

            <form className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Website</label>
                <div className="flex items-center border px-2 py-1 rounded">
                  <FiGlobe className="text-gray-500 mr-2" />
                  <input type="url" className="w-full outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Phone Number</label>
                <div className="flex items-center border px-2 py-1 rounded">
                  <FiPhone className="text-gray-500 mr-2" />
                  <input type="text" className="w-full outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Industry</label>
                <div className="flex items-center border px-2 py-1 rounded">
                  <FiLayers className="text-gray-500 mr-2" />
                  <input type="text" className="w-full outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Billing Address</label>
                <div className="flex items-center border px-2 py-1 rounded">
                  <FiHome className="text-gray-500 mr-2" />
                  <input type="text" className="w-full outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Shipping Address</label>
                <div className="flex items-center border px-2 py-1 rounded">
                  <FiMapPin className="text-gray-500 mr-2" />
                  <input type="text" className="w-full outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Territory</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select className="w-full border px-2 py-1 rounded">
                  <option value="PROSPECT">Prospect</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="PARTNER">Partner</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </form>

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
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Summary Card
function Card({ title, value, color, icon }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    pink: "text-pink-600 bg-pink-50 border-pink-100",
    gray: "text-gray-600 bg-gray-50 border-gray-100",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center border rounded-xl p-4 ${colorClasses[color]}`}
    >
      <div className="mb-2">{icon}</div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-sm font-medium">{title}</div>
    </div>
  );
}
