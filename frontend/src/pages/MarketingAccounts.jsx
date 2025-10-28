import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiPhone,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiUser,
  FiUserX,
  FiX,
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";

export default function MarketingAccounts() {
  useEffect(() => {
    document.title = "Accounts | Sari-Sari CRM";
  }, []);

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
      <div className="p-4 sm:p-6 lg:p-8 font-inter">
        {/* Header */}
        <div className="mb-6">
          {/* Back Button */}
          <button
            onClick={handleBackToList}
            className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-4 sm:mb-6 cursor-pointer"
          >
            <HiArrowLeft className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> Back
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                {selectedAccount.company}
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded ${
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
              </h1>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
            Account Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Website:</span> <br />
              <a
                href={selectedAccount.url}
                className="text-blue-600 hover:underline break-all"
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" />
          Accounts List
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        <Card
          title="Total"
          value="3"
          color="blue"
          icon={<FiUsers size={24} />}
        />
        <Card
          title="Customers"
          value="2"
          color="green"
          icon={<FiUserCheck size={24} />}
        />
        <Card
          title="Prospects"
          value="1"
          color="purple"
          icon={<FiUserPlus size={24} />}
        />
        <Card
          title="Partners"
          value="0"
          color="pink"
          icon={<FiUser size={24} />}
        />
        <Card
          title="Inactive"
          value="0"
          color="gray"
          icon={<FiUserX size={24} />}
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm w-full sm:w-auto">
          <option>All Status</option>
          <option>Customer</option>
          <option>Prospect</option>
          <option>Partner</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Industry</th>
              <th className="py-3 px-4">Territory</th>
              <th className="py-3 px-4">Phone</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 text-xs cursor-pointer"
                onClick={() => handleAccountClick(acc)}
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-blue-600 hover:underline break-all">
                      {acc.company}
                    </div>
                    <div className="text-gray-500 text-xs break-all">
                      {acc.url}
                    </div>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== Reusable Components ===================== //

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
