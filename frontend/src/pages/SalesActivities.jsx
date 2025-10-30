import React from "react";
import { FiEdit2, FiTrash2, FiPhone, FiMail, FiFilter } from "react-icons/fi";

export default function SalesActivities() {
  
  const activities = [
    {
      id: 1,
      type: "call",
      title: "Discovery call with Acme Corp",
      status: "COMPLETED",
      description: "Discussed requirements and pain points",
      outcome: "Positive - moving to proposal stage",
      duration: "30 min",
      date: "10/12/2025",
      account: "Acme Enterprise License",
    },
    {
      id: 2,
      type: "email",
      title: "Pricing information request",
      status: "COMPLETED",
      description: "Sent detailed pricing breakdown for enterprise package",
      date: "10/12/2025",
      contact: "Emma Wilson",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 min-h-[80vh] p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <span className="text-purple-600">📈</span> Sales Activities
        </h1>

        <div className="flex items-center gap-2 bg-white shadow-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
          <FiFilter className="text-gray-500" />
          <span className="text-sm text-gray-700">All Time ▾</span>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col gap-3 hover:shadow-md transition"
          >
            {/* Header Row */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {act.type === "call" ? (
                  <FiPhone className="text-green-600 text-xl" />
                ) : (
                  <FiMail className="text-green-600 text-xl" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {act.title}
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                      {act.status}
                    </span>
                  </h2>
                  <p className="text-gray-600 text-sm">{act.description}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 text-lg text-gray-500">
                <button className="hover:text-blue-600">
                  <FiEdit2 />
                </button>
                <button className="hover:text-red-600">
                  <FiTrash2 />
                </button>
              </div>
            </div>

            {/* Outcome (if exists) */}
            {act.outcome && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                ⭐ Outcome: {act.outcome}
              </div>
            )}

            {/* Footer Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {act.duration && (
                <p className="flex items-center gap-1">⏱ {act.duration}</p>
              )}
              <p className="flex items-center gap-1">📅 {act.date}</p>
              {act.account && (
                <p className="flex items-center gap-1">🏢 {act.account}</p>
              )}
              {act.contact && (
                <p className="flex items-center gap-1">👤 {act.contact}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
