import React, { useEffect, useMemo, useState } from 'react';
import { FiVolume2, FiSave, FiTrash2, FiType, FiClock, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

const MAX_ANNOUNCEMENT_LENGTH = 300;
const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'SALES', label: 'Sales' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'GROUP_MANAGER', label: 'Team Manager' },
  { value: 'CEO', label: 'Admin' },
];

const toInputDateTimeValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function SuperAdminAnnouncements() {
  const [message, setMessage] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [savedStartsAt, setSavedStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [savedEndsAt, setSavedEndsAt] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [savedTargetRole, setSavedTargetRole] = useState('ALL');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = 'Announcements | Forekas';
  }, []);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const res = await api.get('/announcements/super-admin/latest', {
          params: { target_role: targetRole },
        });
        const data = res?.data || {};
        const latestMessage = data.message || '';
        const latestStartsAt = data.starts_at ? toInputDateTimeValue(data.starts_at) : '';
        const latestEndsAt = data.ends_at ? toInputDateTimeValue(data.ends_at) : '';
        const latestRole = data.target_role || targetRole;

        setMessage(latestMessage);
        setSavedMessage(latestMessage);
        setStartsAt(latestStartsAt);
        setSavedStartsAt(latestStartsAt);
        setEndsAt(latestEndsAt);
        setSavedEndsAt(latestEndsAt);
        setSavedTargetRole(latestRole);
      } catch (error) {
        console.error('Failed to load latest announcement:', error);
      }
    };

    loadAnnouncement();
  }, [targetRole, reloadKey]);

  const hasChanges = useMemo(() => {
    return (
      message.trim() !== savedMessage.trim() ||
      targetRole !== savedTargetRole ||
      startsAt !== savedStartsAt ||
      endsAt !== savedEndsAt
    );
  }, [message, savedMessage, targetRole, savedTargetRole, startsAt, savedStartsAt, endsAt, savedEndsAt]);

  const remainingChars = MAX_ANNOUNCEMENT_LENGTH - message.length;

  const handleSave = async () => {
    const trimmed = message.trim();

    if (!trimmed) {
      toast.info('Please enter an announcement message first.');
      return;
    }

    if (!startsAt) {
      toast.info('Please select the post time.');
      return;
    }

    const startsAtIso = new Date(startsAt).toISOString();
    const endsAtIso = endsAt ? new Date(endsAt).toISOString() : null;

    if (endsAtIso && new Date(endsAtIso) <= new Date(startsAtIso)) {
      toast.error('End time must be later than post time.');
      return;
    }

    try {
      const res = await api.post('/announcements/super-admin/publish', {
        message: trimmed,
        target_role: targetRole,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
      });

      const saved = res?.data?.announcement || {};
      const savedStarts = saved.starts_at ? toInputDateTimeValue(saved.starts_at) : startsAt;
      const savedEnds = saved.ends_at ? toInputDateTimeValue(saved.ends_at) : '';
      const savedRole = saved.target_role || targetRole;

      setMessage(trimmed);
      setSavedMessage(trimmed);
      setStartsAt(savedStarts);
      setSavedStartsAt(savedStarts);
      setEndsAt(savedEnds);
      setSavedEndsAt(savedEnds);
      setTargetRole(savedRole);
      setSavedTargetRole(savedRole);

      toast.success('Announcement scheduled and published successfully.');
    } catch (error) {
      console.error('Failed to publish announcement:', error);
      const detail = error.response?.data?.detail || 'Failed to publish announcement.';
      toast.error(detail);
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/announcements/super-admin/current', {
        params: { target_role: targetRole },
      });
      setMessage('');
      setSavedMessage('');
      setStartsAt('');
      setSavedStartsAt('');
      setEndsAt('');
      setSavedEndsAt('');
      setSavedTargetRole(targetRole);
      toast.success('Announcement cleared.');
    } catch (error) {
      console.error('Failed to clear announcement:', error);
      const detail = error.response?.data?.detail || 'Failed to clear announcement.';
      toast.error(detail);
    }
  };

  const refreshCurrentRole = () => {
    setReloadKey((prev) => prev + 1);
    toast.success('Announcement view refreshed.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-inter w-full">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8 relative">
          <button
            onClick={refreshCurrentRole}
            className="absolute top-0 right-0 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition sm:hidden"
            aria-label="Refresh"
          >
            <FiRefreshCw size={20} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
                <FiVolume2 className="mr-2 text-orange-600" />
                Announcements
              </h1>
              <span className="text-gray-600 text-m mt-1 flex items-center">
                Configure role-based announcement ticker schedules
              </span>
            </div>

            <button
              onClick={refreshCurrentRole}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 mb-4">
              <FiVolume2 className="w-3.5 h-3.5" />
              Announcement Composer
            </div>

            <label htmlFor="announcement-input" className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <FiType />
              Announcement Message
            </label>
            <textarea
              id="announcement-input"
              value={message}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= MAX_ANNOUNCEMENT_LENGTH) {
                  setMessage(value);
                }
              }}
              rows={5}
              placeholder="Example: System maintenance tonight at 10:00 PM. Please save your work before 9:45 PM."
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="announcement-ends-at" className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <FiClock />
                  End Time
                </label>
                <input
                  id="announcement-ends-at"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="announcement-starts-at" className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <FiClock />
                  Post Time
                </label>
                <input
                  id="announcement-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="announcement-target-role" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Target Role
                </label>
                <select
                  id="announcement-target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
              <span className={`${remainingChars < 25 ? 'text-red-600' : 'text-gray-500'}`}>
                {remainingChars} characters left
              </span>
              {hasChanges && <span className="text-amber-600 font-medium">Unsaved changes</span>}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={!message.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
              >
                <FiSave /> Publish Announcement
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                <FiTrash2 /> Clear Announcement
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-500">Live Preview</p>
              <p className="text-sm text-gray-800">{message.trim() || 'Type an announcement message to preview it here.'}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-400">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Scheduled Announcement</h2>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 min-h-24 space-y-2">
              {savedMessage ? (
                <>
                  <p className="text-sm text-gray-800">{savedMessage}</p>
                  <p className="text-xs text-gray-500">Target role: {ROLE_OPTIONS.find((role) => role.value === savedTargetRole)?.label || savedTargetRole}</p>
                  {savedStartsAt && <p className="text-xs text-gray-500">Post time: {new Date(savedStartsAt).toLocaleString()}</p>}
                  {savedEndsAt && <p className="text-xs text-gray-500">End time: {new Date(savedEndsAt).toLocaleString()}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-500">No announcement published yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
