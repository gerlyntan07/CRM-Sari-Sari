import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiUserX, FiActivity, FiEye, FiToggleLeft, FiToggleRight, FiAlertCircle, FiClock, FiTrendingUp, FiSearch, FiX, FiRefreshCw } from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import api from '../api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [subscriptionAlerts, setSubscriptionAlerts] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired, expiring

  useEffect(() => {
    fetchStats();
    fetchTenants();
    fetchSubscriptionAlerts();
    fetchActivityStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tenants');
      console.log('Tenants API Response:', response.data);
      console.log('Number of tenants:', response.data.tenants?.length);
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load tenants: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionAlerts = async () => {
    try {
      const response = await api.get('/admin/subscriptions/alerts');
      setSubscriptionAlerts(response.data);
    } catch (error) {
      console.error('Error fetching subscription alerts:', error);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const response = await api.get('/admin/activity');
      setActivityStats(response.data);
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    }
  };

  const viewTenantDetails = async (tenantId) => {
    try {
      const response = await api.get(`/admin/tenants/${tenantId}`);
      setSelectedTenant(response.data);
      setShowTenantModal(true);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      toast.error('Failed to load tenant details');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/toggle-status`);
      toast.success(response.data.message);
      // Refresh the tenant details
      if (selectedTenant) {
        viewTenantDetails(selectedTenant.id);
      }
      fetchTenants();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user status');
    }
  };

  const toggleSubscriptionStatus = async (subscriptionId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Cancelled' : 'Active';
    
    if (!window.confirm(`Are you sure you want to ${newStatus === 'Cancelled' ? 'suspend' : 'activate'} this subscription?`)) {
      return;
    }

    try {
      const response = await api.patch(`/admin/subscriptions/${subscriptionId}/status`, {
        status: newStatus
      });
      toast.success(response.data.message);
      fetchTenants();
      fetchSubscriptionAlerts();
      if (selectedTenant) {
        viewTenantDetails(selectedTenant.id);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error(error.response?.data?.detail || 'Failed to update subscription');
    }
  };

  const suspendCompany = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to suspend ${companyName}? All users from this company will be unable to login.`)) {
      return;
    }

    try {
      const response = await api.post(`/admin/companies/${companyId}/suspend`);
      toast.success(response.data.message);
      fetchTenants();
    } catch (error) {
      console.error('Error suspending company:', error);
      toast.error(error.response?.data?.detail || 'Failed to suspend company');
    }
  };

  const reactivateCompany = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to reactivate ${companyName}? Users will be able to login again.`)) {
      return;
    }

    try {
      const response = await api.post(`/admin/companies/${companyId}/reactivate`);
      toast.success(response.data.message);
      fetchTenants();
    } catch (error) {
      console.error('Error reactivating company:', error);
      toast.error(error.response?.data?.detail || 'Failed to reactivate company');
    }
  };

  const refreshAll = () => {
    fetchStats();
    fetchTenants();
    fetchSubscriptionAlerts();
    fetchActivityStats();
    toast.success('Dashboard refreshed');
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.company_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'suspended') return matchesSearch && !tenant.is_subscription_active;
    
    if (!tenant.subscription) return filterStatus === 'expired' ? matchesSearch : false;
    
    const endDate = new Date(tenant.subscription.end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (filterStatus === 'active') {
      return matchesSearch && tenant.subscription.status === 'Active' && daysUntilExpiry > 7 && tenant.is_subscription_active;
    } else if (filterStatus === 'expiring') {
      return matchesSearch && tenant.subscription.status === 'Active' && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && tenant.is_subscription_active;
    } else if (filterStatus === 'expired') {
      return matchesSearch && (tenant.subscription.status === 'Expired' || daysUntilExpiry <= 0);
    }
    
    return matchesSearch;
  });

  if (loading && !stats) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all tenants and monitor system-wide statistics</p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<HiOutlineOfficeBuilding className="w-8 h-8" />}
            title="Total Tenants"
            value={stats.total_tenants}
            bgColor="bg-blue-500"
          />
          <StatCard
            icon={<FiUsers className="w-8 h-8" />}
            title="Total Users"
            value={stats.total_users}
            bgColor="bg-purple-500"
          />
          <StatCard
            icon={<FiUserCheck className="w-8 h-8" />}
            title="Active Users"
            value={stats.active_users}
            bgColor="bg-green-500"
          />
          <StatCard
            icon={<FiUserX className="w-8 h-8" />}
            title="Inactive Users"
            value={stats.inactive_users}
            bgColor="bg-red-500"
          />
        </div>
      )}

      {/* Subscription Alerts */}
      {subscriptionAlerts && subscriptionAlerts.total_alerts > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertCircle className="text-orange-500 w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Subscription Alerts</h2>
            <span className="ml-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
              {subscriptionAlerts.total_alerts} alerts
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiring Soon */}
            {subscriptionAlerts.expiring_soon.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <FiClock /> Expiring Soon ({subscriptionAlerts.expiring_soon.length})
                </h3>
                <div className="space-y-2">
                  {subscriptionAlerts.expiring_soon.map((sub) => (
                    <div key={sub.id} className="text-sm">
                      <p className="font-medium text-gray-800">{sub.company_name}</p>
                      <p className="text-gray-600">{sub.plan_name} - {sub.days_remaining} days left</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expired */}
            {subscriptionAlerts.expired.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <FiAlertCircle /> Expired ({subscriptionAlerts.expired.length})
                </h3>
                <div className="space-y-2">
                  {subscriptionAlerts.expired.map((sub) => (
                    <div key={sub.id} className="text-sm">
                      <p className="font-medium text-gray-800">{sub.company_name}</p>
                      <p className="text-gray-600">{sub.plan_name} - Expired</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Search and Tenants List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">All Tenants ({filteredTenants.length})</h2>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('expiring')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'expiring'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Expiring
              </button>
              <button
                onClick={() => setFilterStatus('expired')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'expired'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Expired
              </button>
              <button
                onClick={() => setFilterStatus('suspended')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'suspended'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Suspended
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {tenant.company_logo ? (
                        <img
                          src={tenant.company_logo}
                          alt={tenant.company_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {tenant.company_name.charAt(0)}
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tenant.company_name}</div>
                        <div className="text-sm text-gray-500">{tenant.company_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tenant.company_website || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{tenant.address || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="text-green-600">{tenant.active_users}</span> / {tenant.total_users}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tenant.subscription ? (
                      <div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tenant.subscription.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tenant.subscription.plan_name}
                        </span>
                        <div className="mt-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tenant.is_subscription_active 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tenant.is_subscription_active ? 'Active Access' : 'Suspended'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No plan</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewTenantDetails(tenant.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <FiEye /> View
                      </button>
                      {tenant.is_subscription_active ? (
                        <button
                          onClick={() => suspendCompany(tenant.id, tenant.company_name)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-2"
                        >
                          <FiToggleLeft /> Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivateCompany(tenant.id, tenant.company_name)}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1 ml-2"
                        >
                          <FiToggleRight /> Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Details Modal */}
      {showTenantModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedTenant.company_name} Details
              </h3>
              <button
                onClick={() => setShowTenantModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Company Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Company Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Company Number</p>
                    <p className="font-medium">{selectedTenant.company_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium">{selectedTenant.company_website || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedTenant.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Currency</p>
                    <p className="font-medium">{selectedTenant.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tax Rate</p>
                    <p className="font-medium">{selectedTenant.tax_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Territories</p>
                    <p className="font-medium">{selectedTenant.territories_count}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              {selectedTenant.subscription && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold">Subscription</h4>
                    <button
                      onClick={() => {
                        const sub = selectedTenant.subscription;
                        // Find subscription ID - need to get it from the company
                        const subscriptionId = selectedTenant.id; // This should be the subscription ID, adjust if needed
                        toggleSubscriptionStatus(subscriptionId, sub.status);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        selectedTenant.subscription.status === 'Active'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {selectedTenant.subscription.status === 'Active' ? '🚫 Suspend Subscription' : '✅ Activate Subscription'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium">{selectedTenant.subscription.plan_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedTenant.subscription.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedTenant.subscription.status === 'Cancelled'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedTenant.subscription.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">
                        {selectedTenant.subscription.start_date 
                          ? new Date(selectedTenant.subscription.start_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">
                        {selectedTenant.subscription.end_date 
                          ? new Date(selectedTenant.subscription.end_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Days Remaining</p>
                      <p className={`font-medium ${
                        (() => {
                          const days = Math.ceil((new Date(selectedTenant.subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                          return days <= 0 ? 'text-red-600' : days <= 7 ? 'text-orange-600' : 'text-green-600';
                        })()
                      }`}>
                        {(() => {
                          const days = Math.ceil((new Date(selectedTenant.subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                          return days <= 0 ? 'Expired' : `${days} days`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Users List */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Users ({selectedTenant.users.length})</h4>
                <div className="space-y-2">
                  {selectedTenant.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {user.role}
                          </span>
                          {user.last_login && (
                            <span className="text-xs text-gray-500">
                              Last login: {new Date(user.last_login).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                          user.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, bgColor }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${bgColor} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Activity Card Component
const ActivityCard = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
