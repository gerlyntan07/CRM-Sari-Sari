import React, { useState } from 'react';
import { Target } from 'lucide-react';

const rawAchievementData = [
  { name: "January", achievement: 186, target: 200, month: 1 },
  { name: "February", achievement: 305, target: 320, month: 2 },
  { name: "March", achievement: 237, target: 250, month: 3 },
  { name: "April", achievement: 10, target: 150, month: 4 },
  { name: "May", achievement: 209, target: 220, month: 5 },
  { name: "June", achievement: 214, target: 230, month: 6 },
  { name: "July", achievement: 80, target: 100, month: 7 },
  { name: "August", achievement: 65, target: 90, month: 8 },
  { name: "September", achievement: 40, target: 70, month: 9 },
  { name: "October", achievement: 55, target: 100, month: 10 },
  { name: "November", achievement: 30, target: 60, month: 11 },
  { name: "December", achievement: 45, target: 80, month: 12 },
];

const SalesTargetCharts = () => {
  const [timeframe, setTimeframe] = useState("annual");
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedTrimester, setSelectedTrimester] = useState(1); // New state for trimester

  let filteredData = rawAchievementData;

  if (timeframe === "monthly") {
    filteredData = rawAchievementData.filter(item => item.month === selectedMonth);

  } else if (timeframe === "bimonthly") {
    const startMonth = selectedMonth;
    const endMonth = Math.min(startMonth + 1, 12);
    filteredData = rawAchievementData.filter(
      item => item.month >= startMonth && item.month <= endMonth
    );

  } else if (timeframe === "quarterly") {
    const start = (selectedQuarter - 1) * 3 + 1;
    filteredData = rawAchievementData.filter(
      item => item.month >= start && item.month <= start + 2
    );

  } else if (timeframe === "semiannual") {
    const start = selectedQuarter <= 2 ? 1 : 7;
    filteredData = rawAchievementData.filter(
      item => item.month >= start && item.month <= start + 5
    );

  } else if (timeframe === "trimester") {
    const start = (selectedTrimester - 1) * 4 + 1; // Trimester = 4 months each
    const end = Math.min(start + 3, 12);
    filteredData = rawAchievementData.filter(
      item => item.month >= start && item.month <= end
    );
  }

  const totalTarget = filteredData.reduce((s, i) => s + i.target, 0);
  const totalActual = filteredData.reduce((s, i) => s + i.achievement, 0);
  const percentage = totalTarget ? Math.round((totalActual / totalTarget) * 100) : 0;
  const gaugeRotation = -90 + Math.min(percentage, 100) * 1.8;

  return (
    <div className="min-h-fit p-4 md:p-6 font-manrope">
      <div className="max-w-7xl mx-auto mb-4">
        <h1 className="text-2xl font-bold">Sales Performance</h1>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          {/* Header */}
          <div className="w-full flex justify-between items-start mb-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
            </h2>

            <div className="flex flex-col items-end gap-2">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="text-sm border rounded-md px-3 py-2 bg-slate-50"
              >
                <option value="annual">Annual</option>
                <option value="semiannual">Half a Year</option>
                <option value="trimester">Trimester</option>
                <option value="quarterly">Quarterly</option>
                <option value="bimonthly">Twice a Month</option>
                <option value="monthly">Monthly</option>
              </select>

              {(timeframe === "monthly" || timeframe === "bimonthly") && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(+e.target.value)}
                  className="text-xs border rounded-md px-2 py-1 bg-slate-50"
                >
                  {rawAchievementData.map(item => (
                    <option key={item.month} value={item.month}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}

              {(timeframe === "quarterly" || timeframe === "semiannual") && (
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(+e.target.value)}
                  className="text-xs border rounded-md px-2 py-1 bg-slate-50"
                >
                  {[1, 2, 3, 4].map(q => (
                    <option key={q} value={q}>
                      {timeframe === "semiannual" ? (q <= 2 ? "Jan–Jun" : "Jul–Dec") : `Q${q}`}
                    </option>
                  ))}
                </select>
              )}

              {timeframe === "trimester" && (
                <select
                  value={selectedTrimester}
                  onChange={(e) => setSelectedTrimester(+e.target.value)}
                  className="text-xs border rounded-md px-2 py-1 bg-slate-50"
                >
                  {[1, 2, 3].map(t => (
                    <option key={t} value={t}>
                      {`Trimester ${t}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Gauge */}
          <div className="relative w-64 h-32 overflow-hidden mt-2">
            <div className="absolute w-64 h-64 border-[16px] border-slate-100 rounded-full" />
            <div
              className={`absolute w-64 h-64 border-[16px] rounded-full transition-transform duration-700 ${
                percentage >= 100 ? 'border-emerald-500' : 'border-indigo-500'
              }`}
              style={{
                clipPath: 'inset(0 0 50% 0)',
                transform: `rotate(${gaugeRotation}deg)`
              }}
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <p className="text-4xl font-black text-slate-800">{percentage}%</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Achieved</p>
            </div>
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Achievement</p>
              <p className="text-lg font-bold">${totalActual.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Target</p>
              <p className="text-lg font-bold">${totalTarget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTargetCharts;
