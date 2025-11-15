import React, { useState } from "react";
import { HiX } from "react-icons/hi";
import { FiPhone, FiMail, FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";

const AdminMeetingInfomation = ({ meeting, onClose, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  if (!meeting) return null;

  const getStatusBadgeClass = (status) => {
    const normalizedStatus = (status || "").toUpperCase();
    switch (normalizedStatus) {
      case "PENDING":
        return "bg-indigo-100 text-indigo-700";
      case "COMPLETED":
      case "DONE":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-gray-200 text-gray-700";
      case "IN PROGRESS":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) return "--";
    return status
      .toString()
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        {/* MODAL */}
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto animate-scale-in p-4 sm:p-6 md:p-8 font-inter relative">
          {/* Close Button */}
          <div className="flex justify-end w-full">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition mb-5 cursor-pointer"
            >
              <HiX size={30} />
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold">
                {meeting.activity || "Meeting"}
              </h1>
              <span
                className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${getStatusBadgeClass(
                  meeting.status
                )}`}
              >
                {formatStatusLabel(meeting.status || "PENDING")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
              <button
                type="button"
                onClick={() => {
                  if (onEdit) {
                    onEdit(meeting);
                  }
                }}
                className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <FiEdit2 className="mr-2" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) {
                    onDelete(meeting);
                  }
                }}
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <FiTrash2 className="mr-2" />
                Delete
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
            {["Overview", "Notes", "Related Activities"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium text-center transition-all duration-200 border-b-2
        ${
          activeTab === tab
            ? "bg-paper-white text-[#6A727D] border-white"
            : "text-white hover:bg-[#5c636d]"
        }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* ------- TAB CONTENT ------ */}
            <div className="lg:col-span-3">
              {activeTab === "Overview" && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold">Activity:</p>
                      <p>{meeting.activity || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Description:</p>
                      <p>{meeting.description || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Priority:</p>
                      <p>{meeting.priority || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Related To:</p>
                      <p>{meeting.relatedTo || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Due Date:</p>
                      <p>{meeting.dueDate || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Assigned To:</p>
                      <p>{meeting.assignedTo || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Status:</p>
                      <p>{formatStatusLabel(meeting.status || "PENDING")}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Notes" && (
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {meeting.description || "No notes available."}
                  </p>
                </div>
              )}

              {activeTab === "Related Activities" && (
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4 sm:mb-6">
                    Related Activities
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-sm">
                    {/* Tasks */}
                    <div>
                      <h4 className="font-semibold mb-2">Task (0)</h4>
                      <div className="space-y-1 text-gray-700">
                        <p className="text-xs text-gray-500">
                          No tasks available
                        </p>
                      </div>
                      <a
                        href="#"
                        className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block"
                      >
                        View All Tasks
                      </a>
                    </div>

                    {/* Notes */}
                    <div>
                      <h4 className="font-semibold mb-2">Notes (0)</h4>
                      <div className="space-y-1 text-gray-700">
                        <p className="text-xs text-gray-500">
                          No notes available
                        </p>
                      </div>
                      <a
                        href="#"
                        className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block"
                      >
                        View All Notes
                      </a>
                    </div>

                    {/* Meetings */}
                    <div>
                      <h4 className="font-semibold mb-2">Meetings (0)</h4>
                      <div className="space-y-1 text-gray-700">
                        <p className="text-xs text-gray-500">
                          No meetings available
                        </p>
                      </div>
                      <a
                        href="#"
                        className="text-blue-600 hover:underline text-xs font-medium mt-2 inline-block"
                      >
                        View All Meetings
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 h-full">
              {/* QUICK ACTIONS */}
              <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col flex-grow">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                  Quick Actions
                </h4>

                <div className="flex flex-col gap-2 w-full flex-grow">
                  {[
                    { icon: FiPhone, text: "Schedule Call" },
                    { icon: FiMail, text: "Send E-mail" },
                    { icon: FiCalendar, text: "Book Meeting" },
                  ].map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                    >
                      <Icon className="text-gray-600 w-4 h-4 flex-shrink-0" />{" "}
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {/* STATUS */}
              <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                  Status
                </h4>
                <div
                  className={`w-full py-2 px-3 rounded-md text-sm text-center font-medium whitespace-nowrap ${getStatusBadgeClass(
                    meeting.status
                  )}`}
                >
                  {formatStatusLabel(meeting.status || "PENDING")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminMeetingInfomation;
