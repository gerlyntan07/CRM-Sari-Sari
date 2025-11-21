import React, { useState } from "react";
import { FiX, FiPhone, FiMail, FiCalendar, FiFileText, FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminDealsQuickAction from "../components/AdminDealsQuickAction";

export default function AdminDealsInformation({
  selectedDeal,
  show,
  onClose,
  activeTab,
  setActiveTab,
  onEdit,
  onDelete,
}) {

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteName, setNoteName] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [notes, setNotes] = useState([
    {
      id: 1,
      name: "Mary Jane",
      time: "22/10/2024 12:18 PM",
      content:
        "Please review the contract and confirm signatures. We'll follow up with the legal team on Monday.",
    },
    {
      id: 2,
      name: "Jacob Jones",
      time: "20/10/2024 09:45 AM",
      content:
        "Client requested a revised quote with extended payment terms (60 days). Prepare a draft.",
    },
  ]);
  if (!show || !selectedDeal) return null;

  function formatTimestamp(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${day}/${month}/${year} ${pad(hour12)}:${minutes} ${ampm}`;
  }

  function handleSaveNote(e) {
    e.preventDefault();
    if (!noteName.trim() || !noteContent.trim()) return;

    const newNote = {
      id: Date.now(),
      name: noteName.trim(),
      content: noteContent.trim(),
      time: formatTimestamp(new Date()),
    };

    setNotes((prev) => [...prev, newNote]);
    setNoteName("");
    setNoteContent("");
    setShowNoteModal(false);
  }

  function formattedDateTime(datetime) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] font-inter p-2 sm:p-4 overflow-x-hidden">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto hide-scrollbar relative box-border p-4 sm:p-6 md:p-8">

        {/* HEADER */}
        <div className="flex flex-col gap-2 sm:gap-4 mb-4">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold break-words">{selectedDeal.name}</h1>
                <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-1 rounded-full break-words">
                  {selectedDeal.stage}
                </span>
              </div>
              <p className="text-gray-500 text-sm break-words">Created on {formattedDateTime(selectedDeal.created_at)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  ₱ {selectedDeal.amount.toLocaleString()}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="w-full sm:w-40 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${selectedDeal.probability}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 break-words">{selectedDeal.probability}% Complete</p>
              <div className="flex items-center gap-2 sm:gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onEdit) {
                      onEdit(selectedDeal);
                    }
                  }}
                  className="inline-flex items-center justify-center bg-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <FiEdit2 className="mr-1 sm:mr-2" size={16} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete) {
                      onDelete(selectedDeal);
                    }
                  }}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <FiTrash2 className="mr-1 sm:mr-2" size={16} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 mb-6"></div>

        {/* TABS */}
        <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
          {["Overview", "Notes", "Activities"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium text-center transition-all duration-200 border-b-2
                ${activeTab === tab
                  ? "bg-paper-white text-[#6A727D] border-white"
                  : "text-white hover:bg-[#5c636d]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* LEFT + RIGHT COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-3 space-y-6">

            {/* OVERVIEW */}
            {activeTab === "Overview" && (
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 w-full">
                {/* Deal Info */}
                <div className="bg-white border border-gray-100 rounded-lg p-4 sm:p-5 shadow-sm pb-20 break-words">
                  <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3">Deal Information</h4>
                  <p className="text-sm sm:text-sm text-gray-700 mb-2 py-5 break-words">
                    <strong>Description:</strong> {selectedDeal.description}
                  </p>
                  <div className="h-px bg-gray-200 w-full" />
                  <p className="text-sm sm:text-sm text-gray-700 mb-2 py-5 break-words">
                    <strong>Expected Close Date:</strong> {selectedDeal.close_date}
                  </p>
                  <div className="h-px bg-gray-200 w-full" />

                  {/* Progressbar */}
                  <div className="mt-4 py-3 w-full">
                    <div className="relative flex flex-col w-full">
                      <div className="absolute top-0 left-0 right-0 flex items-center justify-between w-full">
                        {["green", "green", "orange", "gray", "gray"].map((color, i) => (
                          <React.Fragment key={i}>
                            <div
                              className={`relative z-10 w-6 h-6 rounded-full border-2 ${color === "green"
                                  ? "bg-green-500 border-green-500"
                                  : color === "orange"
                                    ? "bg-orange-400 border-orange-400"
                                    : "bg-gray-300 border-gray-300"
                                }`}
                            />
                            {i < 4 && <div className="flex-grow h-1 bg-gray-200 mx-1 min-w-0"></div>}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="flex justify-between mt-8 gap-2 text-[9px] lg:text-[9px] sm:text-xs text-gray-600 w-full">
                        {["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed"].map(
                          (label, i) => (
                            <span key={i} className="text-center flex-1 break-words">
                              {label}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-orange-600 font-medium mt-6 text-center break-words">
                      {selectedDeal.stage}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white border border-gray-100 rounded-lg p-4 sm:p-5 shadow-sm break-words">
                  <h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
                  <div className="text-sm sm:text-sm text-gray-700 space-y-3">
                    <p><strong>Account:</strong> {selectedDeal.account?.name}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Primary Contact:</strong> {selectedDeal.contact?.first_name} {selectedDeal.contact?.last_name}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Phone:</strong> {selectedDeal.contact?.work_phone}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Email:</strong> {selectedDeal.contact?.email}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Assigned To:</strong> {selectedDeal.assigned_deals?.first_name} {selectedDeal.assigned_deals?.last_name}</p>
                  </div>
                </div>
              </div>
            )}

             {/* NOTES */}
            {activeTab === "Notes" && (
              <div className="mt-4 w-full">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 break-words">Deals Note</h3>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition"
                  >
                    Add Note
                  </button>
                </div>

                <div className="space-y-4 w-full">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm break-words">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800 break-words">{n.name}</p>
                          <p className="text-xs text-gray-500 mt-1 break-words">{n.time}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-700 break-words">{n.content}</div>
                    </div>
                  ))}
                  <div className="bg-white border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400 break-words">
                    No more notes
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITIES */}
            {activeTab === "Activities" && (
              <div className="mt-4 space-y-4 w-full">
                <h3 className="text-lg font-semibold text-gray-800 break-words">Recent Activities</h3>

                {[{
                  icon: FiPhone,
                  title: "Schedule Call",
                  desc: "Discuss implementation timeline and pricing",
                  user: "Lester James",
                  date: "December 12, 2025 at 8:00 AM",
                }, {
                  icon: FiCalendar,
                  title: "Meeting regarding Enterprise Software License",
                  desc: "Discuss implementation timeline and pricing",
                  user: "Lester James",
                  date: "December 12, 2025 at 8:00 AM",
                }].map((act, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between items-start border border-gray-200 rounded-lg p-4 shadow-sm bg-white w-full break-words">
                    <div className="flex gap-4 mb-2 sm:mb-0 flex-1 min-w-0">
                      <div className="text-gray-600 mt-1">
                        <act.icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 break-words">{act.title}</h4>
                        <p className="text-sm text-gray-500 break-words">{act.desc}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0"></div>
                          <p className="text-sm text-gray-700 break-words">{act.user}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 break-words">{act.date}</p>
                  </div>
                ))}
              </div>
            )}

            {/* EDIT */}
            {activeTab === "Edit" && (
              <div className="mt-4 space-y-4 w-full">
                <h3 className="text-lg font-semibold text-gray-800 break-words">Edit Deal</h3>
                <div className="bg-white border border-gray-100 rounded-lg p-4 sm:p-5 shadow-sm w-full">
                  <label className="block mb-3 break-words">
                    <span className="text-sm text-gray-700">Deal Name</span>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                      defaultValue={selectedDeal.name}
                    />
                  </label>
                  <label className="block mb-3 break-words">
                    <span className="text-sm text-gray-700">Description</span>
                    <textarea
                      className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-24 resize-y focus:outline-none focus:ring-2 focus:ring-gray-200"
                      defaultValue={selectedDeal.description}
                    />
                  </label>
                  <button className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-auto">
            <AdminDealsQuickAction selectedDeal={selectedDeal} />
          </div>
        </div>

        {/* ADD NOTE MODAL */}
        {showNoteModal && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNoteModal(false)}
          >
            <div
              className="bg-white w-full max-w-full sm:max-w-md rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowNoteModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
              >
                <FiX size={22} />
              </button>

              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                Add Note
              </h2>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 font-medium mb-1 break-words">
                    Name
                  </label>
                  <input
                    type="text"
                    value={noteName}
                    onChange={(e) => setNoteName(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none w-full"
                    placeholder="Your name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 font-medium mb-1 break-words">
                    Note
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm h-28 resize-y focus:ring-2 focus:ring-blue-400 outline-none w-full"
                    placeholder="Write your note here..."
                  />
                </div>
                <div className="flex justify-end gap-3 flex-wrap mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteModal(false);
                      setNoteName("");
                      setNoteContent("");
                    }}
                    className="px-4 py-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
