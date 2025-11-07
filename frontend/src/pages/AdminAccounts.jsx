import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";
import api from '../api.js'
import {toast} from 'react-toastify';

export default function AdminAccounts() {
  useEffect(() => {
    document.title = "Accounts | Sari-Sari CRM";
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [stageFilter, setStageFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  

  const fetchAccounts = async() => {
    try{
      const res = await api.get(`/accounts/admin/fetch-all`);
      setAccounts(res.data)
      console.log(res.data)
    } catch(err){
      if (err.response && err.response.status === 403) {
      toast.error("Permission denied. Only CEO, Admin, or Group Manager can access this page.");
    } else {
      toast.error("Failed to fetch accounts. Please try again later.");
    }
    console.error(err);
    }
  }

  useEffect(() => {
    fetchAccounts();
  },[])

  const handleAccountClick = (acc) => setSelectedAccount(acc);
  const handleBackToList = () => setSelectedAccount(null);
  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") setShowModal(false);
  };

  function formattedDateTime(datetime){
    if (!datetime) return "";
    return new Date(datetime).toLocaleString("en-US", {
      month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    })
    .replace(",", "")
  }

  //count per status
  // count per status
// count per status
const total = accounts ? accounts.length : 0;
const customers = (accounts ?? []).filter(acc => acc.status?.toLowerCase() === 'customer').length;
const prospects = (accounts ?? []).filter(acc => acc.status?.toLowerCase() === 'prospect').length;
const partners = (accounts ?? []).filter(acc => acc.status?.toLowerCase() === 'partner').length;
const active = (accounts ?? []).filter(acc => acc.status?.toLowerCase() === 'active').length;
const inactive = (accounts ?? []).filter(acc => acc.status?.toLowerCase() === 'inactive').length;
const former = (accounts ?? []).filter(acc => acc.status?.toLowerCase() === 'former').length;

const filteredAccounts = (accounts ?? []).filter((acc) => {
        const matchesSearch =
            searchQuery === "" ||
            acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.territory?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStage =
        stageFilter === "" ||
        acc.status.toLowerCase().includes(stageFilter.toLowerCase())

        return matchesSearch && matchesStage;
    });

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
                {selectedAccount.name}
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded ${selectedAccount.status === "CUSTOMER"
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

            {/* Right Side: Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-3 sm:mt-0">
              <button className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                Delete
              </button>
              <button className="w-full sm:w-auto bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900">
                Export
              </button>
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
                href={selectedAccount.website}
                className="text-blue-600 hover:underline break-all"
              >
                {selectedAccount.website || '--'}
              </a>
            </p>

            <p>
              <span className="font-semibold">Industry:</span> <br />
              {selectedAccount.industry}
            </p>

            <p>
              <span className="font-semibold">Territory:</span> <br />
              {selectedAccount.territory?.name}
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
              {`${selectedAccount.acc_creator?.first_name} ${selectedAccount.acc_creator?.last_name}`} on {formattedDateTime(selectedAccount.created_at)}
            </p>

            <p>
              <span className="font-semibold">Last Updated:</span> <br />
              {formattedDateTime(selectedAccount.updated_at)}
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
          Accounts Management
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0"
        >
          <FiPlus className="mr-2" /> Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        <Card title="Total" value={total} color="black" icon={<FiUsers size={24} />} />         
        <Card title="Customers" value={customers} color="green" icon={<FiUserCheck size={24} />} />
        <Card title="Prospects" value={prospects} color="purple" icon={<FiUserPlus size={24} />} />
        <Card title="Partners" value={partners} color="pink" icon={<FiUser size={24} />} />
        <Card title="Active" value={active} color="blue" icon={<FiUserX size={24} />} />
        <Card title="Inactive" value={inactive} color="gray" icon={<FiUserX size={24} />} />     
        <Card title="Former" value={former} color="orange" icon={<FiUserX size={24} />} />          
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm w-full sm:w-auto"
        value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}>
          <option value='All'>All Status</option>
          <option value='Customer'>Customer</option>
          <option value='Prospect'>Prospect</option>
          <option value='Partner'>Partner</option>
          <option value='Active'>Active</option>
          <option value='Inactive'>Inactive</option>
          <option value='Former'>Former</option>
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
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredAccounts) && filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 text-xs cursor-pointer"
                onClick={() => handleAccountClick(acc)}
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-blue-600 hover:underline break-all">
                      {acc.name}
                    </div>
                    <div className="text-gray-500 text-xs break-all">{acc.website}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${acc.status === "CUSTOMER"
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
                <td className="py-3 px-4">{acc.territory?.name || '--'}</td>
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
            ))
            ) : (
              <tr>
                <td>No accounts available</td>
              </tr>
            )}
            
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        >
          <div
            className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
            >
              <FiX size={22} />
            </button>

            {/* Modal Header */}
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
              Add New Account
            </h2>

            {/* Form */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InputField label="Name" placeholder="Full name" />
              <InputField label="Website" placeholder="Website Link" />
              <InputField label="Phone Number" placeholder="09 --- --- ---" />
              <InputField label="Industry" placeholder="" />
              <InputField label="Billing Address" placeholder="" />
              <InputField label="Shipping Address" placeholder="" />
              <InputField label="Status" placeholder="" />
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Assign To
                </label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                  <option value="">Assign To</option>
                  <option value="sales">Doe</option>
                  <option value="sales">Smith</option>
                </select>
              </div>

              {/* Fixed Buttons */}
              <div className="flex flex-col sm:flex-row justify-end sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 col-span-1 md:col-span-2 mt-4 w-full">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== Reusable Components ===================== //

function Card({ title, value, color, icon }) {
  const colorClasses = {
    black: "text-black/60 bg-black/5",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    pink: "text-pink-600 bg-pink-50 border-pink-100",
    gray: "text-gray-600 bg-gray-50 border-gray-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
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

function InputField({ label, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
      />
    </div>
  );
}
