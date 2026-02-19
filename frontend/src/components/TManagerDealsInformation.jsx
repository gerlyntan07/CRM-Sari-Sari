import React, { useState, useEffect } from "react";
import {
  FiX,
  FiPhone,
  FiMail,
  FiCalendar,
  FiFileText,
  FiEdit2,
  FiArchive,
  FiCheckSquare,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminDealsQuickAction from "../components/TManagerDealsQuickAction";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import CommentSection from "../components/CommentSection.jsx";
import { useComments } from "../hooks/useComments.js";

export default function AdminDealsInformation({
  selectedDeal: selectedDealProp,
  relatedActs = {},
  show,
  onClose,
  activeTab,
  setActiveTab,
  onEdit,
  onDelete,
  onStatusUpdate,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealIdFromQuery = searchParams.get('id');
  const [selectedDeal, setSelectedDeal] = useState(selectedDealProp || null);
  const [localActiveTab, setLocalActiveTab] = useState(activeTab || "Overview");
  const [expandedSection, setExpandedSection] = useState(null);
  const {user} = useFetchUser();

  const {
    comments: dealComments,
    addComment: addDealComment,
    refresh: refreshDealComments,
  } = useComments({
    relatedType: "deal",
    relatedId: selectedDeal?.id,
  });

  useEffect(() => {
    if (selectedDeal?.id) refreshDealComments();
  }, [selectedDeal?.id, refreshDealComments]);
  
  // Use local tab state if no activeTab prop is provided
  const currentTab = activeTab !== undefined ? activeTab : localActiveTab;

  const role = (() => {
    const r = String(user?.role || "").toLowerCase();
    if (r === "ceo" || r === "admin") return "admin";
    if (r === "manager") return "manager";
    if (r === "sales") return "sales";
    if (r === "group manager" || r === "group_manager" || r === "group-manager") {
      return "group-manager";
    }
    return "guest";
  })();

  // Fetch deal if accessed via route with query param
  useEffect(() => {
    const fetchDealFromRoute = async () => {
      if (dealIdFromQuery && !selectedDealProp) {
        try {
          // Fetch all deals to get the one we need with relationships
          const response = await api.get(`/deals/admin/fetch-all`);
          const deals = response.data || [];
          const deal = deals.find(d => d.id === parseInt(dealIdFromQuery));
          if (deal) {
            // Ensure amount is a number
            const dealWithFormattedAmount = {
              ...deal,
              amount: typeof deal.amount === 'number' ? deal.amount : parseFloat(deal.amount || 0),
              probability: deal.probability || 0
            };
            setSelectedDeal(dealWithFormattedAmount);
          } else {
            console.warn('Deal not found with ID:', dealIdFromQuery);
          }
        } catch (error) {
          console.error('Error fetching deal:', error);
        }
      }
    };

    fetchDealFromRoute();
  }, [dealIdFromQuery, selectedDealProp]);

  // Show modal if accessed via route or if show prop is true
  const shouldShow = show || (dealIdFromQuery && selectedDeal);

  // Don't render if no deal and not accessed via route
  if (!selectedDeal && !dealIdFromQuery) return null;
  
  // If accessed via route but deal not found yet, show nothing (will show once loaded)
  if (dealIdFromQuery && !selectedDeal) return null;

  const getStageBadgeClasses = (stage) => {
    const stageColors = {
      "PROSPECTING": "bg-blue-100 text-blue-700",
      "QUALIFICATION": "bg-yellow-100 text-yellow-700",
      "PROPOSAL": "bg-orange-100 text-orange-700",
      "NEGOTIATION": "bg-purple-100 text-purple-700",
      "CLOSED_WON": "bg-green-100 text-green-700",
      "CLOSED_LOST": "bg-red-100 text-red-700",
    };
    return stageColors[stage] || "bg-gray-100 text-gray-700";
  };

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
  <div className="bg-white rounded-xl shadow-lg w-full max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto hide-scrollbar relative box-border">

 {/* TOP SECTION*/}
<div className="bg-tertiary w-full rounded-t-xl p-3 lg:p-3">
  <div className="flex items-start justify-between w-full">
    <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
    Deal
   </h1>
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={() => {
          if (onClose) {
            onClose();
          } else {
            navigate(-1);
          }
        }}
        className="text-gray-400 hover:text-white mt-1 cursor-pointer">
        <FiX size={25} />
      </button>
    </div>
  </div>
</div>

<div className="p-4 lg:p-2 lg:mx-7">
  <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 mt-3">
    <div className="flex flex-col gap-1">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-1">
        <h2 className="text-xl lg:text-xl font-semibold text-gray-800 break-words">
          {selectedDeal.name}
        </h2>

        <span className={`text-xs sm:text-sm inline-block font-medium px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full break-words ${getStageBadgeClasses(selectedDeal.stage)}`}>
          {selectedDeal.stage}
        </span>
      </div>

      <p className="text-gray-500 text-sm break-words">
        Created on {formattedDateTime(selectedDeal.created_at)}
      </p>
    </div>

    {/* RIGHT SIDE*/}
    <div className="flex flex-col items-end gap-2">
       <h2 className="text-xl sm:text-2xl font-bold text-gray-600 break-words">
        ₱ {selectedDeal.amount ? selectedDeal.amount.toLocaleString() : '0'}
      </h2>
      <div className="w-full sm:w-40 bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${selectedDeal.probability}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 break-words"> {selectedDeal.probability}% Complete </p>

      {(selectedDeal.deal_creator?.id === user?.id) && (
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
          className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-sm bg-orange-500 text-white hover:bg-orange-600 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <FiArchive className="mr-1 sm:mr-2" size={16} />
          <span className="hidden sm:inline">Archive</span>
        </button>
      </div>
      )}      
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
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab(tab);
                } else {
                  setLocalActiveTab(tab);
                }
              }}
              className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium text-center transition-all duration-200 border-b-2
                ${currentTab === tab
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
            {currentTab === "Overview" && (
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
                        {(() => {
                          const currentStage = (selectedDeal?.stage || "PROSPECTING").toUpperCase();

                          
                          // Map stages to circle indices: 0=Prospecting, 1=Qualification, 2=Proposal, 3=Negotiation, 4=Closed
                          const getStageIndex = (stage) => {
                            if (stage === "PROSPECTING") return 0;
                            if (stage === "QUALIFICATION") return 1;
                            if (stage === "PROPOSAL") return 2;
                            if (stage === "NEGOTIATION") return 3;
                            if (stage === "CLOSED_WON" || stage === "CLOSED_LOST") return 4;
                            return -1;
                          };
                          
                          const currentIndex = getStageIndex(currentStage);
                          
                          // Map to 5 circles: Prospecting, Qualification, Proposal, Negotiation, Closed
                          const circleStates = [0, 1, 2, 3, 4].map((i) => {
                            if (currentIndex === i) {
                              // Current stage is orange
                              return "orange";
                            } else if (currentIndex > i) {
                              // Past stages are green
                              return "green";
                            } else {
                              // Future stages are gray
                              return "gray";
                            }
                          });

                          return circleStates.map((color, i) => (
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
                          ));
                        })()}
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
            {currentTab === "Notes" && (
              <div className="mt-4 w-full">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 break-words">Deal Note</h3>
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
                    {selectedDeal.description || "No notes available."}
                  </div>
                </div>

                <CommentSection
                    comments={dealComments}
                    onAddComment={addDealComment}
                  />
              </div>
            )}

            {/* ACTIVITIES */}
            {currentTab === "Activities" && (
              <div className="space-y-2 w-full h-full max-h-[50dvh] overflow-y-auto bg-gray-50 p-2 hide-scrollbar rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 break-words border-b border-gray-300 py-2">
                  Related Activities
                </h3>

                <div className="space-y-2 text-sm">
                  {/* TASKS */}
                  {relatedActs.tasks && relatedActs.tasks.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSection(
                            expandedSection === "tasks" ? null : "tasks",
                          )
                        }
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FiCheckSquare className="text-blue-600" />
                          <span className="font-semibold text-gray-700">
                            Tasks ({relatedActs.tasks.length})
                          </span>
                        </div>
                        {expandedSection === "tasks" ? (
                          <FiChevronDown className="text-gray-500" />
                        ) : (
                          <FiChevronRight className="text-gray-500" />
                        )}
                      </button>
                      {expandedSection === "tasks" && (
                        <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                          {relatedActs.tasks.map((task, idx) => (
                            <div
                              key={`task-${idx}`}
                              className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer"
                              onClick={() =>
                                navigate(`/${role}/tasks`, {
                                  state: { taskID: task.id },
                                })
                              }
                            >
                              <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                <div className="text-blue-600 mt-1">
                                  <FiCheckSquare size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-blue-600 break-words text-sm">
                                    {task.subject || task.title || "Task"}
                                  </h4>
                                  <p className="text-gray-500 break-words text-xs">
                                    {task.description || "No description"}
                                  </p>
                                  {task.assigned_to && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      Assigned: {task.assigned_to.first_name}{" "}
                                      {task.assigned_to.last_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 break-words">
                                {formattedDateTime(
                                  task.due_date || task.created_at,
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MEETINGS */}
                  {relatedActs.meetings && relatedActs.meetings.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSection(
                            expandedSection === "meetings" ? null : "meetings",
                          )
                        }
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-green-600" />
                          <span className="font-semibold text-gray-700">
                            Meetings ({relatedActs.meetings.length})
                          </span>
                        </div>
                        {expandedSection === "meetings" ? (
                          <FiChevronDown className="text-gray-500" />
                        ) : (
                          <FiChevronRight className="text-gray-500" />
                        )}
                      </button>
                      {expandedSection === "meetings" && (
                        <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                          {relatedActs.meetings.map((meeting, idx) => (
                            <div
                              key={`meeting-${idx}`}
                              className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer"
                              onClick={() =>
                                navigate(`/${role}/meetings`, {
                                  state: { meetingID: meeting.id },
                                })
                              }
                            >
                              <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                <div className="text-green-600 mt-1">
                                  <FiCalendar size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-blue-600 break-words text-sm">
                                    {meeting.subject || meeting.title || "Meeting"}
                                  </h4>
                                  <p className="text-gray-500 break-words text-xs">
                                    {meeting.description || meeting.location || "No description"}
                                  </p>
                                  {meeting.host && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      Host: {meeting.host.first_name}{" "}
                                      {meeting.host.last_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 break-words">
                                {formattedDateTime(
                                  meeting.start_time || meeting.created_at,
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CALLS */}
                  {relatedActs.calls && relatedActs.calls.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSection(
                            expandedSection === "calls" ? null : "calls",
                          )
                        }
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-purple-600" />
                          <span className="font-semibold text-gray-700">
                            Calls ({relatedActs.calls.length})
                          </span>
                        </div>
                        {expandedSection === "calls" ? (
                          <FiChevronDown className="text-gray-500" />
                        ) : (
                          <FiChevronRight className="text-gray-500" />
                        )}
                      </button>
                      {expandedSection === "calls" && (
                        <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                          {relatedActs.calls.map((call, idx) => (
                            <div
                              key={`call-${idx}`}
                              className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer"
                              onClick={() =>
                                navigate(`/${role}/calls`, {
                                  state: { callID: call.id },
                                })
                              }
                            >
                              <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                <div className="text-purple-600 mt-1">
                                  <FiPhone size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-blue-600 break-words text-sm">
                                    {call.subject || call.title || "Call"}
                                  </h4>
                                  <p className="text-gray-500 break-words text-xs">
                                    {call.direction || ""}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 break-words">
                                {formattedDateTime(
                                  call.call_time || call.created_at,
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* QUOTES */}
                  {relatedActs.quotes && relatedActs.quotes.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSection(
                            expandedSection === "quotes" ? null : "quotes",
                          )
                        }
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FiFileText className="text-orange-600" />
                          <span className="font-semibold text-gray-700">
                            Quotes ({relatedActs.quotes.length})
                          </span>
                        </div>
                        {expandedSection === "quotes" ? (
                          <FiChevronDown className="text-gray-500" />
                        ) : (
                          <FiChevronRight className="text-gray-500" />
                        )}
                      </button>
                      {expandedSection === "quotes" && (
                        <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                          {relatedActs.quotes.map((quote, idx) => (
                            <div
                              key={`quote-${idx}`}
                              className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer"
                              onClick={() =>
                                navigate(`/${role}/quotes`, {
                                  state: { quoteID: quote.id },
                                })
                              }
                            >
                              <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                <div className="text-orange-600 mt-1">
                                  <FiFileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-blue-600 break-words text-sm">
                                    {(quote.quote_id
                                      ? quote.quote_id.replace(/Q(\d+)-\d+-/, "Q$1-")
                                      : "--") || "Quote"}
                                  </h4>
                                  <p className="text-xs text-gray-500 break-words">
                                    {quote.status || ""}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 break-words">
                                {formattedDateTime(quote.presented_date) || ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No activities message */}
                  {(!relatedActs ||
                    ((!relatedActs.tasks || relatedActs.tasks.length === 0) &&
                      (!relatedActs.meetings || relatedActs.meetings.length === 0) &&
                      (!relatedActs.calls || relatedActs.calls.length === 0) &&
                      (!relatedActs.quotes || relatedActs.quotes.length === 0) &&
                      (!relatedActs.deals || relatedActs.deals.length === 0) &&
                      (!relatedActs.contacts || relatedActs.contacts.length === 0))) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No related activities found for this account.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EDIT */}
            {currentTab === "Edit" && (
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
            <AdminDealsQuickAction selectedDeal={selectedDeal} onStatusUpdate={onStatusUpdate} onClose={onClose} />
          </div>
        </div>
             </div>
      </div>
    </div>
  );
}
