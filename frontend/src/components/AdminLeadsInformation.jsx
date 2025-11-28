import React, { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import { FiPhone, FiMail, FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminLeadsConvert from "./AdminLeadsConvert";
import { toast } from 'react-toastify';
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

export default function AdminLeadsInformation({ lead: leadProp, onBack, fetchLeads, onEdit, onDelete, onConvert, setSelectedLead }) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { leadID } = useParams();
  const [lead, setLead] = useState(leadProp || null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedStatus, setSelectedStatus] = useState('');


  const [accountData, setAccountData] = useState({
    name: "",
    website: '',
    countryCode: '+63',
    phone_number: '',
    billing_address: '',
    shipping_address: '',
    industry: '',
    status: 'Prospect',
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
    notes: '',
    assigned_to: null,
    created_by: null,
  });

  const [dealData, setDealData] = useState({
    name: 'Converted from Lead',
    account_id: null,
    primary_contact_id: null,
    stage: 'Prospecting',
    probability: 10,
    amount: 0.0,
    currency: 'PHP',
    description: 'Initial deal from lead conversion.',
    assigned_to: null,
    created_by: null,
  });

  const fetchLead = async () => {
    try {
      if (leadProp) {
        // Use prop if available
        setLead(leadProp);
        setSelectedStatus(leadProp.status || 'New');
        return;
      }

      if (!leadID) return;

      const res = await api.get(`/leads/get/${leadID}`);
      setLead(res.data);

      setSelectedStatus(res.data.status || 'New')
      // Populate dependent states
      setAccountData({
        name: res.data.company_name || "",
        website: '',
        countryCode: '+63',
        phone_number: '',
        billing_address: '',
        shipping_address: '',
        industry: '',
        status: 'Prospect',
        territory_id: res.data.assigned_to?.territory?.id || null,
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
        notes: '',
        assigned_to: res.data.assigned_to?.id || null,
        created_by: res.data.creator?.id || null,
      });

      setDealData({
        name: 'Converted from Lead',
        account_id: null,
        primary_contact_id: null,
        stage: 'Prospecting',
        probability: 10,
        amount: 0.0,
        currency: 'PHP',
        description: 'Initial deal from lead conversion.',
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
      setSelectedStatus(leadProp.status || 'New');
    } else if (leadID) {
      fetchLead();
    }
  }, [leadID, leadProp]);

  const updateStatus = async () => {
    try {
      const res = await api.put(`/leads/${lead.id}/update/status`, { status: selectedStatus })
      console.log(res.data)
      toast.success('Lead status updated successfully')
      
      // Update the lead state with new status
      const updatedLead = {
        ...lead,
        status: res.data.status
      };
      setLead(updatedLead);
      
      // Update the parent's selectedLead if setSelectedLead is provided
      if (setSelectedLead) {
        setSelectedLead(updatedLead);
      }
      
      // Update the parent's leads list in real-time
      if (fetchLeads) {
        fetchLeads();
      }
      
      // Close the popup
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update lead status')
    }
  }

  if (!lead) return null;

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

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        {/* MODAL */}
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in p-4 sm:p-6 md:p-8 font-inter relative">
          {/* Close Button */}
          <div className="flex justify-end w-full">
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  // Navigate back to previous page (dashboard or leads page)
                  navigate(-1);
                }
              }}
              className="text-gray-500 hover:text-gray-700 transition mb-5 cursor-pointer"
            >
              <HiX size={30} />
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold">
                {lead.first_name} {lead.last_name}
              </h1>
              <span
                className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${getStatusBadgeClass(
                  lead.status
                )}`}
              >
                {formatStatusLabel(lead.status || "New")}
              </span>

              <button
                onClick={() => {
                  if (lead.status === "Qualified") {
                    // Call onConvert to open convert modal in parent and close this modal
                    if (onConvert) {
                      onConvert(lead);
                    }
                  } else {
                    toast.warn("Cannot convert lead. Only leads with 'Qualified' status can be converted.");
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                Convert
              </button>
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

            {/* ------- TAB CONTENT ------ */}
            <div className="lg:col-span-3">

              {activeTab === "Overview" && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold">Name:</p>
                      <p>{lead.first_name} {lead.last_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Company:</p>
                      <p>{lead.company_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Title:</p>
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
                      <p>{lead.assigned_to?.territory?.name || "N/A"}</p>
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
                    <h3 className="text-lg font-semibold text-gray-800 break-words">Lead Note</h3>
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
                <select
                  className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value='New'>New</option>
                  <option value='Contacted'>Contacted</option>
                  <option value='Qualified'>Qualified</option>
                  <option value='Converted'>Converted</option>
                  <option value='Lost'>Lost</option>
                </select>

                <button
                  onClick={updateStatus}
                  disabled={selectedStatus === lead.status}
                  className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${selectedStatus === lead.status
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400"
                    }`}
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Convert Lead Popup */}
          <AdminLeadsConvert
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            lead={lead}
            accountData={accountData}
            contactData={contactData}
            dealData={dealData}
            setAccountData={setAccountData}
            setContactData={setContactData}
            setDealData={setDealData}
            fetchLeads={fetchLeads}
          />

        </div>
      </div>
    </>
  );
}
