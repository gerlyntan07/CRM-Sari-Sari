import React from "react";
import { FiUsers, FiCheckCircle, FiClock, FiCalendar, FiTrendingUp, FiDollarSign } from "react-icons/fi";

export default function SalesPerformance() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sales Performance Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <FiTrendingUp /> Sales Performance
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-gray-700">
            <div className="flex items-center gap-2">
              <FiUsers className="text-gray-400" /> Total Leads
            </div>
            <span className="font-semibold">2</span>
          </div>
          <div className="flex justify-between items-center text-green-600">
            <div className="flex items-center gap-2">
              <FiCheckCircle /> Qualified Leads
            </div>
            <span className="font-semibold">1</span>
          </div>
          <div className="flex justify-between items-center text-blue-600">
            <div className="flex items-center gap-2">
              <FiTrendingUp /> Active Deals
            </div>
            <span className="font-semibold">2</span>
          </div>
          <div className="flex justify-between items-center text-yellow-600">
            <div className="flex items-center gap-2">
              <FiDollarSign /> Won Deals
            </div>
            <span className="font-semibold">0</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-xl flex justify-between items-center font-semibold text-green-700">
          <span>Total Revenue</span>
          <span>$0</span>
        </div>
      </div>

      {/* Task Completion Card */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <FiCheckCircle /> Task Completion
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-green-600">
            <span>Completed Tasks</span>
            <span className="font-semibold">0</span>
          </div>
          <div className="flex justify-between items-center text-orange-600">
            <span>Pending Tasks</span>
            <span className="font-semibold">1</span>
          </div>
          <div className="flex justify-between items-center text-blue-600">
            <span>Tasks Today</span>
            <span className="font-semibold">0</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between mb-1 text-sm font-medium text-orange-600">
            <span>Completion Rate</span>
            <span>0%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full">
            <div className="w-0 h-3 bg-orange-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
