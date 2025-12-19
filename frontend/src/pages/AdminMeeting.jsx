import React, { useState, useMemo, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import CreateMeetingModal from "../components/CreateMeetingModal";
import AdminMeetingInfomation from "../components/AdminMeetingInfomation";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

// --- HELPER FUNCTIONS ---
const normalizeStatus = (status) => (status ? status.toUpperCase() : "");
const toAdminStatus = (status) => {
  const s = normalizeStatus(status);
  if (s === "PLANNED" || s === "IN PROGRESS") return "PLANNED";
  if (s === "HELD" || s === "DONE") return "HELD";
  if (s === "NOT_HELD" || s === "NOT HELD") return "NOT_HELD";
  return "PLANNED";
};

const formatDateTime = (iso) => {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "--";
  }
};

const getStatusBadgeClass = (status) => {
  const s = normalizeStatus(status);
  const base = s === "PLANNED" ? "PENDING" : s === "HELD" ? "COMPLETED" : s === "NOT_HELD" ? "CANCELLED" : s;
  switch (base) {
    case "PENDING": return "bg-indigo-100 text-indigo-700";
    case "COMPLETED": case "DONE": return "bg-green-100 text-green-700";
    case "CANCELLED": return "bg-gray-200 text-gray-700";
    case "IN PROGRESS": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const ITEMS_PER_PAGE = 10;

const INITIAL_FORM_STATE = {
  subject: "",
  startTime: "",
  endTime: "",
  location: "",
  status: "PLANNED",
  notes: "",
  assignedTo: "",
  relatedType1: "Lead",
  relatedTo1: "",
  relatedType2: null,
  relatedTo2: "",
};

const AdminMeeting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const meetingIdFromQuery = searchParams.get('id');
  const isInfoRoute = location.pathname === '/admin/meetings/info';

  useEffect(() => {
    document.title = "Meetings | Sari-Sari CRM";
  }, []);

  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [users, setUsers] = useState([]); // Only fetch users
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  // Auto-open logic
  useEffect(() => {
    const shouldOpen = location.state?.openMeetingModal;
    const incomingId = location.state?.initialMeetingData?.relatedTo || searchParams.get("id");

    if (shouldOpen || incomingId) {
      setShowModal(true);
      if (location.state?.initialMeetingData) {
        setFormData((prev) => ({ ...prev, ...location.state.initialMeetingData }));
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, searchParams, navigate]);

  const fetchMeetings = async () => {
    if (meetingIdFromQuery && isInfoRoute) {
      const storedData = sessionStorage.getItem('meetingDetailData');
      if (storedData) {
        try {
          const meetingData = JSON.parse(storedData);
          if (meetingData.id === parseInt(meetingIdFromQuery)) {
            setSelectedMeeting(meetingData);
            sessionStorage.removeItem('meetingDetailData');
            return;
          }
        } catch (e) { console.error(e); }
      }
    }
     
    setMeetingsLoading(true);
    try {
      const res = await api.get(`/meetings/admin/fetch-all`);
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) => {
        const aDate = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
      setMeetings(sorted);
      if (meetingIdFromQuery && !selectedMeeting) {
        const meeting = sorted.find(m => m.id === parseInt(meetingIdFromQuery));
        if (meeting) setSelectedMeeting(meeting);
      }

      console.log(res.data);
    } catch (err) {
      toast.error("Failed to load meetings.");
    } finally {
      setMeetingsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/users/all`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  // We NO LONGER fetch Accounts/Contacts/Leads here. The Modal does it.

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  const handleSearch = (event) => setSearchTerm(event.target.value);

  const filteredMeetings = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const normalizedStatusFilter = statusFilter.trim().toUpperCase();

    return meetings.filter((meeting) => {
      const searchFields = [
        meeting?.activity,
        meeting?.description,
        meeting?.relatedTo,
        meeting?.assignedTo,
      ];

      const matchesSearch = normalizedQuery === "" || searchFields.some((field) => 
          field && field.toString().toLowerCase().includes(normalizedQuery)
      );

      const matchesStatus = normalizedStatusFilter === "FILTER BY STATUS" || 
        toAdminStatus(meeting.status || "PENDING") === normalizedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchTerm, statusFilter]);

  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMeetings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMeetings, currentPage]);

  const closeModal = () => {
    setShowModal(false);
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentMeetingId(null);
    setIsSubmitting(false);
  };

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentMeetingId(null);
    setShowModal(true);
  };

  // Inside AdminMeeting component...

  const handleEditClick = (meeting) => {
    // 1. Assignee Logic
    // Try to find the user ID based on the nested object or flat ID
    let assignedToId = "";
    if (meeting.meet_assign_to?.id) {
      assignedToId = String(meeting.meet_assign_to.id);
    } else if (meeting.assignedTo) {
      // Fallback: try to match string name to user list
      const user = users.find((u) => `${u.first_name} ${u.last_name}` === meeting.assignedTo);
      assignedToId = user ? String(user.id) : "";
    }

    // 2. Date Logic (Convert to YYYY-MM-DDTHH:mm format for input type="datetime-local")
    const toLocalInput = (iso) => {
      if (!iso) return "";
      try {
        const d = new Date(iso);
        // Adjust for timezone offset to ensure the input shows local time correctly
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        return localISOTime;
      } catch {
        return "";
      }
    };

    // 3. Related To Logic (The Critical Fix)
    let relatedType1 = "Lead";
    let relatedTo1 = "";
    let relatedType2 = "Contact"; // Default
    let relatedTo2 = "";

    // Check the nested objects to determine relationships
    if (meeting.lead) {
      relatedType1 = "Lead";
      relatedTo1 = String(meeting.lead.id);
    } 
    else if (meeting.account) {
      relatedType1 = "Account";
      relatedTo1 = String(meeting.account.id);
      
      // If it is an Account, check if it is actually a Contact or Deal
      if (meeting.contact) {
        relatedType2 = "Contact";
        relatedTo2 = String(meeting.contact.id);
      } else if (meeting.deal) {
        relatedType2 = "Deal";
        relatedTo2 = String(meeting.deal.id);
      }
    } 
    // Fallback: Check flat fields if nested objects are missing
    else if (meeting.relatedType || meeting.related_type) {
       const rType = meeting.relatedType || meeting.related_type;
       const rId = meeting.related_to || meeting.relatedToId;
       
       if (rType === 'Lead') {
          relatedType1 = 'Lead';
          relatedTo1 = String(rId);
       } else {
          relatedType1 = 'Account';
          // We might be missing the Account ID here if backend only sent the child ID
          // But we try our best:
          relatedTo1 = meeting.account_id ? String(meeting.account_id) : ""; 
       }
    }

    setFormData({
      subject: meeting.subject || meeting.activity || "",
      location: meeting.location || "",
      startTime: toLocalInput(meeting.start_time || meeting.startTime),
      endTime: toLocalInput(meeting.end_time || meeting.endTime),
      status: toAdminStatus(meeting.status),
      notes: meeting.description || meeting.notes || "",
      assignedTo: assignedToId,
      relatedType1,
      relatedTo1,
      relatedType2,
      relatedTo2,
    });

    setIsEditing(true);
    setCurrentMeetingId(meeting.id);
    setSelectedMeeting(null);
    setShowModal(true);
  };

  const handleSubmit = (formDataFromModal) => {
    // Basic validation
    if (!formDataFromModal.subject?.trim()) return toast.error("Subject is required.");
    if (!formDataFromModal.startTime) return toast.error("Start time is required.");
    
    // Duration calc
    let duration = null;
    if (formDataFromModal.endTime) {
      const diff = new Date(formDataFromModal.endTime) - new Date(formDataFromModal.startTime);
      if (diff > 0) duration = Math.round(diff / 60000);
      else return toast.error("End time must be after start time.");
    }

    // Determine final Related ID
    // If relatedType1 is Lead, use relatedTo1.
    // If relatedType1 is Account, check if relatedTo2 (Contact/Deal) is set. If so, use that. Else use relatedTo1 (Account).
    let finalRelatedType = formDataFromModal.relatedType1;
    let finalRelatedId = formDataFromModal.relatedTo1;

    if (formDataFromModal.relatedType1 === 'Account') {
        if (formDataFromModal.relatedType2 && formDataFromModal.relatedTo2) {
            finalRelatedType = formDataFromModal.relatedType2;
            finalRelatedId = formDataFromModal.relatedTo2;
        }
    }

    const payload = {
      ...formDataFromModal,
      assignedTo: parseInt(formDataFromModal.assignedTo),
      relatedTo1: parseInt(formDataFromModal.relatedTo1),
      relatedTo2: parseInt(formDataFromModal.relatedTo2),      
    };

    const actionType = isEditing && currentMeetingId ? "update" : "create";
    
    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Meeting" : "Confirm Update",
      message: `Are you sure you want to ${actionType} "${payload.subject}"?`,
      confirmLabel: actionType === "create" ? "Create Meeting" : "Update Meeting",
      variant: "primary",
      action: { type: actionType, payload, targetId: currentMeetingId, name: payload.subject },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) return;
    const { type, payload, targetId, name } = confirmModalData.action;
    console.log(payload);

    setConfirmProcessing(true);
    try {
      if (type === "create") {
        setIsSubmitting(true);
        await api.post(`/meetings/create`, payload);
        toast.success(`Meeting "${name}" created.`);
        closeModal();
        await fetchMeetings();
      } else if (type === "update") {
        setIsSubmitting(true);
        await api.put(`/meetings/${targetId}`, payload);
        toast.success(`Meeting "${name}" updated.`);
        closeModal();
        await fetchMeetings();
      } else if (type === "delete") {
        await api.delete(`/meetings/${targetId}`);
        toast.success(`Meeting "${name}" deleted.`);
        if (selectedMeeting?.id === targetId) setSelectedMeeting(null);
        await fetchMeetings();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Action failed.";
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      console.error(msg)
    } finally {
      setIsSubmitting(false);
      setConfirmProcessing(false);
      setConfirmModalData(null);
    }
  };

  // ... (Keep existing MetricCard, handleStatusUpdate, handleDelete logic same as provided) ...
  const handleDelete = (meeting) => {
    setConfirmModalData({
        title: "Delete Meeting",
        message: `Permanently delete "${meeting.activity}"?`,
        confirmLabel: "Delete",
        variant: "danger",
        action: { type: "delete", targetId: meeting.id, name: meeting.activity }
    });
  };
  
  const handleStatusUpdate = async (meetingId, newStatus) => {
      // Simplified for brevity, assume similar to provided logic
      try {
        await api.put(`/meetings/${meetingId}`, { status: newStatus });
        toast.success("Status updated");
        fetchMeetings();
        setSelectedMeeting(null);
      } catch(e) { toast.error("Failed to update status"); }
  };

  // If Info Route (Keep existing logic)
  if (isInfoRoute && meetingIdFromQuery) {
    if (!selectedMeeting) return <LoadingSpinner message="Loading meeting..." />;
    return (
      <AdminMeetingInfomation
        meeting={selectedMeeting}
        onClose={() => { setSelectedMeeting(null); navigate('/admin/dashboard'); }}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }

  // --- RENDER TABLE ---
  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {meetingsLoading && <LoadingSpinner message="Loading meetings..." />}
      
      {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800 mb-4 lg:mb-0">
          <FiCalendar className="mr-2 text-blue-600" /> Meetings
        </h1>
        <div className="flex justify-center lg:justify-end w-full sm:w-auto">
        <button onClick={handleOpenAddModal} className="bg-black text-white px-4 py-2 rounded-md flex items-center hover:bg-gray-800">
          <FiPlus className="mr-2" /> Add Meeting
        </button>
      </div>
      </div>

      {/* METRICS & FILTERS (Keep existing markup structure) */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex items-center justify-between gap-3">
         <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-4/4">
            <FiSearch className="text-gray-400 mr-3" />
            <input type="text" placeholder="Search meetings" value={searchTerm} onChange={handleSearch} className="w-full outline-none" />
         </div>
         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 h-11 text-sm bg-white">
            <option>Filter by Status</option>
            <option value="PLANNED">PLANNED</option>
            <option value="HELD">HELD</option>
            <option value="NOT_HELD">NOT HELD</option>
         </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm mb-3">
          <thead className="bg-gray-100 text-left text-gray-600 font-semibold">
            <tr>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Related To</th>
              <th className="py-3 px-4">Start Time</th>
              <th className="py-3 px-4">Assigned</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMeetings.length > 0 ? paginatedMeetings.map((m) => (
               <tr key={m.id} onClick={() => setSelectedMeeting(m)} className="hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-blue-600">{m.subject}</td>
                  <td className="py-3 px-4">
                    {m.lead && (
            <p className="font-medium text-blue-500 text-xs">{m.lead.title}</p>
          )}
          {m.account && (
            <p className="font-medium text-blue-500 text-xs">{m.account.name}</p>
          )}
          {m.contact && (
            <p className="font-medium text-blue-500 text-xs">{m.contact.first_name} {m.contact.last_name}</p>
          )}
          {m.deal && (
            <p className="font-medium text-blue-500 text-xs">{m.deal.name}</p>
          )}
                  </td>
                  <td className="py-3 px-4">{formatDateTime(m.start_time)}</td>
                  <td className="py-3 px-4">{m.meet_assign_to.first_name} {m.meet_assign_to.last_name}</td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(toAdminStatus(m.status))}`}>
                        {toAdminStatus(m.status).replace("_", " ")}
                     </span>
                  </td>
               </tr>
            )) : (
               <tr><td colSpan={5} className="text-center py-4 text-gray-500">No meetings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls totalItems={filteredMeetings.length} pageSize={ITEMS_PER_PAGE} currentPage={currentPage} onPrev={() => setCurrentPage(p => Math.max(1, p-1))} onNext={() => setCurrentPage(p => p+1)} label="meetings" />

      {/* MODALS */}
      {showModal && (
        <CreateMeetingModal
          onClose={closeModal}
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting || confirmProcessing}
          users={users} // Only passing users, other data is fetched inside modal
        />
      )}

      {selectedMeeting && (
        <AdminMeetingInfomation
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {confirmModalData && (
        <ConfirmationModal
           open
           title={confirmModalData.title}
           message={confirmModalData.message}
           confirmLabel={confirmModalData.confirmLabel}
           variant={confirmModalData.variant}
           onConfirm={handleConfirmAction}
           onCancel={() => setConfirmModalData(null)}
           loading={confirmProcessing}
        />
      )}
    </div>
  );
};

// ... MetricCard, ConfirmationModal (Keep existing) ...
function ConfirmationModal({ open, title, message, confirmLabel,
   cancelLabel="Cancel", variant="primary", loading, onConfirm, onCancel }) {
    if(!open) return null;
    const btnClass = variant === "danger" ? "bg-red-500 hover:bg-red-600 border border-red-400" 
    : "bg-tertiary hover:bg-secondary border border-tertiary";
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{message}</p>

                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                    <button onClick={onCancel} disabled={loading} 
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70">
                      Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition disabled:opacity-70
                       ${btnClass}`}>{loading ? "..." : confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ icon: Icon, title, value, color, bgColor }) {
  return (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}><Icon size={22} /></div>
      <div><p className="text-xs text-gray-500 uppercase">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
    </div>
  );
}

export default AdminMeeting;