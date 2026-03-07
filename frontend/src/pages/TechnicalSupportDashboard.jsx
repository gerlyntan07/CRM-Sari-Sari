import React, { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiCheckCircle, FiClock, FiMessageSquare, FiUsers,
  FiTrendingUp, FiTrendingDown, FiMonitor, FiSettings, FiBell, FiArrowRight,
  FiActivity, FiHelpCircle, FiPieChart, FiBarChart
} from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import useFetchUser from '../hooks/useFetchUser';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TechnicalSupportDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    tickets: {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      highPriority: 0
    },
    systemStats: {
      uptime: "99.9%",
      activeUsers: 0,
      responseTime: "120ms",
      serverStatus: "healthy"
    },
    alerts: [],
    recentActivity: []
  });

  const { user } = useFetchUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API calls
        setDashboardData({
          tickets: {
            total: 42,
            open: 18,
            inProgress: 12,
            resolved: 12,
            highPriority: 6
          },
          systemStats: {
            uptime: "99.9%",
            activeUsers: 156,
            responseTime: "120ms",
            serverStatus: "healthy"
          },
          alerts: [
            {
              id: 1,
              type: "critical",
              title: "Database Connection Issues",
              description: "Some users experiencing login delays",
              timestamp: "10 minutes ago",
              status: "active"
            },
            {
              id: 2,
              type: "warning", 
              title: "Scheduled Maintenance",
              description: "Server maintenance scheduled for tonight 11 PM",
              timestamp: "2 hours ago",
              status: "scheduled"
            },
            {
              id: 3,
              type: "info",
              title: "Feature Update Deployed",
              description: "New reporting features are now live",
              timestamp: "1 day ago",
              status: "completed"
            }
          ],
          recentActivity: [
            {
              id: 1,
              action: "Ticket resolved",
              details: "Login issue for user john@company.com",
              timestamp: "5 minutes ago",
              status: "resolved"
            },
            {
              id: 2,
              action: "System alert triggered",
              details: "High memory usage on server-02",
              timestamp: "15 minutes ago",
              status: "investigating"
            },
            {
              id: 3,
              action: "User account created",
              details: "New user registration approved",
              timestamp: "1 hour ago",
              status: "completed"
            },
            {
              id: 4,
              action: "Maintenance completed",
              details: "Weekly database optimization finished",
              timestamp: "2 hours ago",
              status: "completed"
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <FiAlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <FiBell className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <FiCheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertBgColor = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Technical Support Dashboard</h1>
        <p className="text-gray-600">Monitor tickets, system health, and user support activities</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Tickets */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.tickets.open + dashboardData.tickets.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.tickets.highPriority} high priority
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiMessageSquare className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.systemStats.uptime}</p>
              <div className="flex items-center mt-1">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                <p className="text-xs text-gray-500">All systems operational</p>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiMonitor className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.systemStats.activeUsers}</p>
              <div className="flex items-center mt-1">
                <FiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <p className="text-xs text-green-600">+12% from last hour</p>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.systemStats.responseTime}</p>
              <div className="flex items-center mt-1">
                <FiTrendingDown className="h-3 w-3 text-green-500 mr-1" />
                <p className="text-xs text-green-600">-5ms from yesterday</p>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FiActivity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ticket Overview</h3>
            <button
              onClick={() => navigate('/technical-support/tickets')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View All <FiArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <FiClock className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-sm font-medium text-gray-900">Open Tickets</span>
              </div>
              <span className="text-lg font-bold text-red-600">{dashboardData.tickets.open}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <FiSettings className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-sm font-medium text-gray-900">In Progress</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{dashboardData.tickets.inProgress}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <FiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm font-medium text-gray-900">Resolved Today</span>
              </div>
              <span className="text-lg font-bold text-green-600">{dashboardData.tickets.resolved}</span>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <button
              onClick={() => navigate('/technical-support/system-alerts')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View All <FiArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboardData.alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${getAlertBgColor(alert.type)}`}>
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {dashboardData.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FiActivity className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.details}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{activity.timestamp}</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  activity.status === 'resolved' || activity.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : activity.status === 'investigating'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/technical-support/tickets')}
          className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          <FiMessageSquare className="h-6 w-6 mx-auto mb-2" />
          <p className="font-medium">Handle Tickets</p>
        </button>
        
        <button
          onClick={() => navigate('/technical-support/system-alerts')}
          className="p-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-center"
        >
          <FiBell className="h-6 w-6 mx-auto mb-2" />
          <p className="font-medium">System Alerts</p>
        </button>
        
        <button
          onClick={() => navigate('/technical-support/system-monitoring')}
          className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
        >
          <FiBarChart className="h-6 w-6 mx-auto mb-2" />
          <p className="font-medium">System Monitor</p>
        </button>
      </div>
    </div>
  );
}