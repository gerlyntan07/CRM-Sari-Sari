import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiTrendingUp, FiCalendar } from "react-icons/fi";
import api from '../api';

// Currency formatter
const formatCurrency = (amount, symbol = "₱") => {
  return `${symbol} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount)}`;
};

// Get current week number
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

const TopPerformers = ({ currencySymbol = "₱" }) => {
  const [activeTab, setActiveTab] = useState('month'); // 'week', 'month', 'year'
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentWeek = getWeekNumber(currentDate);

  // Fetch leaderboard data for different periods
  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch monthly data (current month)
      const monthlyParams = new URLSearchParams();
      monthlyParams.append('period_type', 'MONTHLY');
      monthlyParams.append('period_year', currentYear);
      monthlyParams.append('period_number', currentMonth);
      
      const monthlyRes = await api.get(`/targets/leaderboard?${monthlyParams.toString()}`).catch(() => ({ data: { entries: [] } }));
      setMonthlyData(monthlyRes.data?.entries || []);

      // Fetch yearly data (current year)
      const yearlyParams = new URLSearchParams();
      yearlyParams.append('period_type', 'ANNUAL');
      yearlyParams.append('period_year', currentYear);
      
      const yearlyRes = await api.get(`/targets/leaderboard?${yearlyParams.toString()}`).catch(() => ({ data: { entries: [] } }));
      setYearlyData(yearlyRes.data?.entries || []);

      // For weekly, we use custom date range (last 7 days)
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const weeklyParams = new URLSearchParams();
      weeklyParams.append('start_date', weekStart.toISOString().split('T')[0]);
      weeklyParams.append('end_date', weekEnd.toISOString().split('T')[0]);
      
      const weeklyRes = await api.get(`/targets/leaderboard?${weeklyParams.toString()}`).catch(() => ({ data: { entries: [] } }));
      setWeeklyData(weeklyRes.data?.entries || []);

    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Get current performers based on active tab (top 5 only)
  const currentPerformers = useMemo(() => {
    let data = [];
    switch (activeTab) {
      case 'week':
        data = weeklyData;
        break;
      case 'month':
        data = monthlyData;
        break;
      case 'year':
        data = yearlyData;
        break;
      default:
        data = monthlyData;
    }
    return Array.isArray(data) ? data.slice(0, 5) : [];
  }, [activeTab, weeklyData, monthlyData, yearlyData]);

  const tabs = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' }
  ];

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 1:
        return 'bg-gray-100 text-gray-600 border-gray-300';
      case 2:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <FiTrendingUp className="text-blue-500" size={20} />
          <h2 className="text-md font-semibold text-gray-800">Top 5 Performers</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : currentPerformers.length > 0 ? (
        <div className="space-y-3 flex-1">
          {currentPerformers.map((person, index) => (
            <div 
              key={person.user_id || index} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${getRankStyle(index)}`}>
                  {index + 1}
                </div>
                {/* Name & Achievement */}
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                    {person.user_name || "Unknown Rep"}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          person.achievement_percentage >= 100 
                            ? 'bg-green-500' 
                            : person.achievement_percentage >= 50 
                              ? 'bg-yellow-500' 
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(person.achievement_percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {person.achievement_percentage?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              {/* Achieved Amount */}
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(person.achieved_amount || 0, currencySymbol)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <FiCalendar size={32} className="mb-2 opacity-50" />
          <p className="text-sm">No data for this period</p>
        </div>
      )}

      {/* Period Label */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          {activeTab === 'week' && `Week ${currentWeek}, ${currentYear}`}
          {activeTab === 'month' && `${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}`}
          {activeTab === 'year' && `Year ${currentYear}`}
        </p>
      </div>
    </div>
  );
};

export default TopPerformers;