import React, { useMemo } from 'react';
import { FiTarget } from "react-icons/fi";

// Reuse your currency formatter or pass it as a prop
const formatCurrency = (amount, symbol = "₱") => {
  return `${symbol} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount)}`;
};

const TopPerformers = ({ leaderboardData, currencySymbol }) => {
  const performers = useMemo(() => {
    // We take the entries array from the backend response
    return Array.isArray(leaderboardData) ? leaderboardData.slice(0, 5) : [];
  }, [leaderboardData]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800">Top Performers</h2>
              </div>

      {performers.length > 0 ? (
        <div className="space-y-4">
          {performers.map((person, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  {/* person.user_name comes from your FastAPI join query */}
                  <p className="text-sm font-medium text-gray-800">
                    {person.user_name || "Unknown Rep"}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {person.achievement_percentage}% of target
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(person.achieved_amount, currencySymbol)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 py-4 text-center">
          No performance data found
        </div>
      )}
    </div>
  );
};

export default TopPerformers;