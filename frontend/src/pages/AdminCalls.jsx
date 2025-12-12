// frontend/src/pages/AdminCalls.jsx
import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiPhoneCall,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiPhone,
  FiMail,
  FiCalendar,
   FiCheckSquare
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import PaginationControls from "../components/PaginationControls.jsx";
import api from "../api.js";
import {toast} from 'react-toastify';
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";


// --- Constants (UI Options) ---
const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "MISSED", label: "Missed" },
];

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const ITEMS_PER_PAGE = 10;

// --- Helper Functions for UI Rendering ---
const normalizeStatus = (status) => (status ? status.toUpperCase() : "");

const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status.toString().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "PENDING": return "bg-indigo-100 text-indigo-700";
    case "COMPLETED": return "bg-green-100 text-green-700";
    case "CANCELLED": return "bg-gray-200 text-gray-700";
    case "MISSED": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getPriorityBadgeClass = (priority) => {
  switch (normalizeStatus(priority)) {
    case "HIGH": return "bg-red-100 text-red-700";
    case "MEDIUM": return "bg-yellow-100 text-yellow-700";
    case "LOW": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const formattedDateTime = (datetime) => {
  if (!datetime) return "--";
  return new Date(datetime).toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric", hour: "numeric", minute: "numeric", hour12: true
  });
};

