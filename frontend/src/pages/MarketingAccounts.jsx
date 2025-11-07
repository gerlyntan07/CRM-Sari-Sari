import React, { useEffect, useState, useMemo } from "react";
import {
  FiSearch,
  FiPhone,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiUser,
  FiUserX,
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";

export default function MarketingAccounts() {
  useEffect(() => {
    document.title = "Accounts | Sari-Sari CRM";
  }, []);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");

  const accounts = useMemo(
    () => [
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
      {
        company: "Beta Solutions",
        url: "https://beta.com",
        status: "PROSPECT",
        industry: "Finance",
        territory: "South Region",
        phone_number: "+1-555-0200",
        billing_address: "789 Pine St, South City",
        shipping_address: "101 Maple St, South City",
        created_by: "Jane Doe",
        created_date: "2024-03-05",
        last_updated: "2025-10-01 10:15",
      },
      {
        company: "Gamma Partners",
        url: "https://gamma.com",
        status: "PARTNER",
        industry: "Retail",
        territory: "East Region",
        phone_number: "+1-555-0300",
        billing_address: "234 Oak St, East City",
        shipping_address: "345 Birch St, East City",
        created_by: "Alice Smith",
        created_date: "2023-12-20",
        last_updated: "2025-08-15 09:45",
      },
      {
        company: "Delta Corp",
        url: "https://delta.com",
        status: "INACTIVE",
        industry: "Logistics",
        territory: "West Region",
        phone_number: "+1-555-0400",
        billing_address: "987 Cedar St, West City",
        shipping_address: "654 Pine St, West City",
        created_by: "Bob Johnson",
        created_date: "2023-11-15",
        last_updated: "2025-06-12 11:20",
      },
    ],
    []
  );

  const handleAccountClick = (acc) => setSelectedAccount(acc);
  const handleBackToList = () => setSelectedAccount(null);

  // ===================== Metrics ===================== //
  const METRICS = useMemo(() => {
    return [
      {
        title: "Total Accounts",
        value: accounts.length,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        icon: FiUsers,
      },
      {
        title: "Customers",
        value: accounts.filter((a) => a.status === "CUSTOMER").length,
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: FiUserCheck,
      },
      {
        title: "Prospects",
        value: accounts.filter((a) => a.status === "PROSPECT").length,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        icon: FiUserPlus,
      },
      {
        title: "Partners",
        value: accounts.filter((a) => a.status === "PARTNER").length,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        icon: FiUser,
      },
      {
        title: "Active",
        value: accounts.filter(
          (a) => a.status === "CUSTOMER" || a.status === "PARTNER"
        ).length,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: FiUserCheck,
      },
      {
        title: "Inactive",
        value: accounts.filter((a) => a.status === "INACTIVE").length,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        icon: FiUserX,
      },
      {
        title: "Former",
        value: accounts.filter((a) => a.status === "FORMER").length,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        icon: FiUserX,
      },
    ];
  }, [accounts]);

  // ===================== Account Details View ===================== //
  if (selectedAccount) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 font-inter">
        {/* Header */}
        <div className="mb-6">
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
                className="text-blue-600 hover:underline break-words"
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

  // ===================== Filtered Accounts ===================== //
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.company.toLowerCase().includes(search.toLowerCase()) ||
      acc.url.toLowerCase().includes(search.toLowerCase()) ||
      acc.industry.toLowerCase().includes(search.toLowerCase()) ||
      acc.territory.toLowerCase().includes(search.toLowerCase()) ||
      acc.phone_number.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "All Statuses" ||
      (filterStatus === "Active" &&
        (acc.status === "CUSTOMER" || acc.status === "PARTNER")) ||
      (filterStatus === "Inactive" && acc.status === "INACTIVE") ||
      (filterStatus === "Former" && acc.status === "FORMER") ||
      acc.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // ===================== Accounts Table View ===================== //
  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" />
          Accounts List
        </h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 md:grid-cols-4 gap-4 mb-6">
        {METRICS.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by company, website, industry, territory, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>

        <div className="w-full lg:w-1/4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>All Statuses</option>
            <option>Customer</option>
            <option>Prospect</option>
            <option>Partner</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Former</option>
          </select>
        </div>
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
            {filteredAccounts.map((acc, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 text-xs cursor-pointer"
                onClick={() => handleAccountClick(acc)}
              >
                <td className="py-3 px-4 break-words">
                  <div>
                    <div className="font-medium text-blue-600 hover:underline break-words">
                      {acc.company}
                    </div>
                    <div className="text-gray-500 text-xs break-words">
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
                        : acc.status === "PARTNER"
                        ? "bg-pink-100 text-pink-700"
                        : acc.status === "INACTIVE"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {acc.status}
                  </span>
                </td>
                <td className="py-3 px-4 break-words">{acc.industry}</td>
                <td className="py-3 px-4 break-words">{acc.territory}</td>
                <td className="py-3 px-4 flex items-center space-x-2 break-words">
                  <FiPhone className="text-gray-500" />
                  <span>{acc.phone_number}</span>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No accounts match your search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== Metric Card Component ===================== //
const MetricCard = ({ icon: Icon, title, value, color, bgColor }) => (
  <div
    className="flex items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all duration-300"
    onClick={() => console.log(`Clicked: ${title}`)}
  >
    <div className={`flex-shrink-0 p-3 rounded-full ${bgColor} ${color} mr-4`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);
