import React, { useState, useEffect } from "react";
import { FiSearch, FiEdit, FiTrash2 } from "react-icons/fi";

export default function TManagerMeetings() {
  useEffect(() => {
    document.title = "Meetings | Sari-Sari CRM";
  }, []);

  // Static meetings data
  const meetings = [
    {
      id: 1,
      priority: "HIGH",
      activity: "Enterprise ni Jesselle Tuberow",
      relatedTo: "TechCorp Solutions - Enterprise Software",
      dueDate: "Dec 12, 2004",
      assignedTo: "Lester Ciano",
      status: "PENDING",
    },
  ];


  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.activity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || m.status === statusFilter;
    const matchesUser = userFilter === "" || m.assignedTo === userFilter;
    const matchesPriority = priorityFilter === "" || m.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesUser && matchesPriority;
  });

  const openNewMeeting = () => {
    alert("Open New Meeting Modal");
  };

  return (
    <div className="p-8 bg-[#fffeee] min-h-screen font-inter">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Meetings</h2>
        <button
          onClick={openNewMeeting}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          + New Meeting
        </button>
      </div>

      {/* Top Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold">
          All Meetings
        </div>
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold">
        </div>
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold"></div>
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold"></div>
        <div className="bg-white shadow-sm rounded-lg p-4 text-center font-semibold"></div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full sm:w-1/3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            className="border border-gray-300 rounded-md px-10 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">All User</option>
          <option value="Lester Ciano">Lester Ciano</option>
          <option value="John Doe">John Doe</option>
        </select>

        <select
          className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Meetings Table */}
<div className="overflow-x-auto w-full shadow-sm bg-white rounded-lg">
  <table className="min-w-full table-auto text-xs"> {/* smaller font here */}
    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 text-xs"> {/* smaller font */}
      <tr>
        <th className="py-3 px-4 text-left font-medium">Priority</th>
        <th className="py-3 px-4 text-left font-medium">Activity</th>
        <th className="py-3 px-4 text-left font-medium">Related To</th>
        <th className="py-3 px-4 text-left font-medium">Due Date</th>
        <th className="py-3 px-4 text-left font-medium">Assigned To</th>
        <th className="py-3 px-4 text-left font-medium">Status</th>
        <th className="py-3 px-4 text-center font-medium">Actions</th>
      </tr>
    </thead>
    <tbody className="text-xs lg:text-[12px]"> {/* smaller font */}
      {filteredMeetings.length > 0 ? (
        filteredMeetings.map((meeting) => (
          <tr key={meeting.id} className="lg:mt-4 hover:bg-gray-50">
            <td className="py-2 px-4">
              <span
                className={`px-2 py-1 rounded-full text-[9px] font-semibold ${
                  meeting.priority === "HIGH"
                    ? "bg-red-100 text-red-600"
                    : meeting.priority === "MEDIUM"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {meeting.priority}
              </span>
            </td>
            <td className="py-2 px-4">{meeting.activity}</td>
            <td className="py-2 px-4">{meeting.relatedTo}</td>
            <td className="py-2 px-4">{meeting.dueDate}</td>
            <td className="py-2 px-4">{meeting.assignedTo}</td>
            <td className="py-2 px-4">
              <span
                className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                  meeting.status === "PENDING"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {meeting.status}
              </span>
            </td>
            <td className="py-2 px-4 text-center flex justify-center gap-2">
              <button className="text-blue-500 hover:text-blue-700">
                <FiEdit />
              </button>
              <button className="text-red-500 hover:text-red-700">
                <FiTrash2 />
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="7" className="text-center py-6 text-gray-400">
            No meetings found
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
    </div>
  );
}
