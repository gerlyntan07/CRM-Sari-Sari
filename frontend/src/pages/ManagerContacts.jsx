import React, { useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import { BsBuilding } from "react-icons/bs";

export default function ManagerContacts() {
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const contacts = [
    {
      name: "John Smith",
      title: "CEO",
      account: "Acme Corporation",
      email: "john.smith@acme.com",
      phone1: "+1-555-0101",
      phone2: "+1-555-0102",
      department: "Executive",
      assigned: "Jane Sales",
      created: "1/10/2024",
      mobile: "09217229846",
      workPhone: "(555) 123-4567",
      createdBy: "John Appleseed",
      lastUpdated: "2025-09-21 15:30",
    },
  ];

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") setShowModal(false);
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackToList = () => {
    setSelectedContact(null);
  };

  // ===================== CONTACT DETAILS VIEW ===================== //
  if (selectedContact) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {selectedContact.account}
          </h1>
          <span className="inline-block mt-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
            Active
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
            Contact Details
          </h2>
          <div className="grid grid-cols-3 gap-y-4 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Primary Contact:</span> <br />
              {selectedContact.name}
            </p>
            <p>
              <span className="font-semibold">Email:</span> <br />
              {selectedContact.email}
            </p>
            <p>
              <span className="font-semibold">Created By:</span> <br />
              {selectedContact.createdBy} on {selectedContact.created}
            </p>

            <p>
              <span className="font-semibold">Title:</span> <br />
              {selectedContact.title}
            </p>
            <p>
              <span className="font-semibold">Assigned To:</span> <br />
              {selectedContact.assigned}
            </p>
            <p>
              <span className="font-semibold">Work Phone:</span> <br />
              {selectedContact.workPhone}
            </p>

            <p>
              <span className="font-semibold">Account:</span> <br />
              {selectedContact.account}
            </p>
            <p>
              <span className="font-semibold">Mobile Phone:</span> <br />
              {selectedContact.mobile}
            </p>
            <p>
              <span className="font-semibold">Last Updated:</span> <br />
              {selectedContact.lastUpdated}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================== CONTACTS TABLE VIEW ===================== //
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" /> Contacts Management
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          ＋ Add Contact
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm">
          <option>All Accounts</option>
          <option>Acme Corporation</option>
          <option>TechStart Inc</option>
          <option>Global Solutions Ltd</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg bg-white shadow-sm">
          <thead className="bg-gray-100 text-left text-sm text-gray-600 border-b">
            <tr>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-700">
            {contacts.map((c, i) => (
              <tr
                key={i}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleContactClick(c)}
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-blue-600 hover:underline">
                      {c.name}
                    </div>
                    <div className="text-xs text-gray-500">{c.title}</div>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <BsBuilding className="text-gray-500" />
                    <span>{c.account}</span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FiMail className="text-gray-500" />
                      <span>{c.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiPhone className="text-gray-500" />
                      <span>{c.phone1}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiPhone className="text-gray-500" />
                      <span>{c.phone2}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4">{c.department}</td>

                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <FiUser className="text-gray-500" />
                    <span>{c.assigned}</span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="text-gray-500" />
                    <span>{c.created}</span>
                  </div>
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

      {/* Modal */}
      {showModal && (
  <div
    id="modalBackdrop"
    onClick={handleBackdropClick}
    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <div
      className="bg-white w-full max-w-4xl rounded-2xl shadow-lg p-8 relative border border-gray-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close Button */}
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
      >
        <FiX size={22} />
      </button>

      {/* Header */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
        <FiUser className="text-blue-600" />
        <span>Add New Contact</span>
      </h2>

      {/* Form */}
      <form className="grid grid-cols-3 gap-5 text-sm">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Title</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="e.g. Sales Manager"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Account</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Company name"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Department</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="e.g. IT, Marketing"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Work Phone</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Phone 1</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Phone 2</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Assigned To</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        <div className="col-span-3">
          <label className="block text-gray-700 font-medium mb-1">Notes</label>
          <textarea
            rows="3"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Additional details..."
          ></textarea>
        </div>
      </form>

     {/* Footer */}
              <div className="flex justify-end sm:col-span-2 mt-2 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
    </div>
  </div>
)}
    </div>
  );
}
