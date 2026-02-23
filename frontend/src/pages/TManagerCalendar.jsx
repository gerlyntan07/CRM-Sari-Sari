import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ActivityCalendar from "../components/ActivityCalendar.jsx";

export default function TManagerCalendar() {
  const { user, loading: userLoading } = useFetchUser();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    document.title = "Calendar | Sari-Sari CRM";
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [taskRes, meetingRes, callRes] = await Promise.all([
        api.get("/tasks/all"),
        api.get("/meetings/admin/fetch-all"),
        api.get("/calls/admin/fetch-all"),
      ]);

      const rawTasks = Array.isArray(taskRes.data) ? taskRes.data : [];
      const rawMeetings = Array.isArray(meetingRes.data) ? meetingRes.data : [];
      const rawCalls = Array.isArray(callRes.data) ? callRes.data : [];

      // Mirror existing Group Manager meetings logic:
      // - GROUP MANAGER/CEO/ADMIN: see all meetings
      // - Filter out INACTIVE for non-admin roles (includes GROUP MANAGER)
      const role = user?.role?.toUpperCase();
      const isAdminLike = role === "GROUP MANAGER" || role === "CEO" || role === "ADMIN";
      const userOwnedMeetings = isAdminLike
        ? rawMeetings
        : rawMeetings.filter(
            (m) => m?.created_by === user?.id || m?.meet_assign_to?.id === user?.id,
          );

      const nonAdminRoles = ["GROUP MANAGER", "MANAGER", "SALES"];
      const userIsNonAdmin = nonAdminRoles.includes(role);

      const visibleMeetings = userIsNonAdmin
        ? userOwnedMeetings.filter((m) => m?.status?.toUpperCase() !== "INACTIVE")
        : userOwnedMeetings;

      const visibleCalls = userIsNonAdmin
        ? rawCalls.filter((c) => c?.status !== "INACTIVE")
        : rawCalls;

      setTasks(rawTasks);
      setMeetings(visibleMeetings);
      setCalls(visibleCalls);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!userLoading && user) fetchAll();
  }, [userLoading, user, fetchAll]);

  const calendarData = useMemo(() => ({ tasks, meetings, calls }), [tasks, meetings, calls]);

  return (
    <div className="min-h-screen">
      {(loading || userLoading) && <LoadingSpinner message="Loading calendar..." />}
      <ActivityCalendar basePath="/group-manager" {...calendarData} />
    </div>
  );
}
