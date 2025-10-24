import React, { useState, useEffect, useMemo } from "react";

// Import all needed icons from react-icons/ci
import {
  CiSearch,
  CiEdit,
  CiTrash,
  CiCalendar,
  CiSaveDown2,
  CiCircleRemove,
  CiClock2,
  CiSquareCheck,
  CiPhone,
  CiMail,
  CiFileOn,
  CiPaperplane,
} from "react-icons/ci";

// --- ICON COMPONENTS ---
const FiSearch = (props) => <CiSearch {...props} />;
const FiEdit = (props) => <CiEdit {...props} />;
const FiTrash2 = (props) => <CiTrash {...props} />;
const FiCalendar = (props) => <CiCalendar {...props} />;
const FiDownload = (props) => <CiSaveDown2 {...props} />;
const FiX = (props) => <CiCircleRemove {...props} />;
const FiClock = (props) => <CiClock2 {...props} />;
const FiCheckSquare = (props) => <CiSquareCheck {...props} />;
const FiPhone = (props) => <CiPhone {...props} />;
const FiMail = (props) => <CiMail {...props} />;
const FiFileText = (props) => <CiFileOn {...props} />;
const FiSend = (props) => <CiPaperplane {...props} />;


// --- STATIC DATA (Required for dropdowns) ---

const STATIC_USERS = [
    { id: "u1", name: "Jane", last_name: "Doe" },
    { id: "u2", name: "William", last_name: "Smith" },
    { id: "u3", name: "Alice", last_name: "Johnson" },
    { id: "u4", name: "Current", last_name: "User" }, // Added for mock notes
];

const STATIC_RELATED_OPTIONS = [
    { id: "r1", name: "Innovate Co.", type: "Account" },
    { id: "r2", name: "Maria Santos", type: "Lead" },
    { id: "r3", name: "John Doe", type: "Contact" },
    { id: "r4", name: "Global Solutions Inc.", type: "Account" },
];

// --- MOCK DATA FOR INITIAL STATE ---

const MOCK_MEETINGS = [
    {
        id: "m1", 
        meetingTitle: "Q3 Strategy Review",
        location: "Boardroom A",
        duration: 60,
        meetingLink: 'N/A',
        agenda: 'Review Q3 performance and set Q4 priorities. Focus on shifting budget towards digital marketing initiatives based on recent market feedback.',
        dueDate: "2025-10-25", // Future date
        assignedTo: "Jane Doe",
        assignedToId: "u1",
        relatedType: "Account",
        relatedTo: "Innovate Co.",
        relatedToId: "r1",
        priority: "High",
        status: "Scheduled", 
        lastUpdated: "10/18/2025",
        notes: [
             { id: 1, user: "Jane Doe", date: "2025-10-18 09:00 AM", content: "Pre-meeting note: Key focus will be on the budget allocation for digital ads. Need approval for $50k increase." },
             { id: 2, user: "William Smith", date: "2025-10-18 10:15 AM", content: "Confirming all Q3 performance data is ready for presentation. The marketing team hit all KPIs." }
        ]
    },
    {
        id: "m2", 
        meetingTitle: "New Product Demo",
        location: "Zoom Call",
        duration: 45,
        meetingLink: 'https://zoom.link/demo456',
        agenda: 'Presentation of the new Fusion product features. We need to focus heavily on how feature X solves their specific pain point Y.',
        dueDate: "2025-10-15", // Past date (Overdue)
        assignedTo: "William Smith",
        assignedToId: "u2",
        relatedType: "Lead",
        relatedTo: "Maria Santos",
        relatedToId: "r2",
        priority: "High",
        status: "Scheduled", // Still scheduled, therefore overdue
        lastUpdated: "10/10/2025",
        notes: [] // Empty notes for this one
    },
    {
        id: "m3", 
        meetingTitle: "First Contact Follow-up",
        location: "Office 312",
        duration: 30,
        meetingLink: 'N/A',
        agenda: 'Brief check-in after initial contact. Discuss next steps and qualification of the opportunity. Need to confirm budget.',
        dueDate: "2025-10-20", // Recent past date
        assignedTo: "Alice Johnson",
        assignedToId: "u3",
        relatedType: "Contact",
        relatedTo: "John Doe",
        relatedToId: "r3",
        priority: "Low",
        status: "Completed", // Completed, therefore not overdue
        lastUpdated: "10/21/2025",
        notes: [
            { id: 3, user: "Alice Johnson", date: "2025-10-21 02:00 PM", content: "Meeting successfully completed. The client confirmed the budget is approved. Next step is to send the proposal." }
        ]
    },
    {
        id: "m4", 
        meetingTitle: "Contract Negotiation Session",
        location: "Teams Meeting",
        duration: 90,
        meetingLink: 'https://teams.link/contract',
        agenda: 'Finalize terms and signatures. Review all outstanding clauses and ensure legal alignment before closing.',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().substring(0, 10), // 3 days from now
        assignedTo: "Jane Doe",
        assignedToId: "u1",
        relatedType: "Account",
        relatedTo: "Global Solutions Inc.",
        relatedToId: "r4",
        priority: "Medium",
        status: "Scheduled", 
        lastUpdated: new Date().toLocaleDateString(),
        notes: []
    },
];


