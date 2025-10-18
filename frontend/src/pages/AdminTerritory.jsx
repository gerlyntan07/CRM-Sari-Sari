import React, { useState } from "react";
import { FiUser, FiPlus } from "react-icons/fi";

const meetingsData = [
  {
    id: 1,
    title: "North Luzon - Enterprise",
    user: "Jesselle Ramos",
    date: "12/12/2020",
    status: "Active",
  },
  {
    id: 2,
    title: "Cavite State Empire",
    user: "Gerlyn Tan",
    date: "02/17/2024",
    status: "Inactive",
  },
  {
    id: 3,
    title: "North Luzon - Enterprise",
    user: "Jesselle Ramos",
    date: "12/12/2020",
    status: "Active",
  },
  {
    id: 4,
    title: "North Luzon - Enterprise",
    user: "Jesselle Ramos",
    date: "12/12/2020",
    status: "Active",
  },
];

export default function ManagerMeetings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [userFilter, setUserFilter] = useState("All User");

  const filteredMeetings = meetingsData.filter((meeting) => {
    return (
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === "All Status" || meeting.status === statusFilter) &&
      (userFilter === "All User" || meeting.user === userFilter)
    );
  });

  return (
    <div className="p-6 min-h-screen">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search"
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option>All User</option>
            <option>Jesselle Ramos</option>
            <option>Gerlyn Tan</option>
          </select>
        </div>
        <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
          <FiPlus /> New Meeting
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {filteredMeetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col justify-between"
          >
            <h3 className="font-medium text-gray-900 mb-2">{meeting.title}</h3>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <FiUser /> {meeting.user}
            </div>
            <div className="text-gray-400 text-sm mb-2">{meeting.date}</div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  meeting.status === "Active" ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></span>
              {meeting.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
