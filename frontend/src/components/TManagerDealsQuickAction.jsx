import React from "react";
import { FiPhone, FiMail, FiCalendar, FiFileText } from "react-icons/fi";

export default function TManagerDealsQuickAction() {
  return (
    <div className="space-y-4 font-inter text-[13px] w-full sm:w-[85%] mx-auto">
      {/* Quick Actions */}
      <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">
          Quick Actions
        </h4>
        <div className="flex flex-col gap-1.5">
          {[
            { icon: FiPhone, text: "Schedule Call" },
            { icon: FiMail, text: "Send E-mail" },
            { icon: FiCalendar, text: "Book Meeting" },
            { icon: FiFileText, text: "Create Quote" },
          ].map(({ icon: Icon, text }) => (
            <button
              key={text}
              className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm w-full"
            >
              <Icon className="text-gray-600 w-4 h-4 flex-shrink-0" /> {text}
            </button>
          ))}
        </div>
      </div>

      {/* Promote Deal */}
      <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">
          Promote Deal
        </h4>
        <select className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-gray-300">
          <option>Negotiation Stage</option>
          <option>Proposal Stage</option>
          <option>Closed Won</option>
          <option>Closed Lost</option>
        </select>
        <button className="w-full bg-gray-900 text-white py-1.5 rounded-md text-sm hover:bg-gray-800 transition">
          Update
        </button>
      </div>
    </div>
  );
}