// Helper to check if a meeting is past its due date and not completed
const isMeetingOverdue = (meeting) => {
    if (meeting.status === 'Completed') return false;
    const dueDate = new Date(meeting.dueDate);
    const today = new Date();
    // Compare dates only (ignoring time)
    return dueDate < today && dueDate.toDateString() !== today.toDateString();
};


// --- METRIC CARD COMPONENT ---

const MetricCard = ({ title, value, icon, color }) => (
  <div className={`p-5 rounded-xl shadow-lg border border-gray-200 transition-all duration-300 transform hover:scale-[1.02] cursor-default ${color === 'blue' ? 'bg-blue-50/70' : color === 'green' ? 'bg-green-50/70' : color === 'red' ? 'bg-red-50/70' : 'bg-white'}`}>
    <div className="flex justify-between items-start">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {icon && React.cloneElement(icon, { className: `w-6 h-6 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-gray-400'}` })}
    </div>
    <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">{title}</p>
  </div>
);


// --- MEETING DETAIL MODAL COMPONENT ---

const MeetingDetailModal = ({ meeting, onClose, onAddNote }) => {
    // State to manage the active tab (Overview, Notes, Related to)
    const [activeTab, setActiveTab] = useState('Overview');
    const [newNoteContent, setNewNoteContent] = useState(''); // State for the new note input
    
    // Fallback for missing meeting data (shouldn't happen if selectedMeeting is checked before rendering)
    if (!meeting) return null;

    // Helper for tab styling
    const tabClass = (tabName) => 
        `flex-1 text-center px-6 py-3 text-sm font-semibold cursor-pointer transition-all duration-200 border-b-4
         ${activeTab === tabName 
            ? 'bg-white text-blue-600 border-blue-600' // Active: White background, Blue text, Blue bottom border
            : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-white' // Inactive: Gray background, Gray text, Gray border (to maintain height), Hover to White
        }`;
        
    const isOverdue = isMeetingOverdue(meeting);
    
    // Action button component
    const QuickActionButton = ({ icon, label }) => (
        <button 
            className="flex items-center space-x-2 py-3 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition text-sm shadow-sm w-full"
            onClick={() => window.confirm(`Mock action: ${label}`)} // Use window.confirm as mock action
        >
            {React.cloneElement(icon, { className: 'w-4 h-4' })}
            <span>{label}</span>
        </button>
    );
    
    // Component to render a single note item
    const NoteItem = ({ note }) => (
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{note.user}</p>
            <p className="text-xs text-gray-500 mb-2">{note.date}</p>
            <p className="text-sm text-gray-700">{note.content}</p>
        </div>
    );
    
    // Handler for adding a new note (MOCK)
    const handleNoteSubmit = (e) => {
        e.preventDefault();
        if (newNoteContent.trim() === '') return;
        
        const currentUser = STATIC_USERS.find(u => u.id === 'u4') || STATIC_USERS[0]; // Mock Current User
        
        const newNote = {
            id: Date.now(),
            user: `${currentUser.name} ${currentUser.last_name}`,
            date: new Date().toLocaleString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            }).replace(',', ''),
            content: newNoteContent.trim()
        };
        
        // Call the prop function to update notes in the parent state (App)
        onAddNote(meeting.id, newNote);
        setNewNoteContent('');
    };


    return (
        <div
            id="detailModalBackdrop"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 backdrop-blur-sm"
        >
            <div
                className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative max-h-[95vh] overflow-hidden flex flex-col transform scale-100" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex-shrink-0"> 
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <h1 className="text-sm font-semibold text-gray-500 mb-1 tracking-widest uppercase">Meeting with {meeting.relatedType}</h1>
                            <div className="flex items-center space-x-3">
                                <FiCalendar className="w-6 h-6 text-blue-600" />
                                <h2 className="text-3xl font-bold text-gray-800">{meeting.relatedTo}</h2>
                            </div>
                            <p className={`text-sm mt-2 font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
                                Status: {meeting.status} {isOverdue && <span className="text-red-500">(OVERDUE)</span>}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 flex-shrink-0 border-b border-gray-200"> 
                    <div className={tabClass('Overview')} onClick={() => setActiveTab('Overview')}>
                        Overview
                    </div>
                    <div className={tabClass('Notes')} onClick={() => setActiveTab('Notes')}>
                        Notes ({meeting.notes?.length || 0})
                    </div>
                    <div className={tabClass('Related to')} onClick={() => setActiveTab('Related to')}>
                        Related to
                    </div>
                </div>
                
                {/* Content Area */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
                    
                    {/* Main Content (Overview/Notes/Related) */}
                    <div className="lg:w-2/3 h-full flex flex-col"> 
                        <div className="h-full bg-white flex-1 p-4 rounded-xl border border-gray-200 shadow-lg flex flex-col overflow-y-auto"> 
                            {activeTab === 'Overview' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">{meeting.meetingTitle}</h3>
                                    <p className="text-gray-600"><strong>Agenda:</strong> {meeting.agenda}</p>
                                    <p className="text-gray-600"><strong>Location:</strong> {meeting.location}</p>
                                    <p className="text-gray-600"><strong>Duration:</strong> {meeting.duration} minutes</p>
                                    {meeting.meetingLink !== 'N/A' && <p className="text-blue-600 truncate"><strong>Link:</strong> <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">{meeting.meetingLink}</a></p>}
                                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                                        <p className="text-gray-500">Assigned To: <span className="font-semibold text-gray-700">{meeting.assignedTo}</span></p>
                                        <p className="text-gray-500">Priority: <span className="font-semibold text-gray-700">{meeting.priority}</span></p>
                                    </div>
                                </div>
                            )}
                            
                            {/* NOTES TAB CONTENT - Updated to use the structured notes component */}
                            {activeTab === 'Notes' && (
                                <div className="flex flex-col h-full space-y-4">
                                    {/* New Note Input Section */}
                                    <form onSubmit={handleNoteSubmit} className="flex flex-col flex-shrink-0 p-4 border border-blue-200 rounded-xl bg-blue-50/50 shadow-inner">
                                        <h3 className="text-base font-semibold text-gray-800 mb-2">Add New Note</h3>
                                        <textarea
                                            value={newNoteContent}
                                            onChange={(e) => setNewNoteContent(e.target.value)}
                                            placeholder={`What happened at the meeting with ${meeting.relatedTo}?`}
                                            rows={2}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                        ></textarea>
                                        <button
                                            type="submit"
                                            disabled={!newNoteContent.trim()}
                                            className="mt-3 ml-auto px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gray-800 hover:bg-gray-900 transition disabled:bg-gray-400 flex items-center space-x-1"
                                        >
                                            <FiSend className="w-4 h-4" />
                                            <span>Add Note</span>
                                        </button>
                                    </form>

                                    {/* Note History Section */}
                                    <div className="flex-1 overflow-y-auto space-y-3 pt-2">
                                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Note History</h3>
                                        {meeting.notes && meeting.notes.length > 0 ? (
                                            // Reverse array to show newest note first
                                            [...meeting.notes].reverse().map((note) => (
                                                <NoteItem key={note.id} note={note} />
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                                No notes have been recorded for this meeting yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Related to' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Related {meeting.relatedType} Details</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                        <p className="text-gray-800 font-bold">{meeting.relatedTo}</p>
                                        <p className="text-sm text-gray-500">{meeting.relatedType} ID: {meeting.relatedToId}</p>
                                        <p className="text-sm text-gray-500">Status: Active</p>
                                        <p className="text-sm text-gray-500">Main Contact: {meeting.assignedTo}</p>
                                        <p className="text-blue-600 text-sm mt-2 cursor-pointer hover:underline" onClick={() => window.confirm(`Navigating to ${meeting.relatedTo}`)}>View Full {meeting.relatedType} Record &rarr;</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Quick Actions Sidebar */}
                    <div className="lg:w-1/3 space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-lg flex-shrink-0 h-full">
                        <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm mb-3 border-b pb-2">Quick Actions</h3>
                        <QuickActionButton icon={<FiPhone className="text-blue-500" />} label="Schedule Call" />
                        <QuickActionButton icon={<FiMail className="text-blue-500" />} label="Send E-mail" />
                        <QuickActionButton icon={<FiCalendar className="text-blue-500" />} label="Book Meeting" />
                        <QuickActionButton icon={<FiFileText className="text-blue-500" />} label="Create Quote" />
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App = () => {
    const [showModal, setShowModal] = useState(false); // For the Add Meeting Modal
    const [meetings, setMeetings] = useState(MOCK_MEETINGS); 
    const [selectedMeeting, setSelectedMeeting] = useState(null); 
    const [newMeetingData, setNewMeetingData] = useState({
        duration: 30,
        priority: 'Medium',
        relatedType: 'Lead',
        dueDate: new Date().toISOString().substring(0, 10)
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Use the renamed static constants
    const users = STATIC_USERS;
    const relatedToOptions = STATIC_RELATED_OPTIONS.filter(item => item.type === newMeetingData.relatedType);

    useEffect(() => {
      document.title = "Activities | CRM";
    }, []);


    // --- FRONT-END STATE MANAGEMENT (MOCKED CRUD) ---

    const handleAddNote = (meetingId, newNote) => {
        setMeetings(prevMeetings => 
            prevMeetings.map(m => 
                m.id === meetingId
                    ? { ...m, notes: [ ...(m.notes || []), newNote ] } // Add new note to the meeting's notes array
                    : m
            )
        );
        // Also update the selectedMeeting state so the modal updates immediately
        setSelectedMeeting(prevSelected => 
            prevSelected && prevSelected.id === meetingId
                ? { ...prevSelected, notes: [ ...(prevSelected.notes || []), newNote ] }
                : prevSelected
        );
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMeetingData(prev => ({ 
            ...prev, 
            [name]: value 
        }));
    };

    const handleAddMeeting = (e) => {
        e.preventDefault();
        
        const assignedUser = users.find(u => u.id === newMeetingData.assignedToId);
        const relatedItem = STATIC_RELATED_OPTIONS.find(r => r.id === newMeetingData.relatedToId);

        if (!assignedUser || !relatedItem) {
            console.error("Missing required assignments/relations.");
            // Note: window.confirm is used here only because it's required for the Canvas environment and is replacing alert().
            window.confirm("Please ensure Assigned To and Related To fields are selected."); 
            return;
        }

        const newMeeting = {
            id: Date.now().toString(), 
            meetingTitle: newMeetingData.meetingTitle || 'Untitled Meeting',
            location: newMeetingData.location || 'Remote',
            duration: parseInt(newMeetingData.duration) || 30,
            meetingLink: newMeetingData.meetingLink || 'N/A',
            agenda: newMeetingData.agenda || 'No agenda provided.',
            dueDate: newMeetingData.dueDate,
            assignedTo: `${assignedUser.name} ${assignedUser.last_name}`,
            assignedToId: newMeetingData.assignedToId,
            relatedType: newMeetingData.relatedType,
            relatedTo: relatedItem.name,
            relatedToId: newMeetingData.relatedToId,
            priority: newMeetingData.priority,
            status: "Scheduled", // Default status
            lastUpdated: new Date().toLocaleDateString(),
            notes: [] // Initialize notes array
        };

        setMeetings([newMeeting, ...meetings]);
        setNewMeetingData({ duration: 30, priority: 'Medium', relatedType: 'Lead', dueDate: new Date().toISOString().substring(0, 10) }); // Reset form
        setShowModal(false);
    };
    
    // --- DATA FILTERING AND METRICS ---

    const filteredMeetings = useMemo(() => {
        let currentMeetings = meetings;

        // 1. Filter by Status
        if (statusFilter !== 'All') {
            currentMeetings = currentMeetings.filter(m => {
                const isOverdue = isMeetingOverdue(m);
                if (statusFilter === 'Pending') return isOverdue;
                return m.status === statusFilter;
            });
        }

        // 2. Filter by Search Term
        if (searchTerm.trim()) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            currentMeetings = currentMeetings.filter(
                m => m.meetingTitle?.toLowerCase().includes(lowerCaseSearch) ||
                     m.assignedTo?.toLowerCase().includes(lowerCaseSearch) ||
                     m.relatedTo?.toLowerCase().includes(lowerCaseSearch) ||
                     m.location?.toLowerCase().includes(lowerCaseSearch)
            );
        }
        
        // Sort by Due Date (soonest first)
        currentMeetings.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        return currentMeetings;
    }, [meetings, searchTerm, statusFilter]);

    // Metric calculation logic
    const meetingMetrics = useMemo(() => {
        const total = meetings.length;
        const scheduled = meetings.filter(m => m.status === 'Scheduled').length;
        const completed = meetings.filter(m => m.status === 'Completed').length;
        
        // Pending/Overdue: Scheduled/In-Progress meetings that are past due date
        const overdue = meetings.filter(isMeetingOverdue).length;
        
        return {
            total,
            scheduled,
            completed,
            overdue
        };
    }, [meetings]);

    // Helper to format priority styling
    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-700';
            case 'Medium':
            case 'medium': 
                return 'bg-yellow-100 text-yellow-700';
            case 'Low':
            case 'low': 
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };
    
    // Helper to mock deletion
    const handleDeleteMeeting = (id) => {
        // Mocked replacement for window.confirm() which is forbidden in the standard environment
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            setMeetings(meetings.filter(m => m.id !== id));
        }
    }


    // --- RENDERING ---

    return (
        <div className="p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <h2 className="flex items-center text-xl sm:text-2xl font-bold text-gray-800">
                    <FiCalendar className="mr-2 text-blue-600 w-6 h-6" /> Activities Management
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setNewMeetingData({ duration: 30, priority: 'Medium', relatedType: 'Lead', dueDate: new Date().toISOString().substring(0, 10) }); // Reset form
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto text-sm font-medium shadow-md"
                    >
                        ＋ Schedule Meeting
                    </button>
                </div>
            </div>
            
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard 
                    title="Total Meetings" 
                    value={meetingMetrics.total} 
                    icon={<FiCalendar />}
                    color="white"
                />
                <MetricCard 
                    title="Scheduled" 
                    value={meetingMetrics.scheduled} 
                    icon={<FiClock />}
                    color="blue"
                />
                <MetricCard 
                    title="Completed" 
                    value={meetingMetrics.completed} 
                    icon={<FiCheckSquare />}
                    color="green"
                />
                <MetricCard 
                    title="Pending/Overdue" 
                    value={meetingMetrics.overdue} 
                    icon={<FiEdit />}
                    color="red"
                />
            </div>


            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-4 mb-8 gap-3">
                <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-full md:w-80 shadow-sm transition duration-150 focus-within:ring-2 focus-within:ring-blue-400">
                    <FiSearch className="text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by Title, Person, or Location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ml-2 bg-transparent w-full outline-none text-sm placeholder-gray-400"
                    />
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white shadow-sm w-full md:w-auto focus:ring-2 focus:ring-blue-400 outline-none"
                >
                    <option value="All">All Meetings</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending/Overdue</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white shadow-xl overflow-x-auto rounded-xl border border-gray-200">
                {/* Table Header - ADJUSTED GRID TEMPLATE TO ADD STATUS COLUMN */}
                <div className="grid grid-cols-10 md:grid-cols-[1fr_2.5fr_1fr_1.5fr_1.5fr_1.5fr_1fr] bg-gray-100 font-semibold text-gray-700 text-xs uppercase tracking-wider px-6 py-3 border-b border-gray-200">
                    <div className="hidden md:block">Priority</div>      
                    <div className="col-span-4 md:col-span-1">Meeting Title</div>
                    <div className="col-span-2 md:col-span-1">Due Date</div>
                    <div className="col-span-3 md:col-span-1">Assigned To</div>
                    <div className="hidden md:block md:col-span-1">Related To</div>
                    <div className="hidden md:block md:col-span-1">Status</div> {/* NEW STATUS HEADER */}
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* Table Rows */}
                {filteredMeetings.length > 0 ? (
                    filteredMeetings.map((meeting, i) => {
                        const isOverdue = isMeetingOverdue(meeting);
                        
                        // Determine status styling
                        const getStatusStyle = (status) => {
                            if (isOverdue) return 'text-red-600';
                            switch(status) {
                                case 'Completed': return 'text-green-600';
                                case 'Scheduled': return 'text-yellow-600';
                                default: return 'text-gray-600';
                            }
                        };
                        
                        return (
                        <div
                            key={meeting.id}
                            // ADJUSTED GRID TEMPLATE
                            onClick={() => setSelectedMeeting(meeting)} 
                            className={`grid grid-cols-10 md:grid-cols-[1fr_2.5fr_1fr_1.5fr_1.5fr_1.5fr_1fr] px-6 py-4 text-sm transition duration-100 items-center cursor-pointer
                                ${i < filteredMeetings.length - 1 ? 'border-b border-gray-100' : ''}
                                ${isOverdue ? 'bg-red-50/50 hover:bg-red-100' : 'hover:bg-blue-50/50'}
                            `}
                        >
                            
                            {/* Priority */}
                            <div className="hidden md:block">
                                <span className={`py-1 px-3 inline-block rounded-full text-xs font-semibold ${getPriorityStyle(meeting.priority)}`}>
                                    {meeting.priority}
                                </span>
                            </div>

                            {/* Meeting Title */}
                            <div className="truncate font-medium col-span-4 md:col-span-1 text-blue-700 hover:text-blue-800">
                                {meeting.meetingTitle} 
                                {isOverdue && <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white hidden sm:inline-block">OVERDUE</span>}
                                {/* Mobile display of Priority and Related To */}
                                <div className="md:hidden mt-1 flex flex-col space-y-1 text-xs">
                                    <span className={`py-0.5 px-2 inline-block rounded-full font-semibold w-fit ${getPriorityStyle(meeting.priority)}`}>
                                        {meeting.priority}
                                    </span>
                                    <span className="text-gray-600 font-medium">{meeting.relatedTo} ({meeting.relatedType})</span>
                                </div>
                            </div>
                            
                            {/* Due Date */}
                            <div className="truncate text-gray-600 col-span-2 md:col-span-1">{meeting.dueDate}</div>
                            
                            {/* Assigned To */}
                            <div className="truncate text-gray-600 col-span-3 md:col-span-1">{meeting.assignedTo}</div>

                            {/* Related To (Desktop only) */}
                            <div className="truncate hidden md:block md:col-span-1 text-blue-600 font-medium">
                                {meeting.relatedTo} ({meeting.relatedType})
                            </div>
                            
                            {/* Status (Desktop only) - NEW COLUMN */}
                            <div className="truncate hidden md:block md:col-span-1 font-semibold">
                                <span className={getStatusStyle(meeting.status)}>
                                    {meeting.status}
                                </span>
                                {isOverdue && <span className="text-red-500 ml-1">(!)</span>}
                            </div>
                            
                            {/* Actions - MUST stop propagation to prevent opening the detail modal when clicking actions */}
                            <div className="flex justify-end space-x-3 col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                    title="Edit Meeting (Mock)"
                                    onClick={() => window.confirm(`Editing ${meeting.meetingTitle}`)}
                                    className="text-blue-500 hover:text-blue-700 transition"
                                >
                                    <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                    title="Delete Meeting (Mock)"
                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                    className="text-red-500 hover:text-red-700 transition"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        )
                    }
                )) : (
                    <div className="p-10 text-center text-gray-500">
                        No meetings found matching your criteria. Start by scheduling a new meeting!
                    </div>
                )}
            </div>

            {/* Schedule Meeting Modal (omitted for brevity) */}
            {showModal && (
                <div
                    id="modalBackdrop"
                    onClick={() => setShowModal(false)}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 sm:p-8 relative border border-gray-100 max-h-[95vh] overflow-y-auto transform scale-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h1 className="text-sm font-semibold text-gray-500 mb-1 tracking-widest uppercase">ACTIVITIES MEETING</h1>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Schedule Meeting</h2>
                        <p className="text-sm text-gray-500 mb-6 border-b pb-4">Create new Meeting</p>
                        
                        <form onSubmit={handleAddMeeting} className="grid grid-cols-2 gap-4 text-sm">
                            
                            {/* Meeting Title */}
                            <div className="flex flex-col col-span-2">
                                <label className="text-gray-700 font-medium mb-1">Meeting Title*</label>
                                <input
                                    type="text"
                                    name="meetingTitle"
                                    value={newMeetingData.meetingTitle || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Follow-up call with Client"
                                    required
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                                />
                            </div>

                            {/* Location */}
                            <div className="flex flex-col col-span-1">
                                <label className="text-gray-700 font-medium mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={newMeetingData.location || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Conference Hall Southmall"
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                                />
                            </div>

                            {/* Duration */}
                            <div className="flex flex-col col-span-1">
                                <label className="text-gray-700 font-medium mb-1">Duration (min)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={newMeetingData.duration || 30}
                                    onChange={handleInputChange}
                                    placeholder="30"
                                    min="5"
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                                />
                            </div>

                            {/* Meeting Link */}
                            <div className="flex flex-col col-span-2">
                                <label className="text-gray-700 font-medium mb-1">Meeting Link</label>
                                <input
                                    type="url"
                                    name="meetingLink"
                                    value={newMeetingData.meetingLink || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://zoom.us/j/123456"
                                    className="border border-blue-400 ring-2 ring-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                                />
                            </div>

                            {/* Agenda */}
                            <div className="flex flex-col col-span-2">
                                <label className="text-gray-700 font-medium mb-1">Agenda</label>
                                <textarea
                                    name="agenda"
                                    value={newMeetingData.agenda || ''}
                                    onChange={handleInputChange}
                                    placeholder="Add call notes and key discussion points."
                                    rows={3}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none transition"
                                />
                            </div>

                            {/* Due Date */}
                            <div className="flex flex-col col-span-1">
                                <label className="text-gray-700 font-medium mb-1">Due Date*</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={newMeetingData.dueDate || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
                                />
                            </div>

                            {/* Assigned To */}
                            <div className="flex flex-col col-span-1">
                                <label className="text-gray-700 font-medium mb-1">Assigned to*</label>
                                <select
                                    name="assignedToId"
                                    value={newMeetingData.assignedToId || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white transition"
                                >
                                    <option value="" disabled>Select User</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} {user.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Related Type */}
                            <div className="flex flex-col col-span-1">
                                <label className="text-gray-700 font-medium mb-1">Related Type</label>
                                <select
                                    name="relatedType"
                                    value={newMeetingData.relatedType}
                                    onChange={handleInputChange}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white transition"
                                >
                                    <option value="Lead">Lead</option>
                                    <option value="Contact">Contact</option>
                                    <option value="Account">Account</option>
                                </select>
                            </div>

                            {/* Related To */}
                            <div className="flex flex-col col-span-1">
                                <label className="text-gray-700 font-medium mb-1">Related To*</label>
                                <select
                                    name="relatedToId"
                                    value={newMeetingData.relatedToId || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white transition"
                                >
                                    <option value="" disabled>Select {newMeetingData.relatedType}</option>
                                    {relatedToOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div className="flex flex-col col-span-1">
                                <label className="text-gray-700 font-medium mb-1">Priority</label>
                                <select
                                    name="priority"
                                    value={newMeetingData.priority}
                                    onChange={handleInputChange}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white transition"
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            
                            {/* Empty spacer for alignment */}
                            <div className="col-span-1"></div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end space-x-3 mt-6 col-span-2 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition font-medium shadow-md"
                                >
                                    Create Call
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Detail View Modal */}
            {selectedMeeting && (
                <MeetingDetailModal 
                    meeting={selectedMeeting} 
                    onClose={() => setSelectedMeeting(null)} 
                    onAddNote={handleAddNote}
                />
            )}
        </div>
    );
};

export default App;