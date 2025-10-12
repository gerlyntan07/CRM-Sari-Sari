import React from "react";
import { FiUsers, FiDollarSign, FiClock } from "react-icons/fi";

export default function SalesPipeline() {
  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Leads Section */}
        <div className="bg-green-50 border border-green-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center p-4 border-b border-green-100">
            <h2 className="text-green-700 font-semibold flex items-center gap-2">
              <FiUsers /> My Leads
            </h2>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
              2
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* Lead Card 1 */}
            <div className="bg-white border border-green-100 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">Emma Wilson</p>
                  <p className="text-sm text-gray-500">Startup Ventures</p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiClock /> 1/20/2024
                </p>
              </div>
              <div className="mt-3">
                <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-md">
                  QUALIFIED
                </span>
              </div>
            </div>

            {/* Lead Card 2 */}
            <div className="bg-white border border-green-100 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">Robert Davis</p>
                  <p className="text-sm text-gray-500">Manufacturing Plus</p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiClock /> 1/25/2024
                </p>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
                  NEW
                </span>
                <button className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700 transition">
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* My Deals Section */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center p-4 border-b border-yellow-100">
            <h2 className="text-yellow-700 font-semibold flex items-center gap-2">
              <FiDollarSign /> My Deals
            </h2>
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
              2
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* Deal Card 1 */}
            <div className="bg-white border border-yellow-100 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">
                    Acme Enterprise License
                  </p>
                  <p className="text-sm text-gray-500">$150,000</p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiClock /> 3/15/2024
                </p>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-md">
                  NEGOTIATION
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="w-[75%] h-2 bg-gray-900 rounded-full"></div>
                  </div>
                  <span className="text-xs text-gray-700">75%</span>
                </div>
              </div>
            </div>

            {/* Deal Card 2 */}
            <div className="bg-white border border-yellow-100 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">
                    TechStart Cloud Migration
                  </p>
                  <p className="text-sm text-gray-500">$75,000</p>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiClock /> 2/28/2024
                </p>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
                  PROPOSAL
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="w-[60%] h-2 bg-gray-900 rounded-full"></div>
                  </div>
                  <span className="text-xs text-gray-700">60%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}
