import React, { useCallback, useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import {
  FiPhone,
  FiMail,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiCheckSquare,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function Detail({ label, value }) {
  return (
    <div>
      <p className="font-semibold">{label}:</p>
      <p>{value ?? "N/A"}</p>
    </div>
  );
}

const formattedDateTime = (datetime) => {
  if (!datetime) return "";
  return new Date(datetime)
    .toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
    .replace(",", "");
};

export default function AdminLeadsInformation({
  lead: leadProp,
  onBack,
  fetchLeads,
  onEdit,
  onDelete,
  setSelectedLead,
  relatedActs
}) {
  const navigate = useNavigate();
  const { leadID } = useParams();
  const [lead, setLead] = useState(leadProp || null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedStatus, setSelectedStatus] = useState("");
  const canConvert = lead?.status?.toUpperCase() === "QUALIFIED";  
  const [expandedSection, setExpandedSection] = useState(null);  

  const [accountData, setAccountData] = useState({
    name: "",
    website: "",
    countryCode: "",
    phone_number: "",
    billing_address: "",
    shipping_address: "",
    industry: "",
    status: "Prospect",
    territory_id: null,
    assigned_to: null,
    created_by: null,
  });

  const [contactData, setContactData] = useState({
    last_name: "",
    first_name: "",
    account_id: null,
    title: "",
    department: "",
    email: "",
    work_phone: "",
    mobile_phone_1: "",
    mobile_phone_2: "",
    notes: "",
    assigned_to: null,
    created_by: null,
  });

  const [dealData, setDealData] = useState({
    name: "Converted from Lead",
    account_id: null,
    primary_contact_id: null,
    stage: "Prospecting",
    probability: 10,
    amount: 0.0,
    currency: "PHP",
    description: "Initial deal from lead conversion.",
    assigned_to: null,
    created_by: null,
  });

  const fetchLead = async () => {
    try {
      if (leadProp) {
        // Use prop if available
        setLead(leadProp);
        setSelectedStatus(leadProp.status || "New");
        return;
      }

      if (!leadID) return;

      const res = await api.get(`/leads/get/${leadID}`);
      setLead(res.data);

      setSelectedStatus(res.data.status || "New");
      // Populate dependent states
      setAccountData({
        name: res.data.company_name || "",
        website: "",
        countryCode: "+63",
        phone_number: "",
        billing_address: "",
        shipping_address: "",
        industry: "",
        status: "Prospect",
        territory_id: res.data.territory?.id || null,
        assigned_to: res.data.assigned_to?.id || null,
        created_by: res.data.creator?.id || null,
      });

      setContactData({
        last_name: res.data.last_name || "",
        first_name: res.data.first_name || "",
        account_id: null,
        title: res.data.title || "",
        department: res.data.department || "",
        email: res.data.email || "",
        work_phone: res.data.work_phone || "",
        mobile_phone_1: res.data.mobile_phone_1 || "",
        mobile_phone_2: res.data.mobile_phone_2 || "",
        notes: "",
        assigned_to: res.data.assigned_to?.id || null,
        created_by: res.data.creator?.id || null,
      });

      setDealData({
        name: "Converted from Lead",
        account_id: null,
        primary_contact_id: null,
        stage: "Prospecting",
        probability: 10,
        amount: 0.0,
        currency: "PHP",
        description: "Initial deal from lead conversion.",
        assigned_to: res.data.assigned_to?.id || null,
        created_by: res.data.creator?.id || null,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (leadProp) {
      setLead(leadProp);
      setSelectedStatus(leadProp.status || "New");
    } else if (leadID) {
      fetchLead();
    }
  }, [leadID, leadProp]);
  const updateStatus = async () => {
    try {
      if (
        selectedStatus === "Converted" &&
        lead?.status?.toUpperCase() !== "QUALIFIED"
      ) {
        toast.error("Lead must be Qualified before it can be converted.");
        return;
      }

      const res = await api.put(`/leads/${lead.id}/update/status`, {
        status: selectedStatus,
      });

      toast.success("Lead status updated successfully");

      const updatedLead = {
        ...lead,
        status: res.data.status,
      };

      setLead(updatedLead);

      if (setSelectedLead) {
        setSelectedLead(updatedLead);
      }

      if (fetchLeads) {
        fetchLeads();
      }

      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update lead status");
    }
  };

  const handleConvert = async (lead) => {
    const newAccount = {
      ...accountData,
      assigned_to: lead.assigned_to?.id,
      billing_address: lead.address,
      shipping_address: lead.address,
      created_by: lead.creator?.id,
      industry: null,
      name: lead.company_name,
      phone_number: lead.work_phone,
      status: "Prospect",
      territory_id: lead.territory?.id,
      website: "",
    };

    console.log(`Account data: `, newAccount);
    console.log(`Contact data: `, contactData);
    console.log(`Deal data: `, dealData);
    console.log(`Lead data: `, lead);

    try {
      const res = await api.post(`/accounts/convertedLead`, newAccount);
      const accInsertId = res.data.id;

      const newContact = {
        ...contactData,
        account_id: accInsertId,
        assigned_to: lead.assigned_to?.id,
        created_by: lead.creator?.id,
        department: lead.department,
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        mobile_phone_1: lead.mobile_phone_1,
        mobile_phone_2: lead.mobile_phone_2,
        notes: lead.notes,
        title: lead.title,
        work_phone: lead.work_phone,
      };

      const res1 = await api.post(`/contacts/convertedLead`, newContact);
      const contactInsertId = res1.data.id;

      const handleProbability = () => {
        switch (dealData.stage) {
          case "PROSPECTING":
            return 10;
          case "QUALIFICATION":
            return 25;
          case "PROPOSAL":
            return 60;
          case "NEGOTIATION":
            return 80;
          case "CLOSED_WON":
            return 100;
          case "CLOSED_LOST":
            return 0;
          default:
            return 0;
        }
      };

      const dealAmount =
        dealData.amount && dealData.amount !== ""
          ? parseFloat(dealData.amount)
          : 0.0;

      const newDealData = {
        ...dealData,
        account_id: accInsertId,
        assigned_to: lead.assigned_to?.id,
        created_by: lead.creator?.id,
        primary_contact_id: contactInsertId,
        probability: handleProbability(),
        stage: "Prospecting",
      };
      const res2 = await api.post(`/deals/convertedLead`, newDealData);

      const res3 = await api.put(`/leads/convert/${lead.id}`);

      if (setSelectedLead) {
        setSelectedLead(null);
      }

      fetchLeads(); // Refresh the leads list after conversion
      toast.success("Lead converted successfully!");
      onBack();
    } catch (error) {
      console.error("Error during conversion:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to convert lead. Please try again.";
      toast.error(errorMessage);
    }
  };

  // 👉 NEW: When clicking "Schedule Call", go to AdminCalls and open Add Call modal
  const handleScheduleCall = () => {
    if (!lead) return;

    navigate("/admin/calls", {
      state: {
        openCallModal: true,
        initialCallData: {
          subject: `Call with ${lead.first_name || ""} ${
            lead.last_name || ""
          }`.trim(),
          phone_number: lead.work_phone || lead.mobile_phone_1 || "",
          assigned_to: lead.assigned_to ? String(lead.assigned_to.id) : "",
          related_type: "Lead",
          related_to: String(lead.id),
          priority: "MEDIUM",
        },
      },
    });
  };

  const getStatusBadgeClass = (status) => {
    const normalizedStatus = (status || "").toUpperCase();
    switch (normalizedStatus) {
      case "NEW":
        return "bg-indigo-100 text-indigo-700";
      case "CONTACTED":
        return "bg-blue-100 text-blue-700";
      case "QUALIFIED":
        return "bg-green-100 text-green-700";
      case "CONVERTED":
        return "bg-emerald-100 text-emerald-700";
      case "LOST":
        return "bg-red-100 text-red-700";
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

  if (!lead) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        {/* MODAL */}
        <div className="bg-white rounded-xl shadow-lg w-full max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto hide-scrollbar relative box-border">
          {/* TOP SECTION*/}
          <div className="bg-tertiary w-full rounded-t-xl p-3 lg:p-3">
            <div className="flex items-start justify-between w-full">
              <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
                Lead
              </h1>
              <button
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    // Navigate back to previous page (dashboard or leads page)
                    navigate(-1);
                  }
                }}
                className="text-gray-400 hover:text-white mt-1 cursor-pointer"
              >
                <HiX size={25} />
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {lead.first_name} {lead.last_name}
              </h1>
              <span
                className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${getStatusBadgeClass(
                  lead.status,
                )}`}
              >
                {formatStatusLabel(lead.status || "New")}
              </span>

              <div className="flex flex-col">
                <button
                  onClick={() => handleConvert(lead)}
                  disabled={!canConvert}
                  title={
                    !canConvert
                      ? "Lead must be Qualified before converting"
                      : "Convert Lead"
                  }
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition focus:outline-none focus:ring-2
      ${
        canConvert
          ? "bg-green-600 hover:bg-green-700 text-white focus:ring-green-400"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
      }
    `}
                >
                  Convert
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
              <button
                type="button"
                onClick={() => {
                  if (onEdit && lead) {
                    onEdit(lead);
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
                  if (onDelete && lead) {
                    onDelete(lead);
                  }
                }}
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <FiTrash2 className="mr-2" />
                Delete
              </button>
            </div>
          </div>
          <div className="border-b border-gray-200 my-5"></div>

          {/* TABS */}
          <div className="p-4 lg:p-4">
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
                        <p className="font-semibold">Name:</p>
                        <p>
                          {lead.first_name} {lead.last_name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Company:</p>
                        <p>{lead.company_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Job Title:</p>
                        <p>{lead.title || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Department:</p>
                        <p>{lead.department || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Email:</p>
                        <p>{lead.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Territory:</p>
                        <p>{lead.territory?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Assigned To:</p>
                        <p>
                          {lead.assigned_to
                            ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name}`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Created By:</p>
                        <p>
                          {lead.creator
                            ? `${lead.creator.first_name} ${lead.creator.last_name}`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Work Phone:</p>
                        <p>{lead.work_phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Mobile Phone 1:</p>
                        <p>{lead.mobile_phone_1 || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Mobile Phone 2:</p>
                        <p>{lead.mobile_phone_2 || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Source:</p>
                        <p>{lead.source || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Address:</p>
                        <p>{lead.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------- Notes ------ */}
                {activeTab === "Notes" && (
                  <div className="mt-4 w-full">
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                      <h3 className="text-lg font-semibold text-gray-800 break-words">
                        Lead Note
                      </h3>
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
                        {lead.notes || "No notes available."}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIVITIES */}
                {activeTab === "Activities" && (
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
                                  className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer" onClick={() => navigate(`/admin/tasks`, { state: { taskID: task.id } })}
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
                                          Assigned:{" "}
                                          {task.assigned_to.first_name}{" "}
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
                      {relatedActs.meetings &&
                        relatedActs.meetings.length > 0 && (
                          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSection(
                                  expandedSection === "meetings"
                                    ? null
                                    : "meetings",
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
                                    className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer" onClick={() => navigate(`/admin/meetings`, { state: { meetingID: meeting.id } })}
                                  >
                                    <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                      <div className="text-green-600 mt-1">
                                        <FiCalendar size={20} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-blue-600 break-words text-sm">
                                          {meeting.subject ||
                                            meeting.title ||
                                            "Meeting"}
                                        </h4>
                                        <p className="text-gray-500 break-words text-xs">
                                          {meeting.description ||
                                            meeting.location ||
                                            "No description"}
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
                                        meeting.start_time ||
                                          meeting.created_at,
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
                                  className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer" onClick={() => navigate(`/admin/calls`, { state: { callID: call.id } })}
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

                      {/* No activities message */}
                      {(!relatedActs ||
                        ((!relatedActs.tasks ||
                          relatedActs.tasks.length === 0) &&
                          (!relatedActs.meetings ||
                            relatedActs.meetings.length === 0) &&
                          (!relatedActs.calls ||
                            relatedActs.calls.length === 0) &&
                          (!relatedActs.quotes ||
                            relatedActs.quotes.length === 0) &&
                          (!relatedActs.deals ||
                            relatedActs.deals.length === 0) &&
                          (!relatedActs.contacts ||
                            relatedActs.contacts.length === 0))) && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No related activities found for this account.</p>
                        </div>
                      )}
                    </div>
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
                    {/* --- SCHEDULE CALL BUTTON (updated) --- */}
                    <button
                      onClick={() => {
                        if (!lead) return;

                        navigate("/admin/calls", {
                          state: {
                            openCallModal: true,
                            initialCallData: {
                              subject: lead.title
                                ? `Call regarding ${lead.title}`
                                : `Call with ${lead.first_name} ${lead.last_name}`,

                              relatedType1: "Lead",
                              relatedTo1: String(lead.id),

                              relatedType2: null,
                              relatedTo2: null,

                              assigned_to: lead.assigned_to?.id
                                ? String(lead.assigned_to.id)
                                : "",

                              direction: "Outgoing",
                              status: "Planned",
                            },
                          },
                        });
                      }}
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                    >
                      <FiPhone className="text-gray-600 w-4 h-4" />
                      Schedule Call
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!lead?.email) {
                          alert("No email address available");
                          return;
                        }

                        const to = encodeURIComponent(lead.email);
                        const subject = encodeURIComponent("");
                        const body = encodeURIComponent("");

                        const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

                        // Opens user's default email client (Outlook, Gmail, Apple Mail, etc.)
                        window.location.href = mailtoUrl;
                      }}
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                    >
                      <FiMail className="text-gray-600 w-4 h-4" />
                      Send E-mail
                    </button>

                    <button
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                      onClick={() => {
                        if (!lead) return;

                        navigate("/admin/meetings", {
                          state: {
                            openMeetingModal: true,
                            initialMeetingData: {
                              subject: lead.title
                                ? `Meeting regarding ${lead.title}`
                                : `Meeting with ${lead.first_name || ""} ${lead.last_name || ""}`.trim(),

                              relatedType1: "Lead",
                              relatedTo1: String(lead.id),

                              relatedType2: null,
                              relatedTo2: null,

                              assignedTo: lead.assigned_to?.id
                                ? String(lead.assigned_to.id)
                                : "",

                              status: "Planned",
                            },
                          },
                        });
                      }}
                    >
                      <FiCalendar className="text-gray-600 w-4 h-4" />
                      Book Meeting
                    </button>

                    <button
                      onClick={() => {
                        if (!lead) return;

                        navigate("/admin/tasks", {
                          state: {
                            openTaskModal: true,
                            initialTaskData: {
                              subject: lead.title
                                ? `Follow up on ${lead.title}`
                                : `Follow up with ${lead.first_name || ""} ${lead.last_name || ""}`.trim(),

                              relatedType1: "Lead",
                              relatedTo1: String(lead.id),

                              relatedType2: null,
                              relatedTo2: null,

                                assignedTo: lead.assigned_to?.id
                                ? String(lead.assigned_to.id)
                                : "",

                              priority: "NORMAL",
                              status: "Not Started",
                            },
                          },
                        });
                      }}
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                    >
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
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>

                    {lead?.status?.toUpperCase() === "QUALIFIED" && (
                      <option value="Converted">Converted</option>
                    )}

                    <option value="Lost">Lost</option>
                  </select>

                  <button
                    onClick={updateStatus}
                    disabled={selectedStatus === lead.status}
                    className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                      selectedStatus === lead.status
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400"
                    }`}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
