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

export default function AdminContacts() {
  const [showModal, setShowModal] = useState(false);

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
    },
    {
      name: "Sarah Johnson",
      title: "CTO",
      account: "TechStart Inc",
      email: "sarah.johnson@techstart.io",
      phone1: "+1-555-0201",
      phone2: "+1-555-0202",
      department: "Technology",
      assigned: "Jane Sales",
      created: "1/15/2024",
    },
    {
      name: "Michael Brown",
      title: "VP Sales",
      account: "Global Solutions Ltd",
      email: "michael.brown@globalsolutions.com",
      phone1: "+1-555-0301",
      phone2: "+1-555-0302",
      department: "Sales",
      assigned: "Jane Sales",
      created: "1/5/2024",
    },
  ];

  // Close modal if backdrop is clicked
  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") {
      setShowModal(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center text-xl font-semibold text-gray-700">
          <FiUsers className="mr-2" /> Contacts Management
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span className="text-lg">＋</span>
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center border rounded px-3 py-2 w-96 bg-gray-50">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts by name, email, or title..."
            className="ml-2 flex-1 outline-none bg-transparent"
          />
        </div>
        <select className="border px-3 py-2 rounded bg-gray-50">
          <option>All Accounts</option>
          <option>Acme Corporation</option>
          <option>TechStart Inc</option>
          <option>Global Solutions Ltd</option>
        </select>
      </div>

      {/* Table: table-fixed + colgroup ensures stable column sizing */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="min-w-full table-fixed">
          {/* Specify widths so small columns don't wrap under others */}
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "6%" }} />
          </colgroup>

          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-6 py-3 border-b">Contact</th>
              <th className="px-6 py-3 border-b">Account</th>
              <th className="px-6 py-3 border-b">Contact Info</th>
              <th className="px-6 py-3 border-b">Department</th>
              <th className="px-6 py-3 border-b">Assigned To</th>
              <th className="px-6 py-3 border-b text-left">Created</th>
              <th className="px-6 py-3 border-b text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-700">
            {contacts.map((c, i) => (
              <tr key={i} className="border-t hover:bg-gray-50 align-top">
                {/* Contact */}
                <td className="px-6 py-4 align-middle">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.title}</p>
                  </div>
                </td>

                {/* Account */}
                <td className="px-6 py-4 align-middle">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <BsBuilding className="text-gray-500" />
                    <span>{c.account}</span>
                  </div>
                </td>

                {/* Contact Info */}
                <td className="px-6 py-4 align-middle text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FiMail className="text-gray-500" />
                      <span className="truncate">{c.email}</span>
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

                {/* Department */}
                <td className="px-6 py-4 align-middle text-sm">{c.department}</td>

                {/* Assigned To */}
                <td className="px-6 py-4 align-middle whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <FiUser className="text-gray-500" />
                    <span>{c.assigned}</span>
                  </div>
                </td>

                {/* Created */}
                <td className="px-6 py-4 align-middle whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="text-gray-500" />
                    <span>{c.created}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 align-middle whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-3">
                    <button
                      className="p-2 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                      aria-label="Delete"
                      title="Delete"
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

      {/* Modal */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
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
            <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>
            <form className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Account</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Department</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Work Phone</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone 1</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone 2</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">Assigned To</label>
                <input type="text" className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">Notes</label>
                <textarea rows="3" className="w-full border px-2 py-1 rounded"></textarea>
              </div>
            </form>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
