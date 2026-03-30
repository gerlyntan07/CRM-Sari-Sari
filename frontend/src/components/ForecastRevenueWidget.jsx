import React, { useState, useEffect } from "react";
import "./ForecastRevenueWidget.css";
import { Line } from "react-chartjs-2";
import { FiTrendingUp, FiTrendingDown, FiInfo, FiChevronUp, FiChevronDown, FiX } from "react-icons/fi";

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// timeRanges: Used for the time range dropdown (not yet connected to data)
const timeRanges = [
  { label: "This Year", value: "year" },
  { label: "Custom", value: "custom" },
];



const ForecastRevenueWidget = ({ dashboardLoading }) => {

  const [range, setRange] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showPipeline, setShowPipeline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const fetchData = () => {
      setError(null);
      let url = `/api/forecast-revenue/summary?range_param=${range}`;
      if (range === "custom" && customStart && customEnd) {
        url += `&start_date=${customStart}&end_date=${customEnd}`;
      }
      fetch(url, { credentials: 'include' })
        .then(async (res) => {
          const text = await res.text();
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${text}`);
          }
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error(`Invalid JSON: ${text}`);
          }
        })
        .then((json) => {
          if (isMounted) setData(json);
        })
        .catch((err) => {
          if (isMounted) setError(err.message);
        });
    };

    // If custom, only fetch if both dates are set; clear data if not
    if (range === "custom") {
      if (customStart && customEnd) {
        fetchData();
        intervalId = setInterval(fetchData, 5000);
      } else {
        setData(null);
        setError(null);
      }
    } else {
      fetchData();
      intervalId = setInterval(fetchData, 5000);
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [range, customStart, customEnd]);


  // --- Dynamic Data Preparation for Custom Range ---
  let sampleLabels = monthLabels;
  let sampleData = Array(12).fill(null);
  let forecastData = Array(12).fill(null);
  let pipelineStages = [];
  let weightedForecast = 0;
  let customLabels = [];
  let customSampleData = [];
  let customForecastData = [];
  let customPipelineStages = [];
  let customWeightedForecast = 0;

  // If loading, always show zero/empty data
  if (dashboardLoading) {
    sampleData = Array(12).fill(0);
    forecastData = Array(12).fill(0);
    pipelineStages = [];
    weightedForecast = 0;
    customLabels = [];
    customSampleData = [];
    customForecastData = [];
    customPipelineStages = [];
    customWeightedForecast = 0;
  } else if (data) {
    // If custom, expect backend to return .labels, .actuals, .forecasts, .weighted_forecasts_by_month, .pipeline for the custom range
    if (range === "custom" && data.labels && Array.isArray(data.labels)) {
      customLabels = data.labels;
      customSampleData = data.actuals ? data.labels.map((label, i) => data.actuals[i+1] ?? null) : [];
      if (data.weighted_forecasts_by_month) {
        customForecastData = data.labels.map((label, i) => data.weighted_forecasts_by_month[i+1] ?? null);
      } else if (data.forecasts) {
        customForecastData = data.labels.map((label, i) => data.forecasts[i+1] ?? null);
      }
      // Pipeline for custom range
      const allowedStages = [
        'PROSPECTING',
        'QUALIFICATION',
        'PROPOSAL',
        'NEGOTIATION',
        'CLOSED_WON',
      ];
      customPipelineStages = Object.entries(data.pipeline || {})
        .filter(([stage]) => allowedStages.includes(stage))
        .map(([stage, v]) => ({
          stage,
          expected: v.expected,
          probability: v.probability,
          weighted: v.weighted,
        }));
      customWeightedForecast = data.weighted_forecast || customPipelineStages.filter(s => s.stage !== 'CLOSED_WON').reduce((sum, s) => sum + Number(s.weighted), 0);
    } else {
      // Default: use monthLabels
      sampleData = monthLabels.map((_, i) => data.actuals && data.actuals[i+1] ? data.actuals[i+1] : null);
      if (data.weighted_forecasts_by_month) {
        forecastData = monthLabels.map((_, i) => data.weighted_forecasts_by_month[i+1] ? data.weighted_forecasts_by_month[i+1] : null);
      } else if (data.forecasts) {
        forecastData = monthLabels.map((_, i) => {
          if (i === (new Date()).getMonth() && data.pipeline) {
            return Object.entries(data.pipeline)
              .filter(([stage]) => stage !== 'CLOSED_WON')
              .reduce((sum, [, v]) => sum + (v.weighted || 0), 0);
          }
          return data.forecasts && data.forecasts[i+1] ? data.forecasts[i+1] : null;
        });
      }
      const allowedStages = [
        'PROSPECTING',
        'QUALIFICATION',
        'PROPOSAL',
        'NEGOTIATION',
        'CLOSED_WON',
      ];
      pipelineStages = Object.entries(data.pipeline || {})
        .filter(([stage]) => allowedStages.includes(stage))
        .map(([stage, v]) => ({
          stage,
          expected: v.expected,
          probability: v.probability,
          weighted: v.weighted,
        }));
      weightedForecast = data.weighted_forecast || pipelineStages.filter(s => s.stage !== 'CLOSED_WON').reduce((sum, s) => sum + Number(s.weighted), 0);
    }
  }

  // Chart data and pipeline for custom or default
  const isCustom = range === "custom" && customLabels.length > 0;
  const chartData = {
    labels: isCustom ? customLabels : sampleLabels,
    datasets: [
      {
        label: "Actual Revenue",
        data: isCustom ? customSampleData : sampleData,
        fill: true,
        backgroundColor: "rgba(59,130,246,0.08)",
        borderColor: "#2563eb",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#fff",
      },
      {
        label: "Forecast Revenue",
        data: isCustom ? customForecastData : forecastData,
        fill: false,
        borderColor: "#22c55e",
        borderDash: [6, 6],
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#fff",
      },
    ],
  };
  const chartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "#f3f4f6" },
        ticks: {
          callback: (value) => `₱${value.toLocaleString()}`,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };


  // --- Auto-calculated Key Metrics (Dynamic for Custom) ---
  let nextPeriodForecast = null;
  let previousForecast = null;
  let growth = null;
  let totalForecast = 0;
  if (dashboardLoading) {
    nextPeriodForecast = 0;
    previousForecast = 0;
    growth = null;
    totalForecast = 0;
  } else if (isCustom) {
    // Next period: after last label
    nextPeriodForecast = customForecastData.length > 1 ? customForecastData[customForecastData.length - 1] : null;
    previousForecast = customForecastData.length > 2 ? customForecastData[customForecastData.length - 2] : null;
    growth =
      nextPeriodForecast != null && previousForecast != null && previousForecast !== 0
        ? (nextPeriodForecast - previousForecast) / previousForecast
        : null;
    totalForecast = customForecastData.filter((v) => v != null).reduce((sum, v) => sum + v, 0);
  } else {
    const now = new Date();
    const currentMonthIndex = now.getMonth(); // 0-based: Jan=0
    nextPeriodForecast = forecastData[currentMonthIndex + 1] ?? null;
    previousForecast = forecastData[currentMonthIndex] ?? null;
    growth =
      nextPeriodForecast != null && previousForecast != null && previousForecast !== 0
        ? (nextPeriodForecast - previousForecast) / previousForecast
        : null;
    totalForecast = forecastData.filter((v) => v != null).reduce((sum, v) => sum + v, 0);
  }

  // Remove loading spinner when switching range
  if (error) {
    return <div className="bg-white rounded-2xl w-full p-6 animate-fade-in text-red-600">Error: {error}</div>;
  }
  return (
    <div className="bg-white rounded-2xl w-full p-6 animate-fade-in">
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 mr-2">
            Expected Revenue Forecast
          </h2>
          <button
            className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none cursor-pointer"
            title={showInfo ? "Close info" : "How is this calculated?"}
            onClick={() => setShowInfo((v) => !v)}
            aria-label={showInfo ? "Close info" : "Show explanation"}
          >
            {showInfo ? <FiX size={18} /> : <FiInfo size={18} />}
          </button>
          <button
            className="ml-2 cursor-pointer"
            onClick={() => setShowPipeline((v) => !v)}
            aria-label={showPipeline ? "Hide Pipeline Breakdown" : "Show Pipeline Breakdown"}
            title={showPipeline ? "Hide Pipeline Breakdown" : "Show Pipeline Breakdown"}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              borderRadius: 0,
              lineHeight: 0,
            }}
          >
            {showPipeline ? (
              <FiChevronUp size={22} className="text-blue-500" style={{ background: 'none', border: 'none', boxShadow: 'none' }} />
            ) : (
              <FiChevronDown size={22} className="text-blue-500" style={{ background: 'none', border: 'none', boxShadow: 'none' }} />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            value={range}
            onChange={(e) => {
              setRange(e.target.value);
              if (e.target.value !== "custom") {
                setCustomStart("");
                setCustomEnd("");
              }
            }}
          >
            {timeRanges.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {range === "custom" && (
            <>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 date-picker-cursor"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                max={customEnd || undefined}
                style={{ minWidth: 120 }}
              />
              <span className="mx-1 text-xs text-gray-500">to</span>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 date-picker-cursor"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                min={customStart || undefined}
                style={{ minWidth: 120 }}
              />
            </>
          )}
        </div>
      </div>
      {/* Explanatory Note & Formula (toggle) - moved above chart */}
      {showInfo && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-4 animate-fade-in">
          <div className="font-semibold text-blue-700 mb-1 text-sm flex items-center">
            How is Expected Revenue Calculated?
          </div>
          <div className="text-xs text-gray-700 mb-2">
            <span className="font-medium">Expected Revenue</span> is a forecast
            of how much revenue you are likely to earn, based on your current
            sales pipeline. It uses the value of each open deal and the
            probability of closing that deal (based on its stage).
          </div>
          <div className="text-xs text-gray-700 mb-2 flex items-center">
            <span className="font-semibold mr-2">Formula:</span>
            <span className="font-mono bg-yellow-100 rounded px-2 py-1 text-sm font-bold text-yellow-900">
              Expected Revenue = Σ (Deal Value × Probability)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border rounded mb-2">
              <thead className="bg-blue-100">
                <tr>
                  <th className="py-1 px-2 text-left">Stage</th>
                  <th className="py-1 px-2 text-left">Deal Value</th>
                  <th className="py-1 px-2 text-left">Probability</th>
                  <th className="py-1 px-2 text-left">Weighted Value</th>
                </tr>
              </thead>
              <tbody>
                {(isCustom ? customPipelineStages : pipelineStages).map((s, i) => (
                  <tr key={s.stage} className={i % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                    <td className="py-1 px-2 font-medium text-gray-700">
                      {s.stage === 'PROSPECTING' ? 'Prospecting'
                        : s.stage === 'QUALIFICATION' ? 'Qualification'
                        : s.stage === 'PROPOSAL' ? 'Proposal'
                        : s.stage === 'NEGOTIATION' ? 'Negotiation'
                        : s.stage === 'CLOSED_WON' ? 'Closed Won'
                        : s.stage}
                    </td>
                    <td className="py-1 px-2">₱{Number(s.expected).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-1 px-2">{(s.probability * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                    <td className="py-1 px-2">₱{Number(s.weighted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-semibold">Total Expected Revenue:</span>{" "}
            {(isCustom ? customPipelineStages : pipelineStages).map((s, i) => (
              <span key={s.stage}>
                {i > 0 && ' + '}
                ₱{Number(s.weighted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ))}
            {(isCustom ? customPipelineStages : pipelineStages).length > 0 && (
              <>
                {" = "}
                <span className="font-bold text-blue-700">
                  ₱{(isCustom
                    ? customPipelineStages.reduce((sum, s) => sum + Number(s.weighted), 0)
                    : pipelineStages.reduce((sum, s) => sum + Number(s.weighted), 0)
                  ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            This gives you a realistic estimate of future revenue, not just the
            total of all open deals. It helps you set targets and spot gaps in
            your pipeline.
          </div>
        </div>
      )}
      <div className="h-64 w-full mb-4">
        <Line data={chartData} options={chartOptions} />
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div>
          <span className="text-gray-500 text-xs">Next Period</span>
          <div className="text-2xl font-bold text-violet-700">
            {dashboardLoading ? (
              <span className="text-gray-400">—</span>
            ) : nextPeriodForecast != null ? (
              `₱${nextPeriodForecast.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Growth</span>
          {growth != null ? (
            growth >= 0 ? (
              <div className="flex items-center text-green-600 font-semibold text-xl">
                <FiTrendingUp className="mr-1" /> +{(growth * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </div>
            ) : (
              <div className="flex items-center text-red-600 font-semibold text-xl">
                <FiTrendingDown className="mr-1" /> {(growth * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </div>
            )
          ) : (
            <div className="text-gray-400 text-2xl font-bold">—</div>
          )}
        </div>
        <div>
          <span className="text-gray-500 text-xs">Total Forecast</span>
          <div className="text-2xl font-bold text-pink-700">
            {totalForecast != null && !isNaN(totalForecast) && totalForecast !== 0 ? (
              `₱${totalForecast.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
      </div>
      {/* Pipeline Stage Breakdown (toggle-able, icon only) */}
      {showPipeline && (
        <div className="mb-1">
          <table className="w-full text-xs text-left border rounded-lg overflow-hidden animate-fade-in">
            <thead className="bg-gray-50">
              <tr>
                <th colSpan="4" className="py-2 px-2 text-center text-base font-semibold text-gray-800 bg-white">Pipeline Breakdown</th>
              </tr>
              <tr>
                <th className="py-1 px-2">Stage</th>
                <th className="py-1 px-2">Expected</th>
                <th className="py-1 px-2">Probability</th>
                <th className="py-1 px-2 min-w-[120px]">Weighted</th>
              </tr>
            </thead>
            <tbody>
              {(isCustom ? customPipelineStages : pipelineStages).map((s, i) => (
                <tr
                  key={s.stage}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-1 px-2 font-medium text-gray-700">
                    {s.stage === 'PROSPECTING' ? 'Prospecting'
                      : s.stage === 'QUALIFICATION' ? 'Qualification'
                      : s.stage === 'PROPOSAL' ? 'Proposal'
                      : s.stage === 'NEGOTIATION' ? 'Negotiation'
                      : s.stage === 'CLOSED_WON' ? 'Closed Won'
                      : s.stage}
                  </td>
                  <td className="py-1 px-2">₱{Number(s.expected).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-1 px-2">{(s.probability * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                  <td className="py-1 px-2 min-w-[120px]">₱{Number(s.weighted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr>
                <td></td>
                <td></td>
                <td
                  className="py-1 px-2 text-xs font-bold text-gray-700 text-right"
                  colSpan="1"
                >
                  Weighted Forecast:
                </td>
                <td className="py-1 px-2 text-xs font-bold text-green-700 text-left min-w-[120px]">
                  {dashboardLoading ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    `₱${Number(isCustom ? customWeightedForecast : weightedForecast).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ForecastRevenueWidget;
