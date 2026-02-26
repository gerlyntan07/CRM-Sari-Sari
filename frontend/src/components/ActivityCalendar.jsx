import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad2 = (n) => String(n).padStart(2, "0");

const toDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1);

const formatMonthLabel = (date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatDayLabel = (dateKey) => {
  if (!dateKey) return "";
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

function Dot({ className, title, count }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-1" title={title}>
      <span className={`inline-block h-2 w-2 rounded-full ${className}`} />
      {count > 1 && <span className="text-[10px] text-gray-500">{count}</span>}
    </div>
  );
}

function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const month = first.getMonth();
  const firstDayIndex = first.getDay(); // 0..6 Sun..Sat
  const daysInMonth = new Date(first.getFullYear(), month + 1, 0).getDate();

  const cells = [];

  // leading blanks
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ type: "blank", key: `blank-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(first.getFullYear(), month, day);
    const dateKey = `${cellDate.getFullYear()}-${pad2(cellDate.getMonth() + 1)}-${pad2(cellDate.getDate())}`;
    cells.push({
      type: "day",
      key: dateKey,
      day,
      dateKey,
      date: cellDate,
    });
  }

  // trailing blanks so total is a multiple of 7
  while (cells.length % 7 !== 0) {
    cells.push({ type: "blank", key: `blank-tail-${cells.length}` });
  }

  return cells;
}

export default function ActivityCalendar({
  basePath = "",
  tasks = [],
  meetings = [],
  calls = [],
  currentUserId,
}) {
  const navigate = useNavigate();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const groups = useMemo(() => {
    const taskByDay = new Map();
    const meetingByDay = new Map();
    const callByDay = new Map();

    for (const t of tasks) {
      const k = toDateKey(t?.due_date ?? t?.dueDate);
      if (!k) continue;
      const arr = taskByDay.get(k) ?? [];
      arr.push(t);
      taskByDay.set(k, arr);
    }

    for (const m of meetings) {
      const k = toDateKey(m?.start_time ?? m?.startTime);
      if (!k) continue;
      const arr = meetingByDay.get(k) ?? [];
      arr.push(m);
      meetingByDay.set(k, arr);
    }

    for (const c of calls) {
      const k = toDateKey(c?.call_time ?? c?.callTime);
      if (!k) continue;
      const arr = callByDay.get(k) ?? [];
      arr.push(c);
      callByDay.set(k, arr);
    }

    return { taskByDay, meetingByDay, callByDay };
  }, [tasks, meetings, calls]);

  const monthCells = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  const selectedItems = useMemo(() => {
    if (!selectedDateKey) return { tasks: [], meetings: [], calls: [] };

    const dayTasks = groups.taskByDay.get(selectedDateKey) ?? [];
    const dayMeetings = groups.meetingByDay.get(selectedDateKey) ?? [];
    const dayCalls = groups.callByDay.get(selectedDateKey) ?? [];

    const meetingSorted = [...dayMeetings].sort((a, b) => {
      const aStart = a?.start_time ?? a?.startTime;
      const bStart = b?.start_time ?? b?.startTime;
      const aT = aStart ? new Date(aStart).getTime() : 0;
      const bT = bStart ? new Date(bStart).getTime() : 0;
      return aT - bT;
    });

    const callSorted = [...dayCalls].sort((a, b) => {
      const aCall = a?.call_time ?? a?.callTime;
      const bCall = b?.call_time ?? b?.callTime;
      const aT = aCall ? new Date(aCall).getTime() : 0;
      const bT = bCall ? new Date(bCall).getTime() : 0;
      return aT - bT;
    });

    const taskSorted = [...dayTasks].sort((a, b) => {
      const aDue = a?.due_date ?? a?.dueDate;
      const bDue = b?.due_date ?? b?.dueDate;
      const aT = aDue ? new Date(aDue).getTime() : 0;
      const bT = bDue ? new Date(bDue).getTime() : 0;
      return aT - bT;
    });

    return { tasks: taskSorted, meetings: meetingSorted, calls: callSorted };
  }, [selectedDateKey, groups]);

  const goToday = () => {
    const now = new Date();
    setMonthDate(startOfMonth(now));
    setSelectedDateKey(toDateKey(now));
  };

  const roleBase = useMemo(() => {
    if (!basePath) return "";
    const trimmed = String(basePath).trim();
    if (!trimmed) return "";
    const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
  }, [basePath]);

  const navTo = (path, state) => navigate(`${roleBase}${path}`, { state });

  const getSelectedDateKey = () => selectedDateKey || todayKey;

  const handleCreateTask = () => {
    const dateKey = getSelectedDateKey();
    navTo("/tasks", {
      openTaskModal: true,
      initialTaskData: {
        ...(dateKey ? { dueDate: dateKey } : null),
        ...(currentUserId ? { assignedTo: String(currentUserId) } : null),
      },
    });
  };

  const handleCreateMeeting = () => {
    const dateKey = getSelectedDateKey();
    const startTime = dateKey ? `${dateKey}T09:00` : "";
    const endTime = dateKey ? `${dateKey}T10:00` : "";
    navTo("/meetings", {
      openMeetingModal: true,
      initialMeetingData: { startTime, endTime },
    });
  };

  const handleCreateCall = () => {
    const dateKey = getSelectedDateKey();
    const call_time = dateKey ? `${dateKey}T08:00` : "";
    navTo("/calls", {
      openCallModal: true,
      initialCallData: { call_time },
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthDate((d) => addMonths(d, -1))}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonthDate((d) => addMonths(d, 1))}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Next
          </button>
          <h2 className="ml-2 text-lg sm:text-xl font-semibold text-gray-800">
            {formatMonthLabel(monthDate)}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            <span>Tasks (Due date)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span>Meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <span>Calls</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="px-3 py-2 text-xs font-semibold text-gray-600"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthCells.map((cell) => {
                if (cell.type === "blank") {
                  return (
                    <div
                      key={cell.key}
                      className="h-24 border-b border-r border-gray-100 bg-white"
                    />
                  );
                }

                const taskCount = groups.taskByDay.get(cell.dateKey)?.length ?? 0;
                const meetingCount =
                  groups.meetingByDay.get(cell.dateKey)?.length ?? 0;
                const callCount = groups.callByDay.get(cell.dateKey)?.length ?? 0;

                const isSelected = cell.dateKey === selectedDateKey;
                const isToday = cell.dateKey === todayKey;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className={`h-24 w-full text-left px-2 py-2 border-b border-r border-gray-100 bg-white hover:bg-gray-50 transition cursor-pointer ${
                      isSelected ? "ring-2 ring-indigo-500 ring-inset" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          isToday ? "text-indigo-700" : "text-gray-700"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      <Dot
                        className="bg-red-500"
                        title="Tasks due"
                        count={taskCount}
                      />
                      <Dot
                        className="bg-green-500"
                        title="Meetings"
                        count={meetingCount}
                      />
                      <Dot
                        className="bg-blue-500"
                        title="Calls"
                        count={callCount}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-gray-800">{formatDayLabel(selectedDateKey)}</h3>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCreateTask}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 flex flex-row cursor-pointer"
              >
                <IoIosAdd /> Task
              </button>
              <button
                type="button"
                onClick={handleCreateMeeting}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 flex flex-row cursor-pointer"
              >
                <IoIosAdd /> Meeting
              </button>
              <button
                type="button"
                onClick={handleCreateCall}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 flex flex-row cursor-pointer"
              >
                <IoIosAdd /> Call
              </button>
            </div>
          </div>

          {(selectedItems.tasks.length +
            selectedItems.meetings.length +
            selectedItems.calls.length) === 0 && (
            <div className="mb-3">
              <span className="text-xs text-gray-500">No activity</span>
            </div>
          )}

          <div className="space-y-3">
            {selectedItems.tasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  <span>Tasks</span>
                </div>
                <div className="space-y-1">
                  {selectedItems.tasks.map((t) => (
                    <button
                      key={`task-${t.id}`}
                      type="button"
                      onClick={() => navTo("/tasks", { taskID: t.id })}
                      className="w-full text-left text-sm text-gray-700 flex items-start justify-between gap-3 rounded-lg px-2 py-1 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="truncate">{t?.title ?? t?.subject ?? "(Untitled task)"}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {t?.due_date || t?.dueDate
                          ? new Date(t?.due_date ?? t?.dueDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedItems.meetings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  <span>Meetings</span>
                </div>
                <div className="space-y-1">
                  {selectedItems.meetings.map((m) => {
                    const startValue = m?.start_time ?? m?.startTime;
                    const endValue = m?.end_time ?? m?.endTime;
                    const start = startValue ? new Date(startValue) : null;
                    const end = endValue ? new Date(endValue) : null;
                    const time = start
                      ? `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${end ? `–${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`
                      : "";
                    return (
                      <button
                        key={`meeting-${m.id}`}
                        type="button"
                        onClick={() => navTo("/meetings", { meetingID: m.id })}
                        className="w-full text-left text-sm text-gray-700 flex items-start justify-between gap-3 rounded-lg px-2 py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="truncate">{m?.subject ?? m?.title ?? "(Untitled meeting)"}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedItems.calls.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                  <span>Calls</span>
                </div>
                <div className="space-y-1">
                  {selectedItems.calls.map((c) => {
                    const callValue = c?.call_time ?? c?.callTime;
                    const callTime = callValue ? new Date(callValue) : null;
                    const time = callTime
                      ? callTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "";
                    return (
                      <button
                        key={`call-${c.id}`}
                        type="button"
                        onClick={() => navTo("/calls", { callID: c.id })}
                        className="w-full text-left text-sm text-gray-700 flex items-start justify-between gap-3 rounded-lg px-2 py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="truncate">{c?.subject ?? c?.title ?? "(Untitled call)"}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
