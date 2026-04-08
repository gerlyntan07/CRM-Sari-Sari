import React, { useEffect, useMemo, useState } from 'react';
import { FiVolume2, FiSave, FiTrash2, FiType, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

const MAX_ANNOUNCEMENT_LENGTH = 300;

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

  useEffect(() => {
    document.title = 'Announcements | Sari-Sari CRM';

    const loadAnnouncement = async () => {
      try {
        const res = await api.get('/announcements/super-admin/latest');
        const data = res?.data || {};
        const latestMessage = data.message || '';
        const latestStartsAt = data.starts_at ? toInputDateTimeValue(data.starts_at) : '';
        const latestEndsAt = data.ends_at ? toInputDateTimeValue(data.ends_at) : '';

        setMessage(latestMessage);
        setSavedMessage(latestMessage);
        setStartsAt(latestStartsAt);
        setSavedStartsAt(latestStartsAt);
        setEndsAt(latestEndsAt);
        setSavedEndsAt(latestEndsAt);
      } catch (error) {
        console.error('Failed to load latest announcement:', error);
      }
    };

    loadAnnouncement();
  }, []);

  const hasChanges = useMemo(() => {
    return (
      message.trim() !== savedMessage.trim() ||
      startsAt !== savedStartsAt ||
      endsAt !== savedEndsAt
    );
  }, [message, savedMessage, startsAt, savedStartsAt, endsAt, savedEndsAt]);

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
        starts_at: startsAtIso,
        ends_at: endsAtIso,
      });

      const saved = res?.data?.announcement || {};
      const savedStarts = saved.starts_at ? toInputDateTimeValue(saved.starts_at) : startsAt;
      const savedEnds = saved.ends_at ? toInputDateTimeValue(saved.ends_at) : '';

      setMessage(trimmed);
      setSavedMessage(trimmed);
      setStartsAt(savedStarts);
      setSavedStartsAt(savedStarts);
      setEndsAt(savedEnds);
      setSavedEndsAt(savedEnds);

      toast.success('Announcement scheduled and published successfully.');
    } catch (error) {
      console.error('Failed to publish announcement:', error);
      const detail = error.response?.data?.detail || 'Failed to publish announcement.';
      toast.error(detail);
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/announcements/super-admin/current');
      setMessage('');
      setSavedMessage('');
      setStartsAt('');
      setSavedStartsAt('');
      setEndsAt('');
      setSavedEndsAt('');
      toast.success('Announcement cleared.');
    } catch (error) {
      console.error('Failed to clear announcement:', error);
      const detail = error.response?.data?.detail || 'Failed to clear announcement.';
      toast.error(detail);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FiVolume2 className="text-blue-600" />
                Announcements
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Set message, post time, and end time for the dashboard moving announcement.
              </p>
            </div>
            <div className="text-xs sm:text-sm px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
              Time-based ticker enabled
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
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
          </div>

          <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
            <span className={`${remainingChars < 25 ? 'text-red-600' : 'text-gray-500'}`}>
              {remainingChars} characters left
            </span>
            {hasChanges && <span className="text-amber-600 font-medium">Unsaved changes</span>}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={!message.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              <FiSave />
              Publish Announcement
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 font-medium border border-red-200 hover:bg-red-100 transition"
            >
              <FiTrash2 />
              Clear Announcement
            </button>
          </div>

            <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-500">Live Preview</p>
              <p className="text-sm text-gray-800">{message.trim() || 'Type an announcement message to preview it here.'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Current Scheduled Announcement</p>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 min-h-24 space-y-2">
              {savedMessage ? (
                <>
                  <p className="text-sm text-gray-800">{savedMessage}</p>
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
