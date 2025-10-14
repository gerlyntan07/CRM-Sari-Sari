import React, { useState } from "react";
import { FiX, FiPhone, FiMail, FiCalendar, FiFileText } from "react-icons/fi";
import AdminDealsQuickAction from "./AdminDealsQuickAction";

export default function AdminDealsInformation({
  selectedDeal, show, onClose, activeTab, setActiveTab,
}) {
  if (!show || !selectedDeal) return null;

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] font-inter p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl h-[90vh] overflow-y-auto relative">

        {/* HEADER */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 mt-6">
          <div>
            <h1 className="text-xl font-semibold">{selectedDeal.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Created on {selectedDeal.closeDate}
            </p>
            <span className="mt-3 inline-block bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-1 rounded-full">
              {selectedDeal.status}
            </span>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900">
              ₱ {selectedDeal.value.toLocaleString()}
            </h2>
            <div className="w-40 bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${selectedDeal.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedDeal.progress}% Complete
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
{/* TABS */}
<div className="flex justify-start border border-gray-200 bg-[#6A727D] w-[62%] mx-10 text-white">
  <div className="w-full max-w-5xl flex">
    {["Overview", "Activities", "Notes", "Edit"].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-all duration-200 border-b-2
          ${
            activeTab === tab
              ? "bg-white text-[#6A727D] border-white"
              : "text-white hover:bg-[#5c636d]"
          }`}
      >
        {tab}
      </button>
    ))}
  </div>
</div>

        {/* LEFT + RIGHT COLUMNS */}
        <div className="p-6 grid lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* OVERVIEW */}
            {activeTab === "Overview" && (
              <div className="grid md:grid-cols-2 gap-6 ml-4">
                {/* Deal Info */}
                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm pb-20">
                  <h4 className="font-semibold text-gray-800 mb-3">Deal Information</h4>
                  <p className="text-sm text-gray-700 mb-2 py-7">
                    <strong>Description:</strong> {selectedDeal.description}
                  </p>
                  <div className="h-px bg-gray-200 w-full" />
                  <p className="text-sm text-gray-700 mb-2 py-6">
                    <strong>Expected Close Date:</strong> {selectedDeal.closeDate}
                  </p>
                  <div className="h-px bg-gray-200 w-full" />

                  {/* Progressbar */}
                  <div className="mt-4 py-3">
                    <div className="relative flex items-center justify-between w-full">
                      <div className="flex items-center justify-between w-full absolute top-0 left-0 right-0">
                        {["green", "green", "orange", "gray", "gray"].map((color, i) => (
                          <React.Fragment key={i}>
                            <div
                              className={`relative z-10 w-6 h-6 rounded-full border-2 ${
                                color === "green"
                                  ? "bg-green-500 border-green-500"
                                  : color === "orange"
                                  ? "bg-orange-400 border-orange-400"
                                  : "bg-gray-300 border-gray-300"
                              }`}
                            ></div>
                            {i < 4 && <div className="flex-grow h-1 bg-gray-200 mx-1"></div>}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="flex justify-between w-full mt-8 gap-5 text-[9px] text-gray-600">
                        {["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed"].map(
                          (label, i) => (
                            <span key={i} className="text-center flex-1">
                              {label}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-orange-600 font-medium mt-6 text-center">
                      {selectedDeal.stage}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
                  <div className="text-sm text-gray-700 space-y-5">
                    <p><strong>Account:</strong> {selectedDeal.account}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Primary Contact:</strong> {selectedDeal.contact}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Phone:</strong> {selectedDeal.phone}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Email:</strong> {selectedDeal.email}</p>
                    <div className="h-px bg-gray-200 w-full" />
                    <p><strong>Assigned To:</strong> {selectedDeal.owner}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITIES (RESTORED STATIC CONTENT) */}
            {activeTab === "Activities" && (
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>

                {/* Activity 1 */}
                <div className="flex justify-between items-start border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex gap-4">
                    <div className="text-gray-600 mt-1">
                      <FiPhone size={24} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Schedule Call</h4>
                      <p className="text-sm text-gray-500">
                        Discuss implementation timeline and pricing
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200"></div>
                        <p className="text-sm text-gray-700">Lester James</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">December 12, 2025 at 8:00 AM</p>
                </div>

                {/* Activity 2 */}
                <div className="flex justify-between items-start border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex gap-4">
                    <div className="text-gray-600 mt-1">
                      <FiCalendar size={24} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Meeting regarding Enterprise Software License
                      </h4>
                      <p className="text-sm text-gray-500">
                        Discuss implementation timeline and pricing
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200"></div>
                        <p className="text-sm text-gray-700">Lester James</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">December 12, 2025 at 8:00 AM</p>
                </div>
              </div>
            )}

            {/* NOTES */}
            {activeTab === "Notes" && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Deals Note</h3>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition"
                  >
                    Add Note
                  </button>
                </div>

                <div className="space-y-4">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{n.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">{n.content}</div>
                    </div>
                  ))}
                  <div className="bg-white border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
                    No more notes
                  </div>
                </div>
              </div>
            )}

            {/* EDIT */}
            {activeTab === "Edit" && (
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Deal</h3>
                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <label className="block mb-3">
                    <span className="text-sm text-gray-700">Deal Name</span>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                      defaultValue={selectedDeal.name}
                    />
                  </label>
                  <label className="block mb-3">
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
          <AdminDealsQuickAction selectedDeal={selectedDeal} />
        </div>

        {/* ADD NOTE MODAL */}
        {showNoteModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowNoteModal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Add Note</h4>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveNote}>
                <label className="block text-sm text-gray-700 mb-2">
                  Name
                  <input
                    type="text"
                    value={noteName}
                    onChange={(e) => setNoteName(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    placeholder="Your name"
                  />
                </label>
                <label className="block text-sm text-gray-700 mb-3">
                  Note
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-28 resize-y focus:outline-none focus:ring-2 focus:ring-gray-200"
                    placeholder="Write your note here..."
                  />
                </label>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteModal(false);
                      setNoteName("");
                      setNoteContent("");
                    }}
                    className="px-4 py-2 rounded-md border border-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800"
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