export default function AdminCalls() {
  // ==================================================================================
  // TODO: IMPLEMENT DATA HANDLING HERE
  // ==================================================================================

  // 1. State Placeholders (Initialize these properly)
  const [showModal, setShowModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null); // Set this object to view details
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [relatedTo1Values, setRelatedTo1Values] = useState(null);
  const [relatedTo2Values, setRelatedTo2Values] = useState(null);
  const [calls, setCalls] = useState([]);
  const [team, setTeam] = useState(null);

 const [searchParams] = useSearchParams();
 const navigate = useNavigate();
 const location = useLocation();

  // INSERT THE FIXED EFFECT HERE
useEffect(() => {
  console.log("LOCATION STATE:", location.state);

  const shouldOpen = location.state?.openCallModal;
  const incomingId = location.state?.initialCallData?.relatedTo1 || searchParams.get("id");

  if (shouldOpen || incomingId) {
    console.log("AUTO OPEN CALL FORM");

    setShowModal(true);

    // Inject initial data if provided
    if (location.state?.initialCallData) {
      setFormData((prev) => ({
        ...prev,
       ...location.state.initialCallData,
     }));
    }

  // If call ID came from query / state, apply it
  if (incomingId) {
      setFormData((prev) => ({
        ...prev,
        relatedTo1: incomingId,
      }));
   }

    // Clear URL state so modal does not reopen on refresh
    navigate(location.pathname, { replace: true, state: {} });
  }
 }, [location, searchParams, navigate]); 

// -------------------------------------------------------

  const fetchCalls = async () => {
  try {
    const res = await api.get("/calls/admin/fetch-all");

    const data = Array.isArray(res.data) ? res.data : [];

    // Safe sort: also prevent mutation using spread
    const sortedData = [...data].sort((a, b) => {
      const dateA = a?.created_at ? new Date(a.created_at) : 0;
      const dateB = b?.created_at ? new Date(b.created_at) : 0;
      return dateB - dateA; // newest first
    });

    setCalls(sortedData);
    console.log(sortedData);

  } catch (err) {
    console.error("Error fetching calls:", err);
    toast.error("Failed to load calls");
  }
};

  
  const fetchUsers = async () => {
      try {
        const res = await api.get(`/users/all`);
        setTeam(res.data);
      } catch (err) {
        console.error(`Error fetching users: `, err)
      }
    }

  useEffect(() => {    
    fetchUsers();
    fetchCalls();
  }, [])

  const users = [];

  // Filter & Pagination State
  const searchQuery = "";
  const statusFilter = "Filter by Status";
  const userFilter = "Filter by Users";
  const priorityFilter = "Filter by Priority";
  const currentPage = 1;

  // Form State
  const isSubmitting = false;
  const [formData, setFormData] = useState({
    subject: "",
    call_time: "",
    duration_minutes: "",
    direction: "Outgoing",
    status: 'Planned',
    notes: '',
    relatedType1: 'Lead',
    relatedType2: 'Contact',
    relatedTo1: null,
    relatedTo2: null,
    assigned_to: null
  })

  // 2. Computed Values (Replacements for useMemo)
  const filteredCalls = calls; // Implement filtering logic
  const paginatedCalls = calls; // Implement pagination logic
  const callsLoading = false;
  const confirmProcessing = false;
  const updatingStatus = false;

  // Metrics (Dummy Data)
  const metricCards = [
    { title: "Total", value: 0, icon: FiPhoneCall, color: "text-slate-600", bgColor: "bg-slate-100" },
    { title: "Pending", value: 0, icon: FiClock, color: "text-indigo-600", bgColor: "bg-indigo-100" },
    { title: "Completed", value: 0, icon: FiCheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    { title: "Cancelled", value: 0, icon: FiXCircle, color: "text-gray-600", bgColor: "bg-gray-100" },
    { title: "Missed", value: 0, icon: FiXCircle, color: "text-red-600", bgColor: "bg-red-100" },
  ];

  const activeTab = "Overview"; // Or use state

  // 3. Handler Placeholders
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "relatedType1") {
        updated.relatedTo1 = "";
      }

      if (name === "relatedType2") {
        updated.relatedTo2 = "";
      }

      return updated;
    });
  };

  useEffect(() => {
    // Define an async function inside the effect
    const fetchData = async () => {
      try {
        // Optional: Clear options while loading to prevent stale data
        setRelatedTo1Values([]);

        let res;
        if (formData.relatedType1 === 'Lead') {
          res = await api.get(`/leads/admin/getLeads`);
        } else if (formData.relatedType1 === 'Account') {
          // FIX: Ensure this endpoint matches your backend for Accounts
          res = await api.get(`/accounts/admin/fetch-all`);
        }

        // Safety check to ensure we received an array
        if (res && Array.isArray(res.data)) {
          setRelatedTo1Values(res.data);
        } else {
          setRelatedTo1Values([]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setRelatedTo1Values([]);
      }
    };

    if (formData.relatedType1) {
      fetchData();
    }
  }, [formData.relatedType1]);

  useEffect(() => {
    // Define an async function inside the effect
    const fetchData = async () => {
      try {
        // Optional: Clear options while loading to prevent stale data
        setRelatedTo2Values([]);

        let res;
        if (formData.relatedType2 === 'Contact') {
          res = await api.get(`/contacts/from-acc/${formData.relatedTo1}`);
        } else if (formData.relatedType2 === 'Deal') {
          // FIX: Ensure this endpoint matches your backend for Accounts
          res = await api.get(`/deals/from-acc/${formData.relatedTo1}`);
        }

        // Safety check to ensure we received an array
        if (res && Array.isArray(res.data)) {
          setRelatedTo2Values(res.data);
        } else {
          setRelatedTo2Values([]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setRelatedTo2Values([]);
      }
    };

    if (formData.relatedType2) {
      fetchData();
    }
  }, [formData.relatedType2, formData.relatedTo1]);


  const handleSubmit = async(e) => { 
    e.preventDefault();     
    if (!formData.assigned_to) {
      toast.error("Please assign the call to a user.");
      return;
    }

    const payload = {
      ...formData,
      duration_minutes: parseInt(formData.duration_minutes),
      relatedTo1: parseInt(formData.relatedTo1),
      relatedTo2: parseInt(formData.relatedTo2),
      assigned_to: parseInt(formData.assigned_to),
    }

    try{
      const res = await api.post(`/calls/create`, payload);
      fetchCalls();      
      toast.success("Call created successfully!");      
    }catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Failed to create call.";
      toast.error(errorMsg);
    } finally{
      setShowModal(false);
    }
    
  };
  const handleCallClick = (call) => { setSelectedCall(call); };
  const handleCloseModal = () => { setShowModal(false); };
  const handleConfirmAction = () => { };
  const handleStatusUpdate = () => { };



  // Options for "Related To" dropdown (Dynamic Logic needed)
  const getRelatedToOptions = () => [];

  // ==================================================================================
  // END DATA HANDLING
  // ==================================================================================

  // --- View Components (JSX) ---

  const detailView = selectedCall ? (
    <div id="callModalBackdrop" onClick={(e) => e.target.id === "callModalBackdrop" && setSelectedCall(null)} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto hide-scrollbar relative box-border">
     
      {/* TOP SECTION */}
<div className="bg-tertiary w-full rounded-t-xl p-3 lg:p-3 relative">

  {/* Centered Title */}
  <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
    Calls
  </h1>
  <button
    onClick={() => setSelectedCall(null)}
    className="text-gray-500 hover:text-white transition cursor-pointer absolute top-3 right-3"
  >
    <HiX size={25} />
  </button>
</div>

          <div className="mt-4 gap-2 px-2 lg:gap-4 lg:mx-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-2 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">{selectedCall.subject}</h1>
            <span className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full ${getStatusBadgeClass(selectedCall.status)}`}>
              {formatStatusLabel(selectedCall.status)}
            </span>
          </div>
        </div>
         </div>

        <div className="border-b border-gray-200 my-5"></div>

        {/* TABS (Static for now, logic needed to switch tabs) */}
        <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
          {["Overview", "Notes", "Activities"].map((tab) => (
            <button key={tab} className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 ${activeTab === tab ? "bg-paper-white text-[#6A727D] border-white" : "text-white hover:bg-[#5c636d]"}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3">
            {activeTab === "Overview" && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <DetailRow label="Call Time" value={formattedDateTime(selectedCall.call_time)} />
                  <DetailRow label="Duration" value={selectedCall.duration_minutes ? `${selectedCall.duration_minutes} min` : null} />
                  <DetailRow label="Assigned To" value={`${selectedCall.call_assign_to.first_name} ${selectedCall.call_assign_to.last_name}`} />
                  {/* <DetailRow label="Related Type" value={selectedCall.related_type} />
                  <DetailRow label="Related To" value={selectedCall.related_to} /> */}

                  {selectedCall.lead && (
                    <DetailRow label="Lead" value={selectedCall.lead.title} />
                  )}
                  {selectedCall.contact && (
                    <DetailRow label="Contact" value={`${selectedCall.contact.first_name} ${selectedCall.contact.last_name}`} />
                  )} 
                  {selectedCall.account && (
                    <DetailRow label="Account" value={selectedCall.account.name} />
                  )}
                  {selectedCall.deal && (
                    <DetailRow label="Deal" value={selectedCall.deal.name} />
                  )}
                  <DetailRow label="Created At" value={formattedDateTime(selectedCall.created_at)} />
                </div>
              </div>
            )}

            {activeTab === "Notes" && (
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm break-words mt-4">
                <p className="text-sm font-medium text-gray-800 mb-2">Note</p>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCall.notes?.trim() || "No notes available."}</div>
              </div>
            )}

            {activeTab === "Activities" && <div className="p-4 text-gray-500">Activity timeline placeholder</div>}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Quick Actions</h4>
              <div className="flex flex-col gap-2 w-full">
                {[{ icon: FiPhone, text: "Schedule Call" }, 
                { icon: FiMail, text: "Send E-mail" }, 
                { icon: FiCalendar, text: "Book Meeting" },
                { icon: FiCheckSquare, text: "Tasks" },
              ].map(({ icon: Icon, text }) => (
                  <button key={text} className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm">
                    <Icon className="text-gray-600 w-4 h-4" /> {text}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Status</h4>
              <select className="border border-gray-200 rounded-md px-2 py-1.5 w-full text-sm mb-2" defaultValue={selectedCall.status}>
                {STATUS_OPTIONS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
              <button onClick={handleStatusUpdate} disabled={updatingStatus} className="w-full py-1.5 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
                {updatingStatus ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const formModal = showModal ? (
    <div id="modalBackdrop" onClick={(e) => e.target.id === "modalBackdrop" && handleCloseModal()} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar">
        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-black transition"><FiX size={22} /></button>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">Add New Call</h2>

        <form className="grid grid-cols-1 md:grid-cols-2 w-full gap-4 text-sm" onSubmit={handleSubmit}>
          <InputField label="Subject" className='md:col-span-2' name='subject' value={formData.subject} onChange={handleInputChange} disabled={isSubmitting} required />

          <div className="w-full flex flex-col">
            <select name="relatedType1" onChange={handleInputChange} value={formData.relatedType1} id="" className="outline-none cursor-pointer mb-1 w-22 text-gray-700">
              <option value="Lead">Lead</option>
              <option value="Account">Account</option>
            </select>

            {Array.isArray(relatedTo1Values) && relatedTo1Values.length > 0 ? (
              <select
                name="relatedTo1"
                onChange={handleInputChange}
                value={formData.relatedTo1}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
              >

                <option value="">--</option>

                {/* FIX: Map over the data to create options */}
                {relatedTo1Values.map((item) => (
                  <option key={item.id} value={item.id}>
                    {/* Handle naming differences between Leads and Accounts */}
                    {formData.relatedType1 === 'Lead'
                      ? `${item.title}`
                      : item.name
                    }
                  </option>
                ))}

              </select>
            ) : (
              <input
                type="text"
                value={`No ${formData.relatedType1 || ''} data found`}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none bg-gray-100 text-gray-500"
                disabled
              />
            )}
          </div>
          
            <div className="w-full flex flex-col">
              <select name="relatedType2" onChange={handleInputChange} value={formData.relatedType2} id="" className={`disabled:text-gray-400 text-gray-700 outline-none cursor-pointer mb-1 w-22`}
                disabled={formData.relatedType1 === 'Lead'}
              >
                <option value="Contact">Contact</option>
                <option value="Deal">Deal</option>
              </select>

              {Array.isArray(relatedTo2Values) && relatedTo2Values.length > 0 ? (
                <select
                  name="relatedTo2"
                  onChange={handleInputChange}
                  value={formData.relatedTo2}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
                  disabled={formData.relatedType1 === 'Lead'}
                >
                  <option value="">--</option>

                  {/* FIX: Map over the data to create options */}
                  {relatedTo2Values.map((item) => (
                    <option key={item.id} value={item.id}>
                      {/* Handle naming differences between Leads and Accounts */}
                      {formData.relatedType2 === 'Contact'
                        ? `${item.first_name} ${item.last_name}`
                        : item.name                          
                      }
                    </option>
                  ))}

                </select>
              ) : (
                <input
                  type="text"
                  value={`${formData.relatedType1 === 'Lead' ? ` ` : `No ${formData.relatedType2 || ''} data found`}`}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none bg-gray-100 text-gray-500"
                  disabled
                />
              )}
            </div>          

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Call Time</label>
            <input type="datetime-local" value={formData.call_time} onChange={handleInputChange} name="call_time" className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100" />
          </div>

          <div className="w-full">
            <label className="block text-gray-700 font-medium mb-1 text-sm">Duration</label>
            <div className="w-full rounded-md text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 flex flex-row items-center justify-start">
              <input type="tel" value={formData.duration_minutes} onChange={handleInputChange} name="duration_minutes" className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 w-20 mr-3" />
              <p>minutes</p>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-1 text-sm">Assign To</label>
            <select
              name="assigned_to"
              onChange={handleInputChange}
              value={formData.assigned_to || ""}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
            >
              <option value="">Select User</option>
              {Array.isArray(team) && team.length > 0 &&
                team.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))
              }
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Direction</label>
            <select name="direction" onChange={handleInputChange} value={formData.direction} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100" id="">
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Status</label>
            <select name="status" onChange={handleInputChange} value={formData.status} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100" id="">
              <option value="Planned">Planned</option>
              <option value="Held">Held</option>
              <option value="Not held">Not held</option>
            </select>
          </div>

          <TextAreaField className='col-span-2' label='Notes' value={formData.notes} onChange={handleInputChange} name='notes' />

          <div className="flex flex-col md:flex-row justify-end col-span-2 mt-4 gap-2 w-full">
            <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-4 py-2 text-white bg-tertiary border border-tertiary rounded hover:bg-secondary transition">
              {isSubmitting ? "Saving..." : "Save Call"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800"><FiPhoneCall className="mr-2 text-blue-600" /> Calls</h1>
          <button onClick={() => setShowModal(true)} className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0 cursor-pointer"><FiPlus className="mr-2" /> Add Call</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          {metricCards.map(m => <MetricCard key={m.title} {...m} />)}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500">
            <FiSearch size={20} className="text-gray-400 mr-3" />
            <input type="text" placeholder="Search calls" className="focus:outline-none text-base w-full" defaultValue={searchQuery} />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <select defaultValue={statusFilter} className="border border-gray-300 rounded-lg px-3 h-11 text-sm bg-white w-full">
              <option value="Filter by Status">Filter by Status</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select defaultValue={userFilter} className="border border-gray-300 rounded-lg px-3 h-11 text-sm bg-white w-full">
              <option value="Filter by Users">Filter by Users</option>
              {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>            
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
            <thead className="bg-gray-100 text-left text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Subject</th><th className="py-3 px-4">Related To</th>
                <th className="py-3 px-4">Call Time</th><th className="py-3 px-4">Assigned To</th><th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
  {callsLoading ? (
    <tr>
      <td colSpan={6} className="text-center py-4">Loading...</td>
    </tr>
  ) : paginatedCalls.length > 0 ? (
    paginatedCalls.map(call => (
      <tr
        key={call.id}
        onClick={() => handleCallClick(call)}
        className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
      >        
        <td className="py-3 px-4 text-blue-600 font-medium">
          {call.subject || "--"}
        </td>

        <td className="py-3 px-4">
          {call.lead && (
            <p className="font-medium text-blue-500 text-xs">{call.lead.title}</p>
          )}
          {call.account && (
            <p className="font-medium text-blue-500 text-xs">{call.account.name}</p>
          )}
          {call.contact && (
            <p className="font-medium text-blue-500 text-xs">{call.contact.first_name} {call.contact.last_name}</p>
          )}
          {call.deal && (
            <p className="font-medium text-blue-500 text-xs">{call.deal.name}</p>
          )}          
        </td>

        <td className="py-3 px-4 text-gray-800">
          {call.call_time ? new Date(call.call_time).toLocaleString() : "--"}
        </td>

        <td className="py-3 px-4 text-gray-800">
  {call?.call_assign_to
    ? `${call.call_assign_to.first_name} ${call.call_assign_to.last_name}`
    : "--"}
</td>


        <td className="py-3 px-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(call.status)}`}>
            {formatStatusLabel(call.status)}
          </span>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={6} className="text-center py-4 text-gray-500">No calls found.</td>
    </tr>
  )}
</tbody>

          </table>
        </div>
        <PaginationControls totalItems={filteredCalls.length} pageSize={ITEMS_PER_PAGE} currentPage={currentPage} onPrev={() => { }} onNext={() => { }} label="calls" />
      </div>

      {detailView}
      {formModal}
      {confirmModalData && <ConfirmationModal open title={confirmModalData.title} message={confirmModalData.message} confirmLabel={confirmModalData.confirmLabel} onConfirm={handleConfirmAction} onCancel={() => setConfirmModalData(null)} loading={confirmProcessing} />}
    </>
  );
}

// --- Sub Components ---

function MetricCard({ icon: Icon, title, value, color, bgColor }) {
  return (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
      <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}><Icon size={22} /></div>
      <div><p className="text-xs text-gray-500 uppercase">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
    </div>
  );
}

function InputField(props) {
  return <div className={props.className}><label className="block text-gray-700 font-medium mb-1 text-sm">{props.label}</label><input {...props} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100" /></div>;
}

function TextAreaField(props) {
  return <div className={props.className}><label className="block text-gray-700 font-medium mb-1 text-sm">{props.label}</label><textarea {...props} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 resize-none" /></div>;
}

function DetailRow({ label, value }) {
  return <p><span className="font-semibold">{label}:</span> <br /><span className="break-words">{value || "--"}</span></p>;
}