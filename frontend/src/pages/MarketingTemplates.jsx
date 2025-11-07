import React, { useState, useEffect } from "react";
import { FiSearch, FiX, FiFileText, FiEdit2, FiTrash2 } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast"; // <-- Import react-hot-toast

const initialTemplates = [
  {
    id: 1,
    name: "Welcome E-mail",
    category: "Welcome",
    subject: "Welcome to {company}!",
    body: `Hi {name}, Welcome to {company}! We're excited to have you on board.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel quam vitae erat venenatis feugiat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.

Best regards, The Team`,
    createdBy: "Angel Angelo",
    date: "12/10/23",
  },
  {
    id: 2,
    name: "Product Demo Follow-up",
    category: "Follow-up",
    subject: "Thanks for checking out our demo",
    body: `Hi {name}, Thank you for taking the time to view our product demo.
Do you have any questions? Let's schedule a call to discuss how we can help {company}.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel quam vitae erat venenatis feugiat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.

Best, Sales Team`,
    createdBy: "Angel Angelo",
    date: "12/10/23",
  },
];

const categoryColors = {
  Welcome: "bg-orange-100 text-orange-700",
  "Follow-up": "bg-blue-100 text-blue-700",
  Newsletter: "bg-green-100 text-green-700",
  Promotional: "bg-purple-100 text-purple-700",
  default: "bg-gray-100 text-gray-800",
};

