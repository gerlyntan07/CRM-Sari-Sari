import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ActivityCalendar from "../components/ActivityCalendar.jsx";

export default function SalesCalendar() {
  const { user, loading: userLoading } = useFetchUser();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    document.title = "Calendar | Sari-Sari CRM";
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [taskRes, meetingRes, callRes] = await Promise.all([
        api.get("/tasks/all"),
        api.get("/meetings/admin/fetch-all"),
        api.get("/calls/admin/fetch-all"),
      ]);

      // Keep behavior aligned with existing Sales pages (no extra client-side filtering).
      setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
      setMeetings(Array.isArray(meetingRes.data) ? meetingRes.data : []);
      setCalls(Array.isArray(callRes.data) ? callRes.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) fetchAll();
  }, [userLoading, user]);

  const calendarData = useMemo(() => ({ tasks, meetings, calls }), [tasks, meetings, calls]);

  return (
    <div className="min-h-screen">
      {(loading || userLoading) && <LoadingSpinner message="Loading calendar..." />}
      <ActivityCalendar basePath="/sales" currentUserId={user?.id} {...calendarData} />
    </div>
  );
}
