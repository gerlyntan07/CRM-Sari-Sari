import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
} from "recharts";

const rawPieData = [
    { name: "January", value: 275, fill: "#6366f1", month: 1 },
    { name: "February", value: 200, fill: "#22c55e", month: 2 },
    { name: "March", value: 187, fill: "#f97316", month: 3 },
    { name: "April", value: 173, fill: "#0ea5e9", month: 4 },
    { name: "May", value: 90, fill: "#a855f7", month: 5 },
    { name: "June", value: 120, fill: "#f43f5e", month: 6 },
    { name: "July", value: 80, fill: "#eab308", month: 7 },
    { name: "August", value: 65, fill: "#8b5cf6", month: 8 },
    { name: "September", value: 40, fill: "#10b981", month: 9 },
    { name: "October", value: 55, fill: "#f97316", month: 10 },
    { name: "November", value: 30, fill: "#0ea5e9", month: 11 },
    { name: "December", value: 45, fill: "#a855f7", month: 12 },
];

export default function AdminTargetCharts() {
    const [timeframe, setTimeframe] = useState("annual");
    const [selectedMonth, setSelectedMonth] = useState(1);
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [selectedTrimester, setSelectedTrimester] = useState(1);

    let pieChartData = rawPieData;

    if (timeframe === "monthly") {
        pieChartData = rawPieData.filter(item => item.month === selectedMonth);
    } else if (timeframe === "bimonthly") {
        const startMonth = selectedMonth;
        const endMonth = Math.min(startMonth + 1, 12);
        pieChartData = rawPieData.filter(item => item.month >= startMonth && item.month <= endMonth);
    } else if (timeframe === "quarterly") {
        const startMonth = (selectedQuarter - 1) * 3 + 1;
        const endMonth = startMonth + 2;
        pieChartData = rawPieData.filter(item => item.month >= startMonth && item.month <= endMonth);
    } else if (timeframe === "semiannual") {
        const startMonth = selectedQuarter <= 2 ? 1 : 7;
        const endMonth = startMonth + 5;
        pieChartData = rawPieData.filter(item => item.month >= startMonth && item.month <= endMonth);
    } else if (timeframe === "trimester") {
        const startMonth = (selectedTrimester - 1) * 4 + 1;
        const endMonth = Math.min(startMonth + 3, 12);
        pieChartData = rawPieData.filter(item => item.month >= startMonth && item.month <= endMonth);
    }

    const totalValue = pieChartData.reduce((sum, item) => sum + item.value, 0);
    const pieChartWithPercent = pieChartData.map(item => ({
        ...item,
        percent: ((item.value / totalValue) * 100).toFixed(0),
    }));

    return (
        <div className="flex flex-col md:flex-row gap-6 justify-center items-start flex-wrap">
            {/* Sales Achievement Chart */}
            <div className="bg-white rounded-xl shadow p-4 flex-1 min-w-full md:min-w-[450px] md:h-[420px] h-[350px]">
                <div className="mb-4 text-center">
                    <h2 className="text-lg font-semibold">Sales Achievement</h2>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                    <BarChart
                        data={[
                            { month: "Sales1", achievement: 186, target: 200 },
                            { month: "Sales2", achievement: 305, target: 320 },
                            { month: "Sales3", achievement: 237, target: 250 },
                            { month: "Sales4", achievement: 10, target: 150 },
                            { month: "Sales5", achievement: 209, target: 220 },
                            { month: "Sales6", achievement: 214, target: 230 },
                        ]}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 9)}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            label={{ value: "Target Amount", angle: -90, position: "insideLeft", offset: 3 }}
                            domain={[0, (dataMax) => Math.ceil(dataMax / 50) * 50]}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <Tooltip
                            formatter={(value, name, props) => {
                                const achievement = props.payload.achievement;
                                const target = props.payload.target;
                                return name === "Achievement"
                                    ? [`${achievement} / ${target}`, "Achievement"]
                                    : null;
                            }}
                        />
                        <Bar
                            dataKey="achievement"
                            stackId="a"
                            fill="#FEBD69"
                            name="Achievement"
                            label={({ x, y, width, value, payload }) => {
                                if (!payload || payload.target === undefined) return null;
                                const percent = ((value / payload.target) * 100).toFixed(0);
                                const labelY = y - 10 < 0 ? 10 : y - 10;
                                return (
                                    <text
                                        x={x + width / 2}
                                        y={labelY}
                                        textAnchor="middle"
                                        fill="#111827"
                                        fontSize={10}
                                        fontWeight={300}
                                    >
                                        {percent}%
                                    </text>
                                );
                            }}
                        />
                        <Bar
                            dataKey={(row) => row.target - row.achievement}
                            stackId="a"
                            fill="#e5e7eb"
                            name="Remaining"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-xl shadow p-4 flex-1 min-w-full md:min-w-[450px] md:h-[420px] h-[350px]">
                <div className="text-center mb-4">
                    <h2 className="text-lg font-semibold"> Total Target</h2>
                    <p className="text-sm text-gray-500 mb-2">Select timeframe:</p>

                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 w-full md:w-auto"
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
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="border border-gray-300 rounded px-3 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-0 mt-2 md:ml-2 md:mt-0 w-full md:w-auto"
                        >
                            {rawPieData.map((m) => (
                                <option key={m.month} value={m.month}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {(timeframe === "quarterly" || timeframe === "semiannual") && (
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                            className="border border-gray-300 rounded px-3 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-0 mt-2 md:ml-2 md:mt-0 w-full md:w-auto"
                        >
                            {[1, 2, 3, 4].map((q) => (
                                <option key={q} value={q}>
                                    {timeframe === "semiannual" ? (q <= 2 ? "Jan–Jun" : "Jul–Dec") : `Q${q}`}
                                </option>
                            ))}
                        </select>
                    )}

                    {timeframe === "trimester" && (
                        <select
                            value={selectedTrimester}
                            onChange={(e) => setSelectedTrimester(parseInt(e.target.value))}
                            className="border border-gray-300 rounded px-3 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-0 mt-2 md:ml-2 md:mt-0 w-full md:w-auto"
                        >
                            {[1, 2, 3].map(t => (
                                <option key={t} value={t}>{`Trimester ${t}`}</option>
                            ))}
                        </select>
                    )}
                </div>

                <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                        <Tooltip formatter={(value) => `${value}`} />
                        <Pie
                            data={pieChartWithPercent}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ x, y, name, percent }) => (
                                <text
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={12}
                                    fontWeight={350}
                                    fill="#232F3E"
                                >
                                    {name}: {percent}%
                                </text>
                            )}
                            labelLine={false}
                            isAnimationActive
                            animationDuration={800}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
