import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUsers,
  FiDownload,
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";
import { BsBuilding } from "react-icons/bs";

export default function MarketingContacts() {
  useEffect(() => {
    document.title = "Contacts | Sari-Sari CRM";
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: "John Smith",
      title: "Marketing Director",
      account: "Acme Corporation",
      email: "john.smith@acme.com",
      phone1: "+1-555-0101",
      phone2: "+1-555-0102",
      department: "Marketing",
      assigned: "Jane Sales",
      created: "1/10/2024",
      mobile: "09217229846",
      workPhone: "(555) 123-4567",
      createdBy: "John Appleseed",
      lastUpdated: "2025-09-21 15:30",
      notes: "Key marketing partner for Q4 campaigns.",
    },
  ]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    workPhone: "",
    title: "",
    department: "",
    phone1: "",
    phone2: "",
    account: "",
    assigned: "",
    notes: "",
  });

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") setShowModal(false);
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackToList = () => {
    setSelectedContact(null);
  };

  const handleAddContact = () => {
    setEditMode(false);
    setFormData({
      id: null,
      name: "",
      email: "",
      workPhone: "",
      title: "",
      department: "",
      phone1: "",
      phone2: "",
      account: "",
      assigned: "",
      notes: "",
    });
    setShowModal(true);
  };

  const handleEditContact = (contact, e) => {
    e.stopPropagation();
    setEditMode(true);
    setFormData(contact);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (editMode) {
      // Update existing contact
      setContacts((prev) =>
        prev.map((c) => (c.id === formData.id ? { ...formData } : c))
      );
    } else {
      // Add new contact
      const newContact = {
        ...formData,
        id: Date.now(),
        created: new Date().toLocaleDateString(),
        createdBy: "Admin User",
      };
      setContacts((prev) => [...prev, newContact]);
    }
    setShowModal(false);
  };

  // ===================== CONTACT DETAILS VIEW ===================== //
  if (selectedContact) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 font-inter">
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
            <button className="w-full sm:w-auto bg-gray-800 text-white px-5 py-2 rounded-md hover:bg-gray-900 transition flex items-center gap-2">
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 w-full max-w-full lg:max-w-6xl shadow-sm overflow-x-auto mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
            Contact Details
          </h2>

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
              {selectedContact.phone1}
            </p>
            <p>
              <span className="font-semibold">Last Updated:</span> <br />
              {selectedContact.lastUpdated}
            </p>
          </div>

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" /> Contacts Management
        </h2>

        <button
          onClick={handleAddContact}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base transition"
        >
          ＋ Add Contact
        </button>
      </div>

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
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => handleEditContact(c, e)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FiEdit />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Contact Modal */}
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
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
            >
              <FiX size={22} />
            </button>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
              {editMode ? "Edit Contact" : "Add New Contact"}
            </h2>

            <form
              onSubmit={handleSaveContact}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Work Phone
                  </label>
                  <input
                    type="text"
                    name="workPhone"
                    value={formData.workPhone}
                    onChange={handleChange}
                    placeholder="09 --- --- ---"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Job title"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Marketing / Sales"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Phone Number 1
                  </label>
                  <input
                    type="text"
                    name="phone1"
                    value={formData.phone1}
                    onChange={handleChange}
                    placeholder="09 --- --- ---"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Account
                  </label>
                  <input
                    type="text"
                    name="account"
                    value={formData.account}
                    onChange={handleChange}
                    placeholder="Company name"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Assign To
                  </label>
                  <select
                    name="assigned"
                    value={formData.assigned}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="">Assign To</option>
                    <option value="Smith">Smith</option>
                    <option value="Doe">Doe</option>
                    <option value="Jane Sales">Jane Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Phone Number 2
                  </label>
                  <input
                    type="text"
                    name="phone2"
                    value={formData.phone2}
                    onChange={handleChange}
                    placeholder="09 --- --- ---"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col col-span-1 sm:col-span-2 md:col-span-3">
                <label className="text-gray-700 font-medium mb-1 text-sm">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional details..."
                  rows={3}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

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
                  className="px-4 py-2 text-white bg-blue-600 border border-blue-500 rounded hover:bg-blue-700 transition"
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
