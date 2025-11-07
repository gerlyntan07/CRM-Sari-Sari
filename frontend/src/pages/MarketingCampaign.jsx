import React, { useState, useEffect } from "react";
import {
  FiMail,
  FiCalendar,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";

export default function MarketingCampaign() {
  useEffect(() => {
    document.title = "Campaign | Sari-Sari CRM";
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("All Statuses");

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    action: null,
    campaign: null,
  });

  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Christmas Promo 2025",
      subject: "🎄 Holiday Discounts Await You!",
      content:
        "Spread holiday cheer with exclusive deals this Christmas season!",
      status: "Scheduled",
      recipients: 1200,
      scheduleDate: "2025-12-15T10:00",
      created: "2025-10-20",
      createdBy: "Marketing Team",
    },
    {
      id: 2,
      name: "New Year Kickoff",
      subject: "Start 2026 with Big Savings!",
      content: "Kick off your year right with amazing offers from us!",
      status: "Draft",
      recipients: "",
      scheduleDate: "",
      created: "2025-10-25",
      createdBy: "Marketing Team",
    },
  ]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    subject: "",
    content: "",
    status: "Draft",
    recipients: "",
    scheduleDate: "",
  });

  // ===================== DYNAMIC FILTERED CAMPAIGNS =====================
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesStatus =
      filterCampaign === "All Statuses" || c.status === filterCampaign;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ===================== CRUD HANDLERS =====================
  const handleAddCampaign = () => {
    setEditMode(false);
    setFormData({
      id: null,
      name: "",
      subject: "",
      content: "",
      status: "Draft",
      recipients: "",
      scheduleDate: "",
    });
    setShowModal(true);
  };

  const handleEditCampaign = (campaign, e) => {
    e.stopPropagation();
    setEditMode(true);
    setFormData(campaign);
    setShowModal(true);
  };

  const handleDeleteCampaign = (campaign, e) => {
    e.stopPropagation();
    setConfirmModal({
      show: true,
      action: "delete",
      campaign,
    });
  };

  const handleSaveCampaign = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      action: editMode ? "edit" : "add",
      campaign: { ...formData },
    });
  };

  const confirmAction = () => {
    if (confirmModal.action === "add") {
      const newCampaign = {
        ...confirmModal.campaign,
        id: Date.now(),
        created: new Date().toLocaleDateString(),
        createdBy: "Marketing Team",
      };
      setCampaigns((prev) => [...prev, newCampaign]);
      setShowModal(false);
    } else if (confirmModal.action === "edit") {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === confirmModal.campaign.id ? { ...confirmModal.campaign } : c
        )
      );
      setShowModal(false);
    } else if (confirmModal.action === "delete") {
      setCampaigns((prev) =>
        prev.filter((c) => c.id !== confirmModal.campaign.id)
      );
    }
    setConfirmModal({ show: false, action: null, campaign: null });
  };

  const cancelAction = () => {
    setConfirmModal({ show: false, action: null, campaign: null });
  };

  const handleCampaignClick = (campaign) => setSelectedCampaign(campaign);
  const handleBackToList = () => setSelectedCampaign(null);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") setShowModal(false);
  };

  // ===================== DETAILS VIEW =====================
  if (selectedCampaign) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 font-inter">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-6 cursor-pointer"
        >
          <HiArrowLeft className="mr-1 w-5 h-5" /> Back
        </button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {selectedCampaign.name}
            </h1>
            <span
              className={`text-xs sm:text-sm px-2 py-0.5 rounded ${
                selectedCampaign.status === "Scheduled"
                  ? "bg-yellow-100 text-yellow-700"
                  : selectedCampaign.status === "Sent"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {selectedCampaign.status}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Campaign Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Subject:</span> <br />
              {selectedCampaign.subject}
            </p>
            <p>
              <span className="font-semibold">Created By:</span> <br />
              {selectedCampaign.createdBy}
            </p>
            <p>
              <span className="font-semibold">Created On:</span> <br />
              {selectedCampaign.created}
            </p>
            <p>
              <span className="font-semibold">Scheduled Date:</span> <br />
              {selectedCampaign.scheduleDate
                ? new Date(selectedCampaign.scheduleDate).toLocaleString()
                : "—"}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold">Email Content:</span> <br />
              {selectedCampaign.content}
            </p>
            {selectedCampaign.status === "Scheduled" && (
              <p>
                <span className="font-semibold">Recipients:</span> <br />
                {selectedCampaign.recipients}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===================== MAIN TABLE VIEW =====================
  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiMail className="mr-2 text-blue-600" /> Email Campaigns
        </h2>

        <button
          onClick={handleAddCampaign}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition text-sm sm:text-base shadow-sm"
        >
          ＋ New Campaign
        </button>
      </div>

      {/* ======= Search + Filters ======= */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        {/* Search Bar */}
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by campaign name or email subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="w-full lg:w-1/4">
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>All Statuses</option>
            <option>Draft</option>
            <option>Scheduled</option>
            <option>Sent</option>
          </select>
        </div>
      </div>

      {/* ===================== TABLE ===================== */}
      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full border border-gray-200 rounded-lg bg-white shadow-sm">
          <thead className="bg-gray-100 text-left text-sm text-gray-600">
            <tr>
              <th className="py-3 px-4">Campaign Name</th>
              <th className="py-3 px-4">Email Subject</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Recipients</th>
              <th className="py-3 px-4">Scheduled Date</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-700">
            {filteredCampaigns.map((c, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 cursor-pointer transition"
                onClick={() => handleCampaignClick(c)}
              >
                <td className="py-3 px-4 font-medium text-blue-600">
                  {c.name}
                </td>
                <td className="py-3 px-4">{c.subject}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      c.status === "Scheduled"
                        ? "bg-yellow-100 text-yellow-700"
                        : c.status === "Sent"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {c.recipients ? `${c.recipients} emails` : "—"}
                </td>
                <td className="py-3 px-4">
                  {c.scheduleDate
                    ? new Date(c.scheduleDate).toLocaleString()
                    : "—"}
                </td>
                <td
                  className="py-3 px-4 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={(e) => handleEditCampaign(c, e)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCampaign(c, e)}
                      className="text-red-500 hover:text-red-700"
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

      {/* ===================== ADD/EDIT MODAL ===================== */}
      {showModal && (
        <div
          id="modalBackdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        >
          <div
            className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              {editMode ? "Edit Campaign" : "Add New Campaign"}
            </h2>

            <form
              onSubmit={handleSaveCampaign}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
            >
              {/* Campaign Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Summer Sale Blast"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Email Subject */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Email Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Big discounts await you!"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Campaign Status */}
              <div className="flex flex-col sm:col-span-2">
                <label className="text-gray-700 font-medium mb-1">
                  Campaign Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Sent">Sent</option>
                </select>
              </div>

              {/* Scheduled + Recipients (only if Scheduled) */}
              {formData.status === "Scheduled" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
                  <div className="flex flex-col">
                    <label className="text-gray-700 font-medium mb-1">
                      Scheduled Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduleDate"
                      value={formData.scheduleDate}
                      onChange={handleChange}
                      required
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-gray-700 font-medium mb-1">
                      Recipient Count <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="recipients"
                      value={formData.recipients}
                      onChange={handleChange}
                      placeholder="e.g. 500"
                      required
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Email Content */}
              <div className="flex flex-col sm:col-span-2">
                <label className="text-gray-700 font-medium mb-1">
                  Email Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  rows={4}
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write your email message here..."
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 sm:col-span-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CONFIRMATION MODAL ===================== */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative border border-gray-200">
            <button
              onClick={cancelAction}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              {confirmModal.action === "delete"
                ? "Confirm Delete"
                : confirmModal.action === "edit"
                ? "Confirm Edit"
                : "Confirm Add"}
            </h2>

            <p className="text-center text-gray-600 mb-6">
              {confirmModal.action === "delete" ? (
                <>
                  Are you sure you want to delete the campaign{" "}
                  <span className="font-semibold">
                    {confirmModal.campaign.name}
                  </span>
                  ?
                </>
              ) : confirmModal.action === "edit" ? (
                <>
                  Save changes to{" "}
                  <span className="font-semibold">
                    {confirmModal.campaign.name}
                  </span>
                  ?
                </>
              ) : (
                <>
                  Add new campaign{" "}
                  <span className="font-semibold">
                    {confirmModal.campaign.name}
                  </span>
                  ?
                </>
              )}
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
