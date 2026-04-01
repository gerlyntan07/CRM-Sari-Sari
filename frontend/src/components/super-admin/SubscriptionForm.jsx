
import React, { useState, useEffect } from "react";
import api from "../../api";
import { toast } from "react-toastify";
import { Crown } from "lucide-react";

export default function SubscriptionForm({ onClose, onSuccess, editMode = false, initialData = null }) {
  const [formData, setFormData] = useState({
    plan_name: "",
    status: "Active",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (editMode && initialData) {
      setFormData({ ...initialData });
    }
  }, [editMode, initialData]);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode && initialData && initialData.id) {
        await api.put(`/admin/subscriptions/${initialData.id}`, formData);
        toast.success("Subscription updated successfully!");
      } else {
        await api.post("/admin/subscriptions", formData);
        toast.success("Subscription added successfully!");
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || (editMode ? "Failed to update subscription" : "Failed to add subscription"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editMode ? 'Edit Subscription' : 'Add Subscription'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {editMode ? 'Update subscription details.' : 'Create a new subscription.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-full p-1 w-10 h-10 flex items-center justify-center"
          >
            <span style={{fontSize: 24, lineHeight: 1}}>×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SUBSCRIPTION CARD */}
          <div className="bg-gradient-to-br from-amber-50/50 to-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Crown size={24} className="text-amber-600" />
              <h3 className="font-bold text-gray-900 text-lg">
                Subscription Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  name="plan_name"
                  value={formData.plan_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Basic, Premium"
                  className="w-full rounded-lg border border-gray-300/50 px-4 py-2.5 text-sm bg-white/50 backdrop-blur-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition duration-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300/50 px-4 py-2.5 text-sm bg-white/50 backdrop-blur-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition duration-200"
                >
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300/50 px-4 py-2.5 text-sm bg-white/50 backdrop-blur-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition duration-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300/50 px-4 py-2.5 text-sm bg-white/50 backdrop-blur-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition duration-200"
                />
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold border border-blue-600 shadow transition duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (editMode ? 'Saving...' : 'Adding...') : (editMode ? 'Save Changes' : 'Add Subscription')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
