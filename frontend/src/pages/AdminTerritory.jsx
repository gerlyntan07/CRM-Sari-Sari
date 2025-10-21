import React, { useState } from "react";
import { FiUser, FiPlus, FiX, FiCalendar, FiSearch } from "react-icons/fi";

const territorysData = [
  {
    id: 1,
    title: "North Luzon - Enterprise",
    user: "Jesselle Ramos",
    date: "December 17, 2020",
    status: "Active",
    description:
      "This high-growth territory, spanning the Mid-Atlantic states, is primarily focused on capturing new enterprise clients in the logistics and manufacturing sectors.",
  },
  {
    id: 2,
    title: "Cavite State Empire",
    user: "Gerlyn Tan",
    date: "February 17, 2024",
    status: "Inactive",
    description:
      "This region manages existing partnerships and focuses on maintaining client relationships in the Cavite and South Luzon area.",
  },
  {
    id: 3,
    title: "North Luzon - Enterprise",
    user: "Jesselle Ramos",
    date: "December 12, 2020",
    status: "Active",
    description:
      "Focused on enterprise expansion in the northern Luzon region with strong client acquisition and retention goals.",
  },
];

export default function AdminTerritory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [userFilter, setUserFilter] = useState("All User");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredMeetings = territorysData.filter((meeting) => {
    return (
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === "All Status" || meeting.status === statusFilter) &&
      (userFilter === "All User" || meeting.user === userFilter)
    );
  });

  return (
    <div className="p-6 min-h-screen">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7 gap-3 sm:gap-0">
        {/* Title */}
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          <FiUser className="mr-2 text-blue-600" /> Territory
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer w-full sm:w-auto gap-2"
          >
            <FiPlus /> Create Territory
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-8">
        {/* Search Box */}
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="ml-2 bg-transparent w-full outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm cursor-pointer w-full sm:w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        {/* User Filter */}
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm cursor-pointer w-full sm:w-auto"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option>All User</option>
          <option>Jesselle Ramos</option>
          <option>Gerlyn Tan</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 rounded-md">
        {filteredMeetings.map((meeting) => (
          <div
            key={meeting.id}
            onClick={() => setSelectedMeeting(meeting)}
            className="bg-white p-4 shadow border border-gray-200 flex flex-col justify-between relative cursor-pointer hover:shadow-md transition"
          >
            {/* Top horizontal line */}
            <div className="absolute top-0 left-0 w-full h-5 bg-secondary rounded-t-md" />

            <h3 className="font-medium text-gray-900 mb-2 py-7">{meeting.title}</h3>

            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <FiUser /> {meeting.user}
            </div>

            <div className="h-px bg-gray-200 w-full" />

            <div className="flex items-center justify-between text-sm p-1">
              <div className="text-gray-400">{meeting.date}</div>
              <div className="flex items-center gap-2 font-medium">
                <span
                  className={`h-2 w-2 rounded-full ${
                    meeting.status === "Active" ? "bg-green-500" : "bg-yellow-500"
                  }`}
                ></span>
                {meeting.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Popup Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-8 relative">
            {/* Top horizontal line */}
            <div className="absolute top-0 left-0 w-full h-10 bg-secondary rounded-t-md flex justify-end items-center px-4">
              <button
                className="text-white hover:text-gray-200 transition"
                onClick={() => setSelectedMeeting(null)}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 py-6">
              <h2 className="text-3xl font-semibold text-gray-900 mt-6">
                {selectedMeeting.title}
              </h2>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mt-6">
                {selectedMeeting.status}
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    selectedMeeting.status === "Active"
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                ></span>
              </div>
            </div>
            <div className="h-px bg-gray-200 w-full" />

            {/* Assigned user & date */}
            <div className="grid grid-cols-2 gap-6 mb-6 text-sm py-5">
              <div>
                <p className="text-gray-500">Assigned To</p>
                <div className="flex items-center gap-2 text-gray-800 font-medium mt-1">
                  <FiUser /> {selectedMeeting.user}
                </div>
              </div>
              <div>
                <p className="text-gray-500">Created Date</p>
                <div className="flex items-center gap-2 text-gray-800 font-medium mt-1">
                  <FiCalendar /> {selectedMeeting.date}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-gray-500 mb-1">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {selectedMeeting.description}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-1.5 text-sm border rounded-md hover:bg-gray-100 transition">
                Edit
              </button>
              <button className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Territory Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCreateModal(false)}
            >
              <FiX size={22} />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Create a Territory
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Add a new sales territory to your organization
            </p>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Territory Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. North Luzon Enterprise"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option>Assign User</option>
                  <option>Jesselle Ramos</option>
                  <option>Gerlyn Tan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Add Territory Description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2 col-span-1 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                 className="px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition-100 w-full sm:w-auto"
                 >
                  Cancel
                </button>
                <button
                  type="submit"
                   className="px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition-100 w-full sm:w-auto"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
