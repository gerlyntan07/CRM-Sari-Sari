import React, { useState, useEffect } from "react";
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
import { HiArrowLeft } from "react-icons/hi";
import { BsBuilding } from "react-icons/bs";

export default function AdminContacts() {
  useEffect(() => {
    document.title = "Contacts | Sari-Sari CRM";
  }, []);

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
      <div className="p-4 sm:p-6 lg:p-8 font-inter">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-4 sm:mb-6 cursor-pointer"
        >
          <HiArrowLeft className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {selectedContact.account}
            </h1>
            <span className="mt-1 sm:mt-0 bg-blue-600 text-white text-xs sm:text-sm px-2 py-0.5 rounded w-fit">
              Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-3 sm:mt-0">
            <button className="w-full sm:w-auto bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600">
              Delete
            </button>
            <button className="w-full sm:w-auto bg-gray-800 text-white px-5 py-2 rounded-md hover:bg-gray-900">
              Export
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 w-full max-w-full lg:max-w-6xl shadow-sm overflow-x-auto mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
            Contact Details
          </h2>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
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

          {/* Notes Section */}
          <div className="mt-6 border-gray-200 pt-4">
            <h3 className="text-md sm:text-lg font-semibold text-gray-800 mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {selectedContact.notes
                ? selectedContact.notes
                : "No additional notes were provided for this contact."}
            </p>
          </div>
        </div>

      </div>
    );
  }

  // ===================== CONTACTS TABLE VIEW ===================== //
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" /> Contacts Management
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 w-auto sm:w-auto ml-auto sm:ml-0 text-sm sm:text-base"
        >
          ＋ Add Contact
        </button>

      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm w-full sm:w-auto">
          <option>All Accounts</option>
          <option>Acme Corporation</option>
          <option>TechStart Inc</option>
          <option>Global Solutions Ltd</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border border-gray-200 rounded-lg bg-white shadow-sm">
          <thead className="bg-gray-100 text-left text-sm text-gray-600">
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

          <tbody className="text-xs text-gray-700">
            {contacts.map((c, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleContactClick(c)}
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-blue-600 hover:underline break-all">
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

            {/* Header */}
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center space-x-2">
              Add New Contact
            </h2>

            {/* FORM */}
            <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {/* Column 1 */}
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Email</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Work Phone</label>
                  <input
                    type="text"
                    placeholder="09 --- --- ---"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Title</label>
                  <input
                    type="text"
                    placeholder="Job title"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Department</label>
                  <input
                    type="text"
                    placeholder="IT / Marketing"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Phone Number 1</label>
                  <input
                    type="text"
                    placeholder="09 --- --- ---"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Account</label>
                  <input
                    type="text"
                    placeholder=""
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Assign To</label>
                  <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                    <option value="">Assign To</option>
                    <option value="smith">Smith</option>
                    <option value="doe">Doe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Phone Number 2</label>
                  <input
                    type="text"
                    placeholder="09 --- --- ---"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col col-span-1 sm:col-span-2 md:col-span-3">
                <label className="text-gray-700 font-medium mb-1 text-sm">Notes</label>
                <textarea
                  placeholder="Additional details..."
                  rows={3}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4 col-span-1 sm:col-span-2 md:col-span-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