export default function MarketingTemplates() {
  useEffect(() => {
    document.title = "Templates | Sari-Sari CRM";
  }, []);

  const [templates, setTemplates] = useState(initialTemplates);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [search, setSearch] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("All Categories");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subject: "",
    body: "",
  });

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    action: null,
    template: null,
  });

  // ===================== HANDLERS =====================
  const handleBackdropClick = () => {
    setSelectedTemplate(null);
    setEditTemplate(null);
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTemplate = () => {
    setConfirmModal({
      show: true,
      action: "add",
      template: { ...formData },
    });
  };

  const handleEditClick = (template) => {
    setEditTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body: template.body,
    });
  };

  const handleUpdateTemplate = () => {
    setConfirmModal({
      show: true,
      action: "edit",
      template: { ...formData, id: editTemplate.id },
    });
  };

  const handleDelete = (template) => {
    setConfirmModal({
      show: true,
      action: "delete",
      template,
    });
  };

  const handleUseTemplate = (template) => {
    // Use toast instead of alert
    toast.success(`Template "${template.name}" selected for use!`);
    setConfirmModal({ show: false, action: null, template: null });
  };

  const confirmAction = () => {
    const t = confirmModal.template;
    if (confirmModal.action === "add") {
      const newTemplate = {
        ...t,
        id: templates.length + 1,
        createdBy: "You",
        date: new Date().toLocaleDateString(),
      };
      setTemplates((prev) => [newTemplate, ...prev]); // recent first
      setShowModal(false);
      setFormData({ name: "", category: "", subject: "", body: "" });
    } else if (confirmModal.action === "edit") {
      setTemplates(
        (prev) =>
          prev
            .map((temp) => (temp.id === t.id ? { ...t } : temp))
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            ) // recent first
      );
      setEditTemplate(null);
      setFormData({ name: "", category: "", subject: "", body: "" });
      setSelectedTemplate(null); // close card modal after edit
    } else if (confirmModal.action === "delete") {
      setTemplates((prev) => prev.filter((temp) => temp.id !== t.id));
      setSelectedTemplate(null);
    }
    setConfirmModal({ show: false, action: null, template: null });
  };

  const cancelAction = () => {
    setConfirmModal({ show: false, action: null, template: null });
  };

  const handleCardClick = (template) => setSelectedTemplate(template);

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterTemplate === "All Categories" || t.category === filterTemplate)
  );

  const renderCardContent = (t, isModal = false) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{t.name}</h2>
          <span
            className={`text-xs px-3 py-1 rounded-md ${
              categoryColors[t.category] || categoryColors.default
            }`}
          >
            {t.category}
          </span>
        </div>
        <p className="text-gray-600 mb-2 text-sm">{t.subject}</p>
        <div
          className={`text-gray-800 text-sm p-2 rounded-md ${
            isModal ? "bg-gray-50 max-h-40 overflow-y-auto" : "truncate"
          } whitespace-pre-line`}
          style={
            !isModal
              ? {
                  display: "-webkit-box",
                  WebkitLineClamp: 7,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }
              : {}
          }
        >
          {t.body}
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        {!isModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUseTemplate(t);
            }}
            className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-md text-sm hover:bg-gray-900 transition"
          >
            <FiFileText /> Use Template
          </button>
        )}

        {isModal && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(t);
              }}
              className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-md text-sm hover:bg-gray-900 transition"
            >
              <FiEdit2 /> Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(t);
              }}
              className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition"
            >
              <FiTrash2 /> Delete
            </button>
          </div>
        )}

        <p className="text-gray-400 text-xs text-right">
          Created by: {t.createdBy} | {t.date}
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiFileText className="mr-2 text-black" /> Templates
        </h2>
        <button
          onClick={() => {
            setShowModal(true);
            setEditTemplate(null);
            setFormData({ name: "", category: "", subject: "", body: "" });
          }}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition text-sm sm:text-base shadow-sm"
        >
          ＋ New Template
        </button>
      </div>

      {/* ======= Search + Filters ======= */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        {/* Search Bar */}
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by template name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="w-full lg:w-1/4">
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>All Categories</option>
            <option>Welcome</option>
            <option>Follow-up</option>
            <option>Newsletter</option>
            <option>Promotional</option>
          </select>
        </div>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            onClick={() => handleCardClick(t)}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl cursor-pointer flex flex-col justify-between h-80 transition"
          >
            <div className="h-2 w-full rounded-t-2xl bg-black" />
            <div className="p-4 flex-grow">{renderCardContent(t)}</div>
          </div>
        ))}
      </div>
      {/* ===================== CREATE / EDIT TEMPLATE MODAL ===================== */}
      {(showModal || editTemplate) && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        >
          <div
            className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-5 sm:p-6 relative border border-gray-200 my-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleBackdropClick}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
              {editTemplate ? "Edit Template" : "Create New Template"}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editTemplate ? handleUpdateTemplate() : handleCreateTemplate();
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
            >
              {/* Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Welcome Email"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                >
                  <option value="">Select Category</option>
                  <option value="Welcome">Welcome</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Newsletter">Newsletter</option>
                  <option value="Promotional">Promotional</option>
                </select>
              </div>

              {/* Subject */}
              <div className="flex flex-col sm:col-span-2">
                <label className="text-gray-700 font-medium mb-1">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Welcome to our service!"
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              {/* Body */}
              <div className="flex flex-col sm:col-span-2">
                <label className="text-gray-700 font-medium mb-1">
                  Email Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="body"
                  rows={4}
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Write your email message here..."
                  required
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 sm:col-span-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={handleBackdropClick}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
                >
                  {editTemplate ? "Update Template" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ===================== SELECTED CARD MODAL ===================== */}
      {selectedTemplate && !editTemplate && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
        >
          <div
            className="rounded-2xl shadow-lg cursor-default h-80 w-full max-w-md overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 w-full rounded-t-2xl bg-black" />
            <div className="p-4 flex-grow overflow-y-auto bg-gray-50">
              {renderCardContent(selectedTemplate, true)}
            </div>
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
                ? "Confirm Update"
                : confirmModal.action === "add"
                ? "Confirm Add"
                : "Confirm Use"}
            </h2>

            <p className="text-center text-gray-600 mb-6">
              {confirmModal.action === "delete" ? (
                <>
                  Are you sure you want to delete the template{" "}
                  <span className="font-semibold">
                    {confirmModal.template.name}
                  </span>
                  ?
                </>
              ) : confirmModal.action === "edit" ? (
                <>
                  Save changes to{" "}
                  <span className="font-semibold">
                    {confirmModal.template.name}
                  </span>
                  ?
                </>
              ) : confirmModal.action === "add" ? (
                <>
                  Add new template{" "}
                  <span className="font-semibold">
                    {confirmModal.template.name}
                  </span>
                  ?
                </>
              ) : (
                <>
                  Use template{" "}
                  <span className="font-semibold">
                    {confirmModal.template.name}
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
