import React from "react";
import { FiUser, FiMapPin, FiCalendar } from "react-icons/fi";

export default function SalesOverview() {
  return (
    <div className="p-8 text-gray-800">
      {/* Header */}
      <div className="flex items-center mb-8">
        <FiUser className="text-2xl mr-2 text-gray-700" />
        <h1 className="text-2xl font-semibold">SALES Dashboard</h1>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
        {/* Full Name */}
        <div>
          <p className="text-sm text-gray-500">Full Name</p>
          <p className="text-lg font-medium">Jane Sales</p>
        </div>

        {/* Phone Number */}
        <div>
          <p className="text-sm text-gray-500">Phone Number</p>
          <p className="text-lg font-medium text-blue-900">+1-555-0003</p>
        </div>

        {/* Last Login */}
        <div className="flex flex-col">
          <p className="text-sm text-gray-500">Last Login</p>
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-gray-500" />
            <p className="text-lg font-medium">10/11/2025</p>
          </div>
        </div>

        {/* Username */}
        <div>
          <p className="text-sm text-gray-500">Username</p>
          <p className="text-lg font-medium">sales1</p>
        </div>

        {/* Role & Permissions */}
        <div>
          <p className="text-sm text-gray-500">Role & Permissions</p>
          <div className="flex items-center space-x-2">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
              SALES
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Customer relationship and sales activity management
          </p>
        </div>

        {/* Date Joined */}
        <div>
          <p className="text-sm text-gray-500">Date Joined</p>
          <p className="text-lg font-medium">2/1/2024</p>
        </div>

        {/* Email */}
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="text-lg font-medium">sales@company.com</p>
        </div>

        {/* Territory */}
        <div>
          <p className="text-sm text-gray-500">Territory</p>
          <div className="flex items-center space-x-2">
            <FiMapPin className="text-gray-500" />
            <p className="text-lg font-medium">South Region</p>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span className="bg-black text-white text-xs font-semibold px-2 py-1 rounded-full">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
