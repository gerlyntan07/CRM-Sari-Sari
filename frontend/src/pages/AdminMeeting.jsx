import React, { useState } from 'react';
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiBriefcase,
  FiTrendingUp,
  FiCheckCircle,
} from 'react-icons/fi';
import { LuUserSearch } from 'react-icons/lu';
import CreateMeetingModal from '../components/CreateMeetingModal';
import AdminMeetingInfomation from '../components/AdminMeetingInfomation';

// --- DUMMY DATA ---
const DUMMY_MEETINGS = [
  {
    id: 1,
    priority: 'HIGH',
    activity: 'Enterprise ni Jesselle Toborow',
    description: 'Discuss implementation timeline and pricing',
    relatedTo: 'TechCorp Solutions - Enterprise Software Deals',
    dueDate: 'Dec 12, 2024',
    assignedTo: 'Lester Claro',
    status: 'PENDING',
    completed: false,
  },
  {
    id: 2,
    priority: 'MEDIUM',
    activity: 'Q3 Budget Review',
    description: 'Review departmental spend and forecast for Q4',
    relatedTo: 'Finance Department',
    dueDate: 'Oct 30, 2024',
    assignedTo: 'Maria Sanchez',
    status: 'IN PROGRESS',
    completed: false,
  },
  {
    id: 3,
    priority: 'LOW',
    activity: 'Team Standup (Daily)',
    description: 'Daily synchronization meeting',
    relatedTo: 'Project Falcon',
    dueDate: 'Today',
    assignedTo: 'John Doe',
    status: 'DONE',
    completed: true,
  },
  {
    id: 4,
    priority: 'HIGH',
    activity: 'Client Onboarding Call',
    description: 'First call with new client: Alpha Solutions',
    relatedTo: 'Sales Leads',
    dueDate: 'Nov 5, 2024',
    assignedTo: 'Sarah Connor',
    status: 'PENDING',
    completed: false,
  },
];

// --- HELPER COMPONENTS ---
const StatusBadge = ({ type, children }) => {
  let colorClasses = '';
  switch (type.toUpperCase()) {
    case 'HIGH':
      colorClasses = 'bg-red-100 text-red-700';
      break;
    case 'PENDING':
      colorClasses = 'bg-blue-100 text-blue-700';
      break;
    case 'MEDIUM':
      colorClasses = 'bg-yellow-100 text-yellow-700';
      break;
    case 'IN PROGRESS':
      colorClasses = 'bg-indigo-100 text-indigo-700';
      break;
    case 'DONE':
      colorClasses = 'bg-green-100 text-green-700';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-700';
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${colorClasses}`}
    >
      {children}
    </span>
  );
};

const AdminMeeting = () => {
  const [meetings, setMeetings] = useState(DUMMY_MEETINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const handleSearch = (event) => setSearchTerm(event.target.value);

  const toggleCompletion = (id) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const filteredMeetings = meetings.filter((meeting) =>
    Object.values(meeting).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen font-sans">
      <main className="min-h-screen p-6 md:p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Meetings</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-gray-700 transition-colors"
          >
            <FiPlus size={18} />
            <span className="font-medium text-sm">New Meeting</span>
          </button>
        </div>

        {/* Top Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[{
            label: 'Total Meetings',
            icon: <LuUserSearch />,
            color: 'border-blue-500 text-blue-500',
            count: meetings.length,
          }, {
            label: 'Pending',
            icon: <FiEdit />,
            color: 'border-yellow-500 text-yellow-500',
            count: meetings.filter((m) => m.status === 'PENDING').length,
          }, {
            label: 'In Progress',
            icon: <FiBriefcase />,
            color: 'border-orange-500 text-orange-600',
            count: meetings.filter((m) => m.status === 'IN PROGRESS').length,
          }, {
            label: 'Done',
            icon: <FiCheckCircle />,
            color: 'border-green-500 text-green-500',
            count: meetings.filter((m) => m.status === 'DONE').length,
          }, {
            label: 'High Priority',
            icon: <FiTrendingUp />,
            color: 'border-purple-500 text-purple-500',
            count: meetings.filter((m) => m.priority === 'HIGH').length,
          }].map((card, i) => (
            <div
              key={i}
              className={`flex items-center justify-between bg-white border ${card.color} rounded-xl p-4 shadow-sm`}
            >
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">{card.count}</p>
              </div>
              <div className={`text-3xl opacity-80 ${card.color}`}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between mb-3 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3">
          <div className="relative w-full lg:w-1/3 mb-2 lg:mb-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search meetings..."
              className="border border-gray-200 bg-gray-50 rounded-md px-10 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <select className="border border-gray-200 bg-gray-50 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all">
              <option value="">Filter by Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <select className="border border-gray-200 bg-gray-50 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all">
              <option value="">Filter by Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Meetings Table */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-100 text-sm text-gray-600 sticky top-0 z-10 font-bold">
              <tr>
                {['Priority', 'Activity', 'Related To', 'Due Date', 'Assigned To', 'Status', ''].map((header, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className={`${idx === 6 ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeetings.map((meeting) => (
                <tr
                  key={meeting.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <StatusBadge type={meeting.priority}>
                      {meeting.priority}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-900 truncate max-w-[150px]">
                    <div className="font-semibold">{meeting.activity}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {meeting.description}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                    {meeting.relatedTo}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-500">
                    {meeting.dueDate}
                  </td>

                  <td className="px-4 py-4 text-sm font-medium text-gray-800">
                    {meeting.assignedTo}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <StatusBadge type={meeting.status}>
                      {meeting.status}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={meeting.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleCompletion(meeting.id);
                      }}
                      className="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-800 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMeetings.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No meetings found matching your search criteria.
            </div>
          )}
        </div>

        {/* Modal: Create Meeting */}
        {showModal && (
          <CreateMeetingModal onClose={() => setShowModal(false)} />
        )}

        {/* Modal: Selected Meeting Info */}
        {selectedMeeting && (
          <AdminMeetingInfomation
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
          />
        )}
      </main>
    </div>
  );
};

export default AdminMeeting;
