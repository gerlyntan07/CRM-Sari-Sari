import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiUsers, FiTarget, FiPhoneCall} from "react-icons/fi";
import { FaRegChartBar } from "react-icons/fa";

export default function ManagerOverview() {
  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex items-center mb-8">
        <FiUser className="text-2xl text-gray-700 mr-2" />
        <h1 className="text-2xl font-semibold text-gray-800">Manager Dashboard</h1>
      </div>

      {/* User Info Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-500">Full Name</p>
          <p className="font-medium text-gray-900">Jane Sales</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Phone Number</p>
          <p className="font-medium text-gray-900">+1-555-0003</p>
        </div>  
        <div>
          <p className="text-sm text-gray-500">Last Login</p>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-600" />
            <p className="font-medium text-gray-900">10/11/2025</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Username</p>
          <p className="font-medium text-gray-900">Smith</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Role & Permissions</p>
          <div className="flex items-center gap-2">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
              SALES
            </span>
            <p className="text-gray-600 text-sm">Customer relationship and sales activity management</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Date Joined</p>
          <p className="font-medium text-gray-900">2/1/2024</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium text-gray-900">sales@company.com</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Territory</p>
          <div className="flex items-center gap-2">
            <FiMapPin className="text-gray-600" />
            <p className="font-medium text-gray-900">South Region</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
            Active
          </span>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
          <FiUsers className="text-blue-600 text-3xl mb-2" />
          <p className="text-sm text-gray-500">Team Members</p>
          <p className="text-2xl font-bold text-gray-800">10</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
          <FiTarget className="text-green-600 text-3xl mb-2" />
          <p className="text-sm text-gray-500">Team Leads</p>
          <p className="text-2xl font-bold text-gray-800">18</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
          <FiPhoneCall className="text-orange-500 text-3xl mb-2" />
          <p className="text-sm text-gray-500">Team Calls Today</p>
          <p className="text-2xl font-bold text-gray-800">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
          <FaRegChartBar className="text-purple-600 text-3xl mb-2" />
          <p className="text-sm text-gray-500">Revenue  This Month</p>
          <p className="text-2xl font-bold text-gray-800">73%</p>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
            <div>
              <p className="text-gray-800 font-medium">
                Deal moved to negotiation: TechStart Inc.
              </p>
              <p className="text-sm text-gray-500">1 hour ago</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
            <div>
              <p className="text-gray-800 font-medium">
                Follow-up call scheduled with Global Solutions
              </p>
              <p className="text-sm text-gray-500">3 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
