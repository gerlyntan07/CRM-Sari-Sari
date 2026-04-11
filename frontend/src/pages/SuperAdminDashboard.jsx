import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiUserX, FiActivity, FiEye, FiToggleLeft, FiToggleRight, FiAlertCircle, FiClock, FiTrendingUp, FiSearch, FiX, FiRefreshCw, FiEdit, FiTrash2, FiSlash, FiCheckCircle, FiPlus, FiKey, FiBell } from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import api from '../api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import AddTenantForm from '../components/super-admin/TenantForm';
import SubscriptionForm from '../components/super-admin/SubscriptionForm';
import UserDetailsModal from '../components/super-admin/UserDetailsModal';
import AddUserForm from '../components/super-admin/UserForm';
import ActivityLogsModal from '../components/super-admin/ActivityLogsModal';
import PaginationControls from '../components/PaginationControls';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editTenant, setEditTenant] = useState(null); // NEW: for edit modal
  const [subscriptionAlerts, setSubscriptionAlerts] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired, expiring
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  // For suspend/reactivate modal
  const [actionModal, setActionModal] = useState({ open: false, companyId: null, companyName: '', action: null });
  const [refreshing, setRefreshing] = useState(false);
  // For subscription confirmation modal
  const [subscriptionModal, setSubscriptionModal] = useState({ open: false, tenantId: null, isActive: true, loading: false });
  // For edit subscription modal
  const [showEditSubscription, setShowEditSubscription] = useState(false);
  // For delete tenant modal
  const [deleteTenantModal, setDeleteTenantModal] = useState({ open: false, tenant: null, loading: false });
  // For delete all users modal
  const [deleteAllUsersModal, setDeleteAllUsersModal] = useState({ open: false, tenantId: null, tenantName: '', loading: false });
  // For per-tenant notify composer
  const [notifyModal, setNotifyModal] = useState({
    open: false,
    tenantId: null,
    tenantName: '',
    recipients: '',
    subject: '',
    message: '',
  });
  // For pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // For controlled input, allow string or number
  const [pageSizeInput, setPageSizeInput] = useState('10');
  // For search users in modal
  const [searchUserTerm, setSearchUserTerm] = useState('');
  // For user details modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  // For add user form
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [resetPasswordUserData, setResetPasswordUserData] = useState(null);
  // For toggle user status modal
  const [toggleUserStatusModal, setToggleUserStatusModal] = useState({ open: false, user: null, newStatus: null, loading: false });
  // For delete single user modal
  const [deleteUserModal, setDeleteUserModal] = useState({ open: false, user: null, loading: false });
  // For activity logs modal
  const [showActivityLogsModal, setShowActivityLogsModal] = useState(false);
  const [activityLogsUser, setActivityLogsUser] = useState(null);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchTenants(),
        fetchSubscriptionAlerts(),
        fetchActivityStats(),
      ]);
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const viewTenantDetails = (tenantId) => {
    navigate(`/super-admin/tenant/${tenantId}`);
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


  // Open suspend/reactivate modal
  const openActionModal = (companyId, companyName, action) => {
    setActionModal({ open: true, companyId, companyName, action });
  };


  // Confirm action (suspend/reactivate)
  const handleConfirmAction = async () => {
    const { companyId, companyName, action } = actionModal;
    try {
      let response;
      if (action === 'suspend') {
        response = await api.post(`/admin/companies/${companyId}/suspend`);
        toast.success(response.data.message);
      } else if (action === 'reactivate') {
        response = await api.post(`/admin/companies/${companyId}/reactivate`);
        toast.success(response.data.message);
      }
      fetchTenants();
    } catch (error) {
      if (action === 'suspend') {
        console.error('Error suspending company:', error);
        toast.error(error.response?.data?.detail || 'Failed to suspend company');
      } else if (action === 'reactivate') {
        console.error('Error reactivating company:', error);
        toast.error(error.response?.data?.detail || 'Failed to reactivate company');
      }
    } finally {
      setActionModal({ open: false, companyId: null, companyName: '', action: null });
    }
  };

  // Cancel action
  const handleCancelAction = () => {
    setActionModal({ open: false, companyId: null, companyName: '', action: null });
  };

  // Open reactivate modal (handler)
  const reactivateCompany = (companyId, companyName) => {
    openActionModal(companyId, companyName, 'reactivate');
  };

  // Handle delete all users for a tenant
  const handleDeleteAllUsers = () => {
    if (!selectedTenant) return;
    
    setDeleteAllUsersModal({
      open: true,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.company_name,
      loading: false
    });
  };

  // Confirm delete all users
  const handleConfirmDeleteAllUsers = async () => {
    const { tenantId, tenantName } = deleteAllUsersModal;
    
    setDeleteAllUsersModal(prev => ({ ...prev, loading: true }));
    
    try {
      await api.delete(`/users/admin/tenants/${tenantId}/users/delete-all`);
      
      toast.success(`All users of ${tenantName} deleted successfully`);
      
      // Refresh both tenants list and tenant details
      await fetchTenants(); // Update user count in tenants table
      if (selectedTenant?.id) {
        await viewTenantDetails(selectedTenant.id); // Update users section in modal
      }
    } catch (error) {
      console.error('Error deleting all users:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete all users');
    } finally {
      setDeleteAllUsersModal({ open: false, tenantId: null, tenantName: '', loading: false });
    }
  };

  // Cancel delete all users
  const handleCancelDeleteAllUsers = () => {
    setDeleteAllUsersModal({ open: false, tenantId: null, tenantName: '', loading: false });
  };

  // Handle toggle user status (deactivate/reactivate)
  const handleToggleUserStatus = (user) => {
    const newStatus = !user.is_active;
    setToggleUserStatusModal({
      open: true,
      user,
      newStatus,
      loading: false
    });
  };

  // Confirm toggle user status
  const handleConfirmToggleUserStatus = async () => {
    const { user, newStatus } = toggleUserStatusModal;
    
    setToggleUserStatusModal(prev => ({ ...prev, loading: true }));
    
    try {
      await api.put(`/users/updateuser/${user.id}`, { is_active: newStatus });
      
      toast.success(`User ${newStatus ? 'reactivated' : 'deactivated'} successfully`);
      
      // Refresh both tenants list and tenant details
      await fetchTenants(); // Update user count in tenants table
      if (selectedTenant?.id) {
        await viewTenantDetails(selectedTenant.id); // Update users section in modal
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.detail || `Failed to ${newStatus ? 'reactivate' : 'deactivate'} user`);
    } finally {
      setToggleUserStatusModal({ open: false, user: null, newStatus: null, loading: false });
    }
  };

  // Cancel toggle user status
  const handleCancelToggleUserStatus = () => {
    setToggleUserStatusModal({ open: false, user: null, newStatus: null, loading: false });
  };

  // Handle delete single user
  const handleDeleteUser = (user) => {
    setDeleteUserModal({
      open: true,
      user,
      loading: false
    });
  };

  // Confirm delete single user
  const handleConfirmDeleteUser = async () => {
    const { user } = deleteUserModal;
    
    setDeleteUserModal(prev => ({ ...prev, loading: true }));
    
    try {
      await api.delete(`/users/harddeleteuser/${user.id}`);
      
      toast.success(`User ${user.first_name} ${user.last_name} deleted successfully`);
      
      // Refresh both tenants list and tenant details
      await fetchTenants(); // Update user count in tenants table
      if (selectedTenant?.id) {
        await viewTenantDetails(selectedTenant.id); // Update users section in modal
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    } finally {
      setDeleteUserModal({ open: false, user: null, loading: false });
    }
  };

  // Cancel delete user
  const handleCancelDeleteUser = () => {
    setDeleteUserModal({ open: false, user: null, loading: false });
  };

  const refreshAll = () => {
    fetchStats();
    fetchTenants();
    fetchSubscriptionAlerts();
    fetchActivityStats();
    toast.success('Dashboard refreshed');
  };

  // Sort tenants by created_at descending (most recent first)
  const sortedTenants = [...tenants].sort((a, b) => {
    const aDate = new Date(a.created_at);
    const bDate = new Date(b.created_at);
    return bDate - aDate;
  });

  const filteredTenants = sortedTenants.filter(tenant => {
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

  // Filter users in tenant details page (exclude Admin, Technical Support, Marketing Admin roles)
  const excludedRoles = ['Admin', 'Technical Support', 'Marketing Admin'];
  const filteredUsers = selectedTenant && selectedTenant.users
    ? selectedTenant.users
        .filter(user => {
          // Exclude users with specific roles
          if (excludedRoles.includes(user.role)) {
            return false;
          }
          const term = searchUserTerm.toLowerCase();
          return (
            user.first_name.toLowerCase().includes(term) ||
            user.last_name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.role.toLowerCase().includes(term)
          );
        })
        .sort((a, b) => {
          // Sort by created_at descending (most recent first)
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        })
    : [];

  // Pagination logic
  const pageSizeNum = parseInt(pageSizeInput, 10);
  const totalTenants = filteredTenants.length;
  let effectivePageSize = 10;
  if (!pageSizeInput || isNaN(pageSizeNum) || pageSizeNum < 1) {
    effectivePageSize = 0;
  } else {
    effectivePageSize = pageSizeNum;
  }
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalTenants / effectivePageSize) : 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = startIndex + effectivePageSize;
  const paginatedTenants = effectivePageSize > 0 ? filteredTenants.slice(startIndex, endIndex) : [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const tenantGraphData = Object.values(
    tenants.reduce((acc, tenant) => {
      if (!tenant.created_at) return acc;

      const createdDate = new Date(tenant.created_at);
      if (Number.isNaN(createdDate.getTime())) return acc;

      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthKey,
          monthLabel: createdDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
          tenantCount: 0,
        };
      }

      acc[monthKey].tenantCount += 1;
      return acc;
    }, {})
  ).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const formatLoginDateTime = (value) => {
    if (!value) return 'No login yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No login yet';
    return date.toLocaleString();
  };

  const latestMonthTenants = tenantGraphData.length
    ? tenantGraphData[tenantGraphData.length - 1].tenantCount
    : 0;
  const avgTenantsPerMonth = tenantGraphData.length
    ? (tenantGraphData.reduce((sum, row) => sum + row.tenantCount, 0) / tenantGraphData.length).toFixed(1)
    : '0.0';

  const useAngledMonthLabels = tenantGraphData.length > 6;

  const ACTIVITY_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;
  const activityWindowLabel = '15d';
  const tenantUsageData = tenants.map((tenant) => {
    const users = tenant.users || [];
    const totalUsers = users.length;

    const recentLogins30d = users.filter((user) => {
      if (!user.last_login) return false;
      const loginDate = new Date(user.last_login);
      if (Number.isNaN(loginDate.getTime())) return false;
      return Date.now() - loginDate.getTime() <= ACTIVITY_WINDOW_MS;
    }).length;

    return {
      id: tenant.id,
      name: tenant.company_name,
      totalUsers,
      recentLogins30d,
      activityRate: totalUsers ? Math.round((recentLogins30d / totalUsers) * 100) : 0,
      lastLogin: tenant.latest_last_login,
    };
  });

  const getTenantActivityStatus = (tenant) => {
    if (tenant.recentLogins30d === 0) return 'Inactive';
    if (tenant.activityRate < 25) return 'Low Activity';
    return 'Active';
  };

  const getTenantActivityStatusClasses = (tenant) => {
    const status = getTenantActivityStatus(tenant);
    if (status === 'Inactive') return 'bg-rose-200 text-rose-900';
    if (status === 'Low Activity') return 'bg-amber-200 text-amber-900';
    return 'bg-emerald-200 text-emerald-900';
  };

  const byActivityDesc = [...tenantUsageData].sort((a, b) => {
    if (b.recentLogins30d !== a.recentLogins30d) return b.recentLogins30d - a.recentLogins30d;
    if (b.activityRate !== a.activityRate) return b.activityRate - a.activityRate;
    const aTime = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
    const bTime = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
    return bTime - aTime;
  });

  const activeAndHealthy = byActivityDesc.filter((tenant) => getTenantActivityStatus(tenant) === 'Active');
  const notHealthy = [...byActivityDesc]
    .filter((tenant) => getTenantActivityStatus(tenant) !== 'Active')
    .sort((a, b) => {
      if (a.recentLogins30d !== b.recentLogins30d) return a.recentLogins30d - b.recentLogins30d;
      if (a.activityRate !== b.activityRate) return a.activityRate - b.activityRate;
      const aTime = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
      const bTime = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      return aTime - bTime;
    });

  const mostActiveTenants = activeAndHealthy.slice(0, 3);
  const leastActiveTenants = notHealthy.slice(0, 3);

  const openNotifyComposerForTenant = (tenant) => {
    const matchedTenant = tenants.find((t) => t.id === tenant.id);
    const isTenantAdmin = (user) => {
      const role = (user?.role || '').toString().trim().toLowerCase();
      return role === 'ceo' || role === 'tenant admin' || role === 'administrator';
    };

    const tenantAdminEmails = [
      ...new Set(
        (matchedTenant?.users || [])
          .filter(isTenantAdmin)
          .map((user) => user.email)
          .filter(Boolean)
      ),
    ];

    if (!tenantAdminEmails.length) {
      toast.info('No tenant admin email found for this tenant.');
      return;
    }

    setNotifyModal({
      open: true,
      tenantId: tenant.id,
      tenantName: tenant.name,
      recipients: tenantAdminEmails.join(', '),
      subject: `Action needed: ${tenant.name} activity is low (${activityWindowLabel})`,
      message: `Hi ${tenant.name} Admin,\n\nOur records show low activity in your tenant within the last ${activityWindowLabel}.\nPlease log in and continue your workflow.\n\nThanks,\nCRM Admin`,
    });
  };

  const sendTenantNotificationEmail = () => {
    const recipients = notifyModal.recipients
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!recipients.length) {
      toast.info('No tenant admin recipient is configured.');
      return;
    }

    const bcc = encodeURIComponent(recipients.join(','));
    const subject = encodeURIComponent(notifyModal.subject || 'Low activity notice');
    const body = encodeURIComponent(notifyModal.message || '');

    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
    toast.success(`Opening email composer for ${notifyModal.tenantName}.`);
    setNotifyModal({ open: false, tenantId: null, tenantName: '', recipients: '', subject: '', message: '' });
  };

  if (loading && !stats) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-inter">
      {/* Header */}
      <div className="mb-8 relative">
        {/* Mobile refresh icon at top right */}
        <button
          onClick={refreshAll}
          className="absolute top-0 right-0 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition sm:hidden"
          aria-label="Refresh"
        >
          <FiRefreshCw size={20} />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
              <FiActivity className="mr-2 text-orange-600" />
              Admin Dashboard
            </h1>
            <span className="text-gray-600 text-m mt-1 flex items-center">
              Manage all tenants and monitor system-wide statistics
            </span>
          </div>
          <button
            onClick={refreshAll}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-0">
            {/* Expiring Soon */}
            {subscriptionAlerts.expiring_soon.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 col-span-full w-full">
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
              <div className="bg-red-50 rounded-lg col-span-full w-full p-0">
                <div style={{ width: '100%', padding: 24 }}>
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tenant Monthly Graph */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 mb-2">
              <FiTrendingUp className="w-3.5 h-3.5" />
              Tenant Growth Overview
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Tenants Per Month</h2>
            <p className="text-sm text-slate-500 mt-1">
              Monthly count of newly created tenants and latest login visibility per tenant.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Months</p>
              <p className="text-lg font-bold text-slate-800">{tenantGraphData.length}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Latest</p>
              <p className="text-lg font-bold text-slate-800">{latestMonthTenants}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Avg/Month</p>
              <p className="text-lg font-bold text-slate-800">{avgTenantsPerMonth}</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Number of tenants created each month.
        </div>

        {tenantGraphData.length > 0 ? (
          <>
            <div className="h-72 w-full mb-6 rounded-xl border border-slate-200 bg-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenantGraphData} margin={{ top: 10, right: 20, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="monthLabel"
                    angle={useAngledMonthLabels ? -30 : 0}
                    textAnchor={useAngledMonthLabels ? 'end' : 'middle'}
                    height={useAngledMonthLabels ? 65 : 30}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b' }}
                    domain={[0, (dataMax) => (dataMax && dataMax > 0 ? dataMax : 1)]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, borderColor: '#dbeafe' }}
                    formatter={(value, key) => {
                      if (key === 'tenantCount') return [value, 'Tenants'];
                      return [value, key];
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="tenantCount" radius={[8, 8, 0, 0]}>
                    {tenantGraphData.map((entry, index) => (
                      <Cell key={`${entry.monthKey}-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-emerald-200 rounded-xl bg-emerald-50/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-emerald-200 bg-emerald-100/60">
                  <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Most Active Tenants</h3>
                </div>
                <div className="divide-y divide-emerald-100">
                  {mostActiveTenants.length > 0 ? (
                    mostActiveTenants.map((tenant, index) => (
                      <div key={tenant.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-slate-800 truncate">{index + 1}. {tenant.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTenantActivityStatusClasses(tenant)}`}>
                              {getTenantActivityStatus(tenant)}
                            </span>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-200 text-emerald-900">
                              {tenant.activityRate}% active
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Recent logins ({activityWindowLabel}): {tenant.recentLogins30d} / {tenant.totalUsers}</p>
                        <p className="text-xs text-slate-500">Last login: {formatLoginDateTime(tenant.lastLogin)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-slate-500">
                      No active tenants in this window.
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-rose-200 rounded-xl bg-rose-50/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-rose-200 bg-rose-100/60 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-rose-800 uppercase tracking-wide">Least Active Tenants</h3>
                </div>
                <div className="divide-y divide-rose-100">
                  {leastActiveTenants.length > 0 ? (
                    leastActiveTenants.map((tenant, index) => (
                      <div key={tenant.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-slate-800 truncate">{index + 1}. {tenant.name}</p>
                          <div className="flex flex-row items-center gap-2 whitespace-nowrap">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTenantActivityStatusClasses(tenant)}`}>{getTenantActivityStatus(tenant)}</span>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-rose-200 text-rose-900">{tenant.activityRate}% active</span>
                            <button
                              type="button"
                              onClick={() => openNotifyComposerForTenant(tenant)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                            >
                              Notify
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Recent logins ({activityWindowLabel}): {tenant.recentLogins30d} / {tenant.totalUsers}</p>
                        <p className="text-xs text-slate-500">Last login: {formatLoginDateTime(tenant.lastLogin)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-slate-500">
                      No distinct least-active tenants yet. Add more tenants to compare activity.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No tenant activity data available yet.</p>
        )}
      </div>
      {/* Search and Tenants List */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-grey-500">
        <div className="flex flex-col gap-4 mb-6 w-full">
          <div className="flex items-center w-full">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              All Tenants ({filteredTenants.length})
              {/* Icon-only Add Tenant button for md and up devices, red, no bg, right next to title */}
              <button
                className="hidden md:inline-flex items-center cursor-pointer justify-center ml-1 w-10 h-10 text-red-600 rounded-full hover:text-red-700 focus:outline-none"
                style={{ background: 'none', boxShadow: 'none', border: 'none' }}
                onClick={() => setShowAddTenantModal(true)}
                title="Add Tenant"
                aria-label="Add Tenant"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </h2>
            {/* Full Add Tenant button for small screens only */}
            <button
              className="ml-auto flex md:hidden items-center cursor-pointer gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition text-sm font-semibold"
              onClick={() => setShowAddTenantModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Tenant
            </button>
                {/* Add Tenant Modal */}
                {showAddTenantModal && (
                  <AddTenantForm
                    onClose={() => setShowAddTenantModal(false)}
                    onSuccess={fetchTenants}
                  />
                )}
          </div>
          <div className="flex flex-col gap-3 w-full">
            {/* Filter Buttons - Top Right on MD+ */}
            <div className="grid grid-cols-5 gap-1 w-full md:flex md:justify-end md:w-full md:gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-1 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-2 py-1 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('expiring')}
                className={`px-2 py-1 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  filterStatus === 'expiring'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Expiring
              </button>
              <button
                onClick={() => setFilterStatus('expired')}
                className={`px-2 py-1 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  filterStatus === 'expired'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Expired
              </button>
              <button
                onClick={() => setFilterStatus('suspended')}
                className={`px-2 py-1 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  filterStatus === 'suspended'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Suspended
              </button>
            </div>

            {/* Search Box - Full Width */}
            <div className="w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg w-full"
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
        </div>

        {/* Tenants Table */}
        <div className="overflow-x-auto">
          {/* Add Tenant button for large screens, placed before thead for accessibility */}
          <div className="flex justify-end lg:hidden mb-2">
            {/* This is just for spacing on small screens, actual button is above */}
          </div>
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
              {(paginatedTenants.length === 0 || filteredTenants.length === 0) ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 text-sm">No tenants found.</td>
                </tr>
              ) : (
                paginatedTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-gray-50 cursor-pointer group"
                    onClick={() => viewTenantDetails(tenant.id)}
                    style={{ userSelect: 'none' }}
                  >
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
                          onClick={e => { e.stopPropagation(); viewTenantDetails(tenant.id); }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 cursor-pointer focus:outline-none"
                          style={{ cursor: 'pointer' }}
                        >
                          <FiEye /> View
                        </button>
                        {tenant.is_subscription_active ? (
                          <button
                            onClick={e => { e.stopPropagation(); openActionModal(tenant.id, tenant.company_name, 'suspend'); }}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-2 cursor-pointer focus:outline-none"
                            style={{ cursor: 'pointer' }}
                          >
                            <FiToggleLeft /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); openActionModal(tenant.id, tenant.company_name, 'reactivate'); }}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 ml-2 cursor-pointer focus:outline-none"
                            style={{ cursor: 'pointer' }}
                          >
                            <FiToggleRight /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4">
          <PaginationControls
            totalItems={totalTenants}
            pageSize={pageSizeInput}
            currentPage={currentPage}
            onPrev={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            onPageSizeChange={(val) => {
              setPageSizeInput(val);
              // Only update pageSize if valid number >= 10
              const num = parseInt(val, 10);
              if (!isNaN(num) && num >= 10) {
                setPageSize(num);
                setCurrentPage(1);
              }
            }}
            onPageSizeBlur={() => {
              // On blur, reset to 10 if invalid
              const num = parseInt(pageSizeInput, 10);
              if (isNaN(num) || num < 10) {
                setPageSizeInput('10');
                setPageSize(10);
                setCurrentPage(1);
              }
            }}
            label="tenants"
          />
        </div>
      </div>

      {/* Tenant details page accessible via route /super-admin/tenant/:id */}

      {/* User Details Modal */}
      <UserDetailsModal 
        open={showUserDetailsModal} 
        user={selectedUser} 
        onClose={() => setShowUserDetailsModal(false)}
      />

      {/* Activity Logs Modal */}
      <ActivityLogsModal 
        open={showActivityLogsModal} 
        user={activityLogsUser} 
        onClose={() => setShowActivityLogsModal(false)}
      />

      {/* Delete All Users Confirmation Modal */}
      <ConfirmationModal
        open={deleteAllUsersModal.open}
        title="Delete All Users?"
        message={
          <span>
            Are you sure you want to delete all users from <span className="font-semibold">{deleteAllUsersModal.tenantName}</span>? This will permanently delete all user records and related data. This action cannot be undone.
          </span>
        }
        confirmLabel="Delete All Users"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteAllUsersModal.loading}
        onCancel={handleCancelDeleteAllUsers}
        onConfirm={handleConfirmDeleteAllUsers}
      />

      {/* Toggle User Status Confirmation Modal */}
      <ConfirmationModal
        open={toggleUserStatusModal.open}
        title={toggleUserStatusModal.newStatus ? `Reactivate ${toggleUserStatusModal.user?.first_name} ${toggleUserStatusModal.user?.last_name}?` : `Deactivate ${toggleUserStatusModal.user?.first_name} ${toggleUserStatusModal.user?.last_name}?`}
        message={
          toggleUserStatusModal.newStatus
            ? `Are you sure you want to reactivate ${toggleUserStatusModal.user?.first_name}? They will be able to login again.`
            : `Are you sure you want to deactivate ${toggleUserStatusModal.user?.first_name}? They will be unable to login.`
        }
        confirmLabel={toggleUserStatusModal.newStatus ? 'Reactivate' : 'Deactivate'}
        cancelLabel="Cancel"
        variant={toggleUserStatusModal.newStatus ? 'primary' : 'warning'}
        loading={toggleUserStatusModal.loading}
        onCancel={handleCancelToggleUserStatus}
        onConfirm={handleConfirmToggleUserStatus}
      />

      {/* Delete Single User Confirmation Modal */}
      <ConfirmationModal
        open={deleteUserModal.open}
        title={`Delete ${deleteUserModal.user?.first_name} ${deleteUserModal.user?.last_name}?`}
        message={
          <span>
            Are you sure you want to delete <span className="font-semibold">{deleteUserModal.user?.first_name} {deleteUserModal.user?.last_name}</span>? This will permanently delete the user record and related data. This action cannot be undone.
          </span>
        }
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteUserModal.loading}
        onCancel={handleCancelDeleteUser}
        onConfirm={handleConfirmDeleteUser}
      />

    {/* Suspend/Reactivate Confirmation Modal */}
    <ConfirmationModal
      open={actionModal.open}
      title={
        actionModal.action === 'suspend'
          ? `Suspend ${actionModal.companyName}?`
          : actionModal.action === 'reactivate'
          ? `Reactivate ${actionModal.companyName}?`
          : ''
      }
      message={
        actionModal.action === 'suspend'
          ? `Are you sure you want to suspend ${actionModal.companyName}? All users from this company will be unable to login.`
          : actionModal.action === 'reactivate'
          ? `Are you sure you want to reactivate ${actionModal.companyName}? Users will be able to login again.`
          : ''
      }
      confirmLabel={
        actionModal.action === 'suspend'
          ? 'Suspend'
          : actionModal.action === 'reactivate'
          ? 'Reactivate'
          : 'Confirm'
      }
      cancelLabel="Cancel"
      variant={actionModal.action === 'suspend' ? 'danger' : 'primary'}
      onConfirm={handleConfirmAction}
      onCancel={handleCancelAction}
    />

    {notifyModal.open && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Notify {notifyModal.tenantName}</h3>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setNotifyModal({ open: false, tenantId: null, tenantName: '', recipients: '', subject: '', message: '' })}
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients (comma separated)</label>
              <input
                type="text"
                value={notifyModal.recipients}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="user1@email.com, user2@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">Recipients are fixed to tenant admin email(s).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={notifyModal.subject}
                onChange={(e) => setNotifyModal((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={notifyModal.message}
                onChange={(e) => setNotifyModal((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[140px]"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setNotifyModal({ open: false, tenantId: null, tenantName: '', recipients: '', subject: '', message: '' })}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              onClick={sendTenantNotificationEmail}
            >
              Send Email
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};

// Enhanced Stat Card Component
const StatCard = ({ icon, title, value, bgColor }) => {
  return (
    <div
      className={
        `relative rounded-2xl shadow-lg p-6 flex items-center gap-4 ` +
        `bg-gradient-to-br from-white/80 to-gray-100/80 backdrop-blur-md border border-gray-100`
      }
      style={{ minHeight: 110 }}
    >
      {/* Accent bar */}
      <span
        className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${bgColor}`}
        aria-hidden="true"
      />
      {/* Icon */}
      <div
        className={`flex items-center justify-center ${bgColor} bg-opacity-90 text-white rounded-xl shadow-md mr-2`}
        style={{ width: 54, height: 54 }}
      >
        {React.cloneElement(icon, { className: 'w-8 h-8 drop-shadow' })}
      </div>
      {/* Text */}
      <div className="flex flex-col justify-center flex-1">
        <span className="text-xs font-semibold text-gray-500 tracking-wide mb-1 uppercase">{title}</span>
        <span className="text-4xl font-extrabold text-gray-800 leading-tight drop-shadow-sm">{value}</span>
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

