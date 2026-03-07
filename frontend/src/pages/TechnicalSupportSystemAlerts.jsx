import React, { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiInfo, FiCheckCircle, FiBell, FiX, FiPlus, FiEdit,
  FiTrash2, FiEye, FiClock, FiCalendar, FiUser, FiMonitor, FiServer,
  FiWifi, FiShield, FiRefreshCw, FiFilter, FiSearch, FiSave, FiSend,
  FiArrowUp, FiArrowDown, FiTool, FiDatabase
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from '../components/LoadingSpinner';

export default function TechnicalSupportSystemAlerts() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [systemFilter, setSystemFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [newAlert, setNewAlert] = useState({
    type: 'info',
    title: '',
    description: '',
    system: 'CRM',
    priority: 'medium',
    scheduledFor: '',
    affectedUsers: 'all'
  });

  // Mock data - replace with actual API calls
  const mockAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Database Connection Issues',
      description: 'Primary database experiencing intermittent connection issues. Some users may experience login delays or data sync problems.',
      system: 'Database',
      priority: 'critical',
      status: 'active',
      affectedUsers: 'all',
      createdAt: '2024-03-07T08:30:00Z',
      scheduledFor: null,
      resolvedAt: null,
      author: 'System Monitor',
      updates: [
        {
          id: 1,
          message: 'Issue detected by automated monitoring system',
          timestamp: '2024-03-07T08:30:00Z',
          author: 'System Monitor'
        },
        {
          id: 2,
          message: 'Database team has been notified. Investigating connection pool issues.',
          timestamp: '2024-03-07T08:45:00Z',
          author: 'Tech Support'
        }
      ]
    },
    {
      id: 2,
      type: 'warning',
      title: 'Scheduled System Maintenance',
      description: 'Routine server maintenance and security updates will be performed. System may be unavailable for approximately 2 hours.',
      system: 'Server',
      priority: 'high',
      status: 'scheduled',
      affectedUsers: 'all',
      createdAt: '2024-03-06T14:00:00Z',
      scheduledFor: '2024-03-08T02:00:00Z',
      resolvedAt: null,
      author: 'System Administrator',
      updates: [
        {
          id: 1,
          message: 'Maintenance window scheduled for March 8th, 2 AM - 4 AM EST',
          timestamp: '2024-03-06T14:00:00Z',
          author: 'System Administrator'
        },
        {
          id: 2,
          message: 'User notifications have been sent out via email',
          timestamp: '2024-03-06T14:30:00Z',
          author: 'Tech Support'
        }
      ]
    },
    {
      id: 3,
      type: 'info',
      title: 'New Feature Deployment: Enhanced Reporting',
      description: 'New advanced reporting features have been deployed to production. Users can now access enhanced analytics and export options.',
      system: 'CRM',
      priority: 'medium',
      status: 'resolved',
      affectedUsers: 'all',
      createdAt: '2024-03-05T10:15:00Z',
      scheduledFor: null,
      resolvedAt: '2024-03-05T11:00:00Z',
      author: 'Development Team',
      updates: [
        {
          id: 1,
          message: 'Feature deployment initiated',
          timestamp: '2024-03-05T10:15:00Z',
          author: 'Development Team'
        },
        {
          id: 2,
          message: 'Deployment completed successfully. All systems operational.',
          timestamp: '2024-03-05T11:00:00Z',
          author: 'Tech Support'
        },
        {
          id: 3,
          message: 'User documentation updated and knowledge base articles published',
          timestamp: '2024-03-05T11:30:00Z',
          author: 'Tech Support'
        }
      ]
    },
    {
      id: 4,
      type: 'warning',
      title: 'API Rate Limiting Update',
      description: 'New API rate limits have been implemented to improve system performance. Third-party integrations may be affected.',
      system: 'API',
      priority: 'high',
      status: 'active',
      affectedUsers: 'developers',
      createdAt: '2024-03-04T16:20:00Z',
      scheduledFor: null,
      resolvedAt: null,
      author: 'API Team',
      updates: [
        {
          id: 1,
          message: 'Rate limits updated from 1000 to 500 requests per minute for basic tier',
          timestamp: '2024-03-04T16:20:00Z',
          author: 'API Team'
        },
        {
          id: 2,
          message: 'Developer notifications sent with migration guidelines',
          timestamp: '2024-03-04T17:00:00Z',
          author: 'Tech Support'
        }
      ]
    },
    {
      id: 5,
      type: 'info',
      title: 'Security Certificate Renewal',
      description: 'SSL certificates have been renewed successfully. No action required from users.',
      system: 'Security',
      priority: 'low',
      status: 'resolved',
      affectedUsers: 'none',
      createdAt: '2024-03-03T12:00:00Z',
      scheduledFor: null,
      resolvedAt: '2024-03-03T12:30:00Z',
      author: 'Security Team',
      updates: [
        {
          id: 1,
          message: 'Certificate renewal process started',
          timestamp: '2024-03-03T12:00:00Z',
          author: 'Security Team'
        },
        {
          id: 2,
          message: 'All certificates updated successfully. No service interruption.',
          timestamp: '2024-03-03T12:30:00Z',
          author: 'Security Team'
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAlerts(mockAlerts);
        setFilteredAlerts(mockAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        toast.error('Failed to load system alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Filter alerts
  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }

    if (systemFilter !== 'all') {
      filtered = filtered.filter(alert => alert.system === systemFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, typeFilter, statusFilter, systemFilter]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <FiAlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <FiBell className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <FiInfo className="h-5 w-5 text-blue-500" />;
      default:
        return <FiInfo className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'info':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-red-700 bg-red-100';
      case 'scheduled':
        return 'text-yellow-700 bg-yellow-100';
      case 'resolved':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getSystemIcon = (system) => {
    switch (system) {
      case 'Database':
        return <FiDatabase className="h-4 w-4" />;
      case 'Server':
        return <FiServer className="h-4 w-4" />;
      case 'API':
        return <FiWifi className="h-4 w-4" />;
      case 'Security':
        return <FiShield className="h-4 w-4" />;
      case 'CRM':
        return <FiMonitor className="h-4 w-4" />;
      default:
        return <FiTool className="h-4 w-4" />;
    }
  };

  const handleCreateAlert = async () => {
    try {
      const alertData = {
        ...newAlert,
        id: Date.now(),
        status: newAlert.scheduledFor ? 'scheduled' : 'active',
        createdAt: new Date().toISOString(),
        author: 'Tech Support',
        updates: [
          {
            id: 1,
            message: 'System alert created',
            timestamp: new Date().toISOString(),
            author: 'Tech Support'
          }
        ]
      };

      setAlerts(prev => [alertData, ...prev]);
      setShowCreateModal(false);
      setNewAlert({
        type: 'info',
        title: '',
        description: '',
        system: 'CRM',
        priority: 'medium',
        scheduledFor: '',
        affectedUsers: 'all'
      });
      toast.success('System alert created successfully');
    } catch (error) {
      toast.error('Failed to create alert');
    }
  };

  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              status: newStatus,
              resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : alert.resolvedAt,
              updates: [
                ...alert.updates,
                {
                  id: Date.now(),
                  message: `Alert status changed to ${newStatus}`,
                  timestamp: new Date().toISOString(),
                  author: 'Tech Support'
                }
              ]
            }
          : alert
      ));
      toast.success(`Alert status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update alert status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">System Alerts</h1>
          <p className="text-gray-600">Monitor and manage system updates and alerts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <FiPlus className="h-4 w-4 mr-2" />
          Create Alert
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* System Filter */}
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Systems</option>
            <option value="CRM">CRM</option>
            <option value="Database">Database</option>
            <option value="Server">Server</option>
            <option value="API">API</option>
            <option value="Security">Security</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${getAlertColor(alert.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getAlertIcon(alert.type)}
                  <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{alert.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center">
                    {getSystemIcon(alert.system)}
                    <span className="ml-2 text-gray-600">System: {alert.system}</span>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-gray-600">
                      Created: {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FiUser className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-gray-600">Affects: {alert.affectedUsers}</span>
                  </div>
                  {alert.scheduledFor && (
                    <div className="flex items-center">
                      <FiCalendar className="h-4 w-4 text-gray-400" />
                      <span className="ml-2 text-gray-600">
                        Scheduled: {new Date(alert.scheduledFor).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {alert.status !== 'resolved' && (
                  <select
                    value={alert.status}
                    onChange={(e) => handleStatusUpdate(alert.id, e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="resolved">Resolved</option>
                  </select>
                )}
                <button
                  onClick={() => {
                    setSelectedAlert(alert);
                    setShowDetailsModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <FiEye className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create System Alert</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Alert Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter alert title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({...newAlert, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter detailed description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* System */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
                  <select
                    value={newAlert.system}
                    onChange={(e) => setNewAlert({...newAlert, system: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CRM">CRM</option>
                    <option value="Database">Database</option>
                    <option value="Server">Server</option>
                    <option value="API">API</option>
                    <option value="Security">Security</option>
                  </select>
                </div>

                {/* Affected Users */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affected Users</label>
                  <select
                    value={newAlert.affectedUsers}
                    onChange={(e) => setNewAlert({...newAlert, affectedUsers: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="admins">Administrators Only</option>
                    <option value="developers">Developers</option>
                    <option value="none">No Users</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newAlert.scheduledFor}
                  onChange={(e) => setNewAlert({...newAlert, scheduledFor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                disabled={!newAlert.title || !newAlert.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FiSave className="h-4 w-4 mr-2" />
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Details Modal */}
      {showDetailsModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getAlertIcon(selectedAlert.type)}
                <h2 className="text-xl font-semibold text-gray-900">{selectedAlert.title}</h2>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">{selectedAlert.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">Status:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAlert.status)}`}>
                        {selectedAlert.status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">System:</span>
                      <span className="ml-2 text-gray-700">{selectedAlert.system}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">Affected Users:</span>
                      <span className="ml-2 text-gray-700">{selectedAlert.affectedUsers}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">Created:</span>
                      <span className="ml-2 text-gray-700">{new Date(selectedAlert.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedAlert.scheduledFor && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">Scheduled:</span>
                        <span className="ml-2 text-gray-700">{new Date(selectedAlert.scheduledFor).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedAlert.resolvedAt && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">Resolved:</span>
                        <span className="ml-2 text-gray-700">{new Date(selectedAlert.resolvedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Updates Timeline */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Updates</h3>
                <div className="space-y-4">
                  {selectedAlert.updates.map((update) => (
                    <div key={update.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUser className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{update.author}</span>
                          <span className="text-sm text-gray-500">{new Date(update.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700">{update.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}