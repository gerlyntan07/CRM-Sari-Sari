import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiPhoneCall,
  FiActivity,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import useFetchUser from "../hooks/useFetchUser.js";
import api from "../api.js"; // ✅ Axios instance

export default function SalesOverview() {
    useEffect(() => {
    document.title = "SalesOverview | Sari-Sari CRM";
  }, []);
  const { user, loading } = useFetchUser();

  // ✅ Local state for sales data (can be fetched from backend)
  const [stats, setStats] = useState({
    contacts: 0,
    leads: 0,
    calls_today: 0,
    target_progress: 0,
  });

  // ✅ Local state for user's territories
  const [territories, setTerritories] = useState([]);

  // ✅ Fetch sales summary metrics for logged-in user
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const res = await api.get("/sales/overview"); // Example endpoint
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching sales overview:", err);
      }
    };
    fetchSalesData();
  }, []);

  // ✅ Fetch user's territories
  useEffect(() => {
    const fetchTerritories = async () => {
      if (!user) return;
      try {
        const res = await api.get("/territories/myterritory");
        setTerritories(res.data);
      } catch (err) {
        console.error("Error fetching territories:", err);
      }
    };
    fetchTerritories();
  }, [user]);

  if (loading) {
    return <p className="text-gray-500">Loading user data...</p>;
  }

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex items-center mb-8">
        <FiUser className="text-2xl text-gray-700 mr-2" />
        <h1 className="text-2xl font-semibold text-gray-800">SALES Dashboard</h1>
      </div>

      {/* User Info Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-500">Full Name</p>
          <p className="font-medium text-gray-900">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Login</p>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-600" />
            <p className="font-medium text-gray-900">
              {user?.last_login
                ? new Date(user.last_login).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Date Joined</p>
          <p className="font-medium text-gray-900">
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium text-gray-900">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Territories</p>
          <div className="flex flex-col gap-2">
            {territories.length > 0 ? (
              territories.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <FiMapPin className="text-gray-600" />
                  <p className="font-medium text-gray-900">{t.name}</p>
                </div>
              ))
            ) : (
              <p className="font-medium text-gray-900">No territories assigned</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
            {user?.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
          <FiUsers className="text-blue-600 text-3xl mb-2" />
          <p className="text-sm text-gray-500">My Contacts</p>
          <p className="text-2xl font-bold text-gray-800">{stats.contacts ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
          <FiTarget className="text-green-600 text-3xl mb-2" />
          <p className="text-sm text-gray-500">My Leads</p>
          <p className="text-2xl font-bold text-gray-800">{stats.leads ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
          <FiPhoneCall className="text-orange-500 text-3xl mb-2" />
          <p className="text-sm text-gray-500">My Calls Today</p>
          <p className="text-2xl font-bold text-gray-800">{stats.calls_today ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
          <FiActivity className="text-purple-600 text-3xl mb-2" />
          <p className="text-sm text-gray-500">My Target Progress</p>
          <p className="text-2xl font-bold text-gray-800">{stats.target_progress ?? 0}%</p>
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
