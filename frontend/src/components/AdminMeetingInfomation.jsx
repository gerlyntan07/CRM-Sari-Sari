import React, { useState } from "react";
import { HiX } from "react-icons/hi";
import { FiPhone, FiMail, FiCalendar, FiEdit2, FiTrash2, FiFileText, FiCheckSquare } from "react-icons/fi";
import { useNavigate} from "react-router-dom";


const AdminMeetingInfomation = ({ meeting, onClose, onEdit, onDelete, onStatusUpdate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const toAdminStatus = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "PENDING" || s === "IN PROGRESS") return "PLANNED";
    if (s === "COMPLETED" || s === "DONE") return "HELD";
    if (s === "CANCELLED") return "NOT_HELD";
    return "PLANNED";
  };
  const toBackendStatus = (adminStatus) => {
    const s = (adminStatus || "").toUpperCase();
    if (s === "PLANNED") return "PENDING";
    if (s === "HELD") return "COMPLETED";
    if (s === "NOT_HELD") return "CANCELLED";
    return "PENDING";
  };
  const [selectedStatus, setSelectedStatus] = useState(toAdminStatus(meeting?.status || "PENDING"));
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!meeting) return null;

  const getStatusBadgeClass = (status) => {
    const normalizedStatus = (status || "").toUpperCase();
    const base = normalizedStatus === "PLANNED" ? "PENDING" : normalizedStatus === "HELD" ? "COMPLETED" : normalizedStatus === "NOT_HELD" ? "CANCELLED" : normalizedStatus;
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
        switch (base) {
          case "PENDING":
            return "bg-indigo-100 text-indigo-700";
          case "COMPLETED":
            return "bg-green-100 text-green-700";
          case "CANCELLED":
            return "bg-gray-200 text-gray-700";
          default:
            return "bg-gray-100 text-gray-700";
        }
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto hide-scrollbar relative box-border">
        {/* TOP SECTION */}
        <div className="bg-tertiary w-full rounded-t-xl p-3 lg:p-3 relative">
          <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
            Meeting
          </h1>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
          >
            <HiX size={25} />
          </button>
        </div>

          {/* Header */}
          <div className="mt-4 gap-2 px-2 lg:gap-4 lg:mx-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold">
                {meeting.activity || "Meeting"}
              </h1>
              <span
                className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${getStatusBadgeClass(
                  toAdminStatus(meeting.status)
                )}`}
              >
                {toAdminStatus(meeting.status || "PENDING").replace("_", " ")}
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
          </div>
        
          <div className="border-b border-gray-200 my-5"></div>

          {/* TABS */}
           <div className="p-6 lg:p-4">
          <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
            {["Overview", "Notes", "Activities"].map((tab) => (
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
                      <p className="font-semibold">Start Time:</p>
                      <p>{meeting.startTime ? new Date(meeting.startTime).toLocaleString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">End Time:</p>
                      <p>{meeting.endTime ? new Date(meeting.endTime).toLocaleString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Meeting Title:</p>
                      <p>{meeting.activity || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Location:</p>
                      <p>{meeting.location || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Assigned To:</p>
                      <p>{meeting.assignedTo || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Related Type:</p>
                      <p>{meeting.relatedType || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Related To:</p>
                      <p>{meeting.relatedTo || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Status:</p>
                      <p>{toAdminStatus(meeting.status || "PENDING").replace("_", " ")}</p>
                    </div>
                  </div>
                </div>
              )}

                    {/* ------- Notes ------ */}
            {activeTab === "Notes" && (
              <div className="mt-4 w-full">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 break-words">Meeting Note</h3>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm break-words">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800 break-words">
                        Note
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {meeting.description || meeting.agenda || "No notes available."}
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
                        </div>

              <div className="flex flex-col gap-4">
                     {/* QUICK ACTIONS */}
                     <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm">
                       <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                         Quick Actions
                       </h4>
                   
                       <div className="flex flex-col gap-2 w-full">
                   
                      
                         <button
                           onClick={() =>
                             navigate("/admin/calls", {
                               state: {
                                 openCallModal: true,      // <-- this triggers your form
                                 initialCallData: {
                                   relatedType1: "Meeting", // <-- your custom default
                                 },
                               },
                             })
                           }
                           className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                         >
                           <FiPhone className="text-gray-600 w-4 h-4" />
                           Schedule Call
                         </button>
                   
                         <button
                    className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                    onClick={() =>
                      navigate("/admin/meetings", {
                        state: {
                          openMeetingModal: true,
                          initialMeetingData: {
                            relatedType: "Meeting",
                          },
                        },
                      })
                    }
                  >
                    <FiCalendar className="text-gray-600 w-4 h-4" />
                    Book Meeting
                  </button>

                           <button className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm">
                            <FiCheckSquare className="text-gray-600 w-4 h-4" />
                          Tasks
                         </button>
                       </div>
                     </div>

              {/* STATUS */}
              <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                  Status
                </h4>
                <select
                  className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="HELD">HELD</option>
                  <option value="NOT_HELD">NOT HELD</option>
                </select>

                <button
                  onClick={async () => {
                    if (!onStatusUpdate || !meeting?.id) return;
                    const backendStatus = toBackendStatus(selectedStatus);
                    if (toAdminStatus(meeting.status) === selectedStatus) return;

                    setIsUpdatingStatus(true);
                    try {
                      await onStatusUpdate(meeting.id, backendStatus);
                    } catch (err) {
                      console.error("Failed to update status:", err);
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                  disabled={selectedStatus === meeting.status || isUpdatingStatus}
                  className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                    selectedStatus === meeting.status || isUpdatingStatus
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400"
                  }`}
                >
                  {isUpdatingStatus ? "Updating..." : "Update"}
                </button>
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
