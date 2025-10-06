import React from "react";
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
  FiDatabase, // 👈 Added this icon
} from "react-icons/fi";

export default function AdminAccounts() {
  const accounts = [
    {
      company: "Acme Corporation",
      url: "https://acme.com",
      status: "CUSTOMER",
      industry: "Technology",
      territory: "North Region",
      assignedTo: "Jane Sales",
      contact: "+1-555-0100",
    },
    {
      company: "TechStart Inc",
      url: "https://techstart.io",
      status: "PROSPECT",
      industry: "Software",
      territory: "South Region",
      assignedTo: "Jane Sales",
      contact: "+1-555-0200",
    },
    {
      company: "Global Solutions Ltd",
      url: "https://globalsolutions.com",
      status: "CUSTOMER",
      industry: "Consulting",
      territory: "West Region",
      assignedTo: "Jane Sales",
      contact: "+1-555-0300",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center space-x-3">
        <FiDatabase className="text-blue-600 text-3xl" /> {/* 👈 Icon added here */}
        <h1 className="text-2xl font-semibold text-gray-800">
          Accounts Management
        </h1>
      </div>

      {/* Summary Cards with Icons */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card title="Total" value="3" color="blue" icon={<FiUsers size={24} />} />
        <Card title="Customers" value="2" color="green" icon={<FiUserCheck size={24} />} />
        <Card title="Prospects" value="1" color="purple" icon={<FiUserPlus size={24} />} />
        <Card title="Partners" value="0" color="pink" icon={<FiUser size={24} />} />
        <Card title="Inactive" value="0" color="gray" icon={<FiUserX size={24} />} />
      </div>

      {/* Account List Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Account List</h2>
          <button className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">
            <FiPlus className="mr-2" /> Add Account
          </button>
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg bg-white shadow-sm">
            <thead className="bg-gray-100 text-left text-sm text-gray-600 border-b">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, i) => (
                <tr
                  key={i}
                  className="border-b hover:bg-gray-50 text-sm text-gray-700"
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-800">
                        {acc.company}
                      </div>
                      <a
                        href={acc.url}
                        className="text-gray-500 text-xs hover:underline"
                      >
                        {acc.url}
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        acc.status === "CUSTOMER"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{acc.industry}</td>
                  <td className="py-3 px-4">{acc.territory}</td>
                  <td className="py-3 px-4">{acc.assignedTo}</td>
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <FiPhone className="text-gray-500" />
                    <span>{acc.contact}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button className="text-blue-500 hover:text-blue-700">
                        <FiEdit />
                      </button>
                      <button className="text-red-500 hover:text-red-700">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Reusable Summary Card component with icon
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
