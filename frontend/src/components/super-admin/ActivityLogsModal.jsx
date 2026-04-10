import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, Loader, Search, Calendar } from 'lucide-react';
import api from '../../api';

const ActivityLogsModal = ({ open, user, onClose }) => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (open && user?.id) {
      fetchActivityLogs();
    }
  }, [open, user?.id]);

  const fetchActivityLogs = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/logs/user/${user.id}`);
      setActivityLogs(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load activity logs');
      console.error('Error fetching activity logs:', err);
      // Fallback to empty logs if API fails
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique actions from logs
  const availableActions = useMemo(() => {
    const actions = new Set();
    activityLogs.forEach((log) => {
      if (log.action) actions.add(log.action);
    });
    return Array.from(actions).sort();
  }, [activityLogs]);

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    const filtered = activityLogs.filter((log) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (log.action?.toLowerCase().includes(searchLower) ||
          log.details?.toLowerCase().includes(searchLower) ||
          log.ip_address?.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Action filter
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // Date filter
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }

      return true;
    });

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [activityLogs, searchTerm, selectedAction, startDate, endDate]);

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return '—';
    }
  };

  const getActionBadgeColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    
    if (actionLower.includes('login')) return 'bg-blue-100 text-blue-800';
    if (actionLower.includes('logout')) return 'bg-gray-100 text-gray-800';
    if (actionLower.includes('create') || actionLower.includes('add')) return 'bg-green-100 text-green-800';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-yellow-100 text-yellow-800';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'bg-red-100 text-red-800';
    if (actionLower.includes('reset')) return 'bg-orange-100 text-orange-800';
    if (actionLower.includes('suspend') || actionLower.includes('deactivate')) return 'bg-purple-100 text-purple-800';
    
    return 'bg-gray-100 text-gray-800';
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Activity Logs
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              <span className="font-semibold text-gray-900 break-all">{user.first_name} {user.last_name}</span>
              <br />
              <span className="text-blue-600 break-all">{user.email}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-full p-1 sm:p-2 w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center flex-shrink-0"
          >
            <X size={20} className="sm:block hidden" />
            <X size={18} className="sm:hidden" />
          </button>
        </div>

        {/* FILTERS */}
        <div className="w-full bg-gray-50 flex-shrink-0 border-b border-gray-200 py-3 sm:py-4">
          <div className="px-4 sm:px-6 lg:px-8 space-y-2">
          {/* Row 1: Search Bar & Filter by Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
            {/* Search Bar */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
              <div className="relative">
                <Search size={14} className="sm:block hidden absolute left-3 top-2 text-gray-400" />
                <Search size={12} className="sm:hidden absolute left-3 top-1.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Filter by Action */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white appearance-none"
              >
                <option value="all">All Actions</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <div className="relative">
                <Calendar size={12} className="absolute left-3 top-1.5 sm:top-2 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <div className="relative">
                <Calendar size={12} className="absolute left-3 top-1.5 sm:top-2 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-gray-600 mt-1 text-center">
            Showing <span className="font-semibold">{filteredLogs.length}</span> of <span className="font-semibold">{activityLogs.length}</span> logs
          </p>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 flex-1 overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <Loader size={28} className="sm:block hidden animate-spin text-blue-600" />
              <Loader size={24} className="sm:hidden animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center gap-3">
              <AlertCircle size={18} className="sm:block hidden text-red-600 flex-shrink-0" />
              <AlertCircle size={16} className="sm:hidden text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
              <p className="text-gray-600 font-medium mb-1 sm:mb-2 text-sm sm:text-base">No Activity Found</p>
              <p className="text-gray-500 text-xs sm:text-sm">This user has no recorded activity yet</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
              <p className="text-gray-600 font-medium mb-1 sm:mb-2 text-sm sm:text-base">No Matching Logs</p>
              <p className="text-gray-500 text-xs sm:text-sm">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 space-y-2 sm:space-y-3">
              {filteredLogs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        {log.status && (
                          <span
                            className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full ${
                              log.status === 'SUCCESS'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-xs sm:text-sm text-gray-700 mb-2 break-words">{log.details}</p>
                      )}
                      {log.ip_address && (
                        <p className="text-xs text-gray-500 break-all">IP: {log.ip_address}</p>
                      )}
                    </div>

                    <div className="text-right ml-0 sm:ml-4 flex-shrink-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsModal;
