import React, { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import { FiPhone, FiMail, FiCalendar } from "react-icons/fi";
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

export default function AdminLeadsInformation({ onBack, fetchLeads }) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { leadID } = useParams();
  const [lead, setLead] = useState(null);
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
        const res = await api.get(`/leads/get/${leadID}`);
        setLead(res.data);

        setSelectedStatus(res.status)
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
    fetchLead();
  }, [leadID]);

  const updateStatus = async() => {
    try{
      const res = await api.put(`/leads/${lead.id}/update/status`, {status: selectedStatus})
      console.log(res.data)
      toast.success('Lead status updated successfully')
      fetchLead();
    } catch(err){
      console.error(err)
    }
  }

  if (!lead) return null;


  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

        {/* MODAL */}
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto animate-scale-in p-4 sm:p-6 md:p-8 font-inter relative">

          {/* Close Button */}
          <div className="flex justify-end w-full">
            <button
              onClick={() => navigate(`/admin/leads`)}
              className="text-gray-500 hover:text-gray-700 transition mb-5 cursor-pointer"
            >
              <HiX size={30} />
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold">{lead.first_name} {lead.last_name}</h1>
              <span className="bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                {lead.status}
              </span>

              <button
                onClick={() => {
                  if (lead.status === "Qualified") {
                    setIsModalOpen(true);
                  } else {
                    toast.warn("Cannot convert lead. Only leads with 'Qualified' status can be converted.");
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm"
              >
                Convert
              </button>
            </div>

            <div className="mt-2 lg:mt-0 flex flex-wrap gap-2 sm:gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm">
                Edit
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm">
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
                      <p>{lead.first_name} {lead.last_name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Company:</p>
                      <p>{lead.company_name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Title:</p>
                      <p>{lead.title}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Department:</p>
                      <p>{lead.department}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Email:</p>
                      <p>{lead.email}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Territory:</p>
                      <p>{lead.assigned_to.territory?.name || ""}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Assigned To:</p>
                      <p>{lead.assigned_to.first_name} {lead.assigned_to.last_name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Created By:</p>
                      <p>{lead.creator.first_name} {lead.creator.last_name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Work Phone:</p>
                      <p>{lead.work_phone}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Mobile Phone 1:</p>
                      <p>{lead.mobile_phone_1}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Mobile Phone 2:</p>
                      <p>{lead.mobile_phone_2}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Source:</p>
                      <p>{lead.source}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Address:</p>
                      <p> {lead.address}</p>
                    </div>
                  </div>
                </div>

              )}

              {activeTab === "Notes" && (
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {lead.notes || "No notes available."}
                  </p>
                </div>
              )}

              {activeTab === "Related Activities" && (
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4 sm:mb-6">Related Activities</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-sm">

                    {/* Tasks */}
                    <div>
                      <h4 className="font-semibold mb-2">Task (2)</h4>
                      <div className="space-y-1 text-gray-700">
                        <p>Schedule follow-up call</p>
                        <p className="text-xs text-gray-500">Due: 2025-09-15 | In Progress</p>
                        <p>Schedule follow-up call</p>
                        <p className="text-xs text-gray-500">Due: 2025-09-18 | In Progress</p>
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
                      <h4 className="font-semibold mb-2">Notes (1)</h4>
                      <div className="space-y-1 text-gray-700">
                        <p>Initial conversation summary</p>
                        <p className="text-xs text-gray-500">Added: 2025-09-10</p>
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
                      <h4 className="font-semibold mb-2">Meetings (1)</h4>
                      <div className="space-y-1 text-gray-700">
                        <p> Product demo - Zoom </p>
                        <p className="text-xs text-gray-500">Scheduled: 2025-09-20</p>
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
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Quick Actions</h4>

                <div className="flex flex-col gap-2 w-full flex-grow">
                  {[{ icon: FiPhone, text: "Schedule Call" },
                  { icon: FiMail, text: "Send E-mail" },
                  { icon: FiCalendar, text: "Book Meeting" }].map(
                    ({ icon: Icon, text }) => (
                      <button
                        key={text}
                        className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm">
                        <Icon className="text-gray-600 w-4 h-4 flex-shrink-0" /> {text}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* STATUS */}
              <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                  Status
                </h4>
                <select
                  className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-gray-300"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value='New'>New</option>
                  <option value='Contacted'>Contacted</option>
                  <option value='Qualified'>Qualified</option>
                  <option value='Lost'>Lost</option>
                </select>

                <button
                  onClick={updateStatus}
                  disabled={selectedStatus === lead.status} // disabled if status not changed
                  className={`w-full py-1.5 rounded-md text-sm transition
      ${selectedStatus === lead.status
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-800"
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
