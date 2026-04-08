import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiCreditCard, FiRefreshCw, FiXCircle, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";

const PRICES = {
  Free: { monthly: 0, annual: 0 },
  Starter: { monthly: 199, annual: 159 },
  Pro: { monthly: 399, annual: 319 },
  Enterprise: { monthly: 799, annual: 639 },
};

export default function AdminSubscription() {
  const { user, mutate } = useFetchUser();
  const [selectedPlan, setSelectedPlan] = useState("Starter");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const subscription = user?.subscription_status || {};

  const currentPlan = subscription.current_plan || "Free";
  const currentStatus = subscription.current_status || "Active";
  const isTrial = Boolean(subscription.is_trial);
  const trialEndsAt = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleString()
    : null;

  const computedPrice = useMemo(() => {
    const plan = PRICES[selectedPlan];
    if (!plan) return 0;
    return billingCycle === "annual" ? plan.annual : plan.monthly;
  }, [selectedPlan, billingCycle]);

  const handleUpgrade = async () => {
    if (!user?.company?.id) {
      toast.error("No company found for current user.");
      return;
    }

    if (selectedPlan === "Free") {
      setShowCancelModal(true);
      return;
    }

    setLoadingUpgrade(true);
    try {
      await api.post("/subscription/subscribe", {
        company_id: user.company.id,
        plan_name: selectedPlan,
        price: computedPrice,
        status: "Active",
      });

      await mutate();
      toast.success(`Subscription updated to ${selectedPlan} (${billingCycle}).`);
    } catch (error) {
      const detail = error?.response?.data?.detail || "Failed to update subscription.";
      toast.error(detail);
    } finally {
      setLoadingUpgrade(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelModal(false);
    setLoadingCancel(true);
    try {
      await api.post("/subscription/cancel");
      await mutate();
      toast.success("Subscription cancelled. Organization moved to Free tier.");
    } catch (error) {
      const detail = error?.response?.data?.detail || "Failed to cancel subscription.";
      toast.error(detail);
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 font-inter space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Subscription</h1>
        <p className="text-gray-600 text-sm">View your current plan and manage upgrades or cancellation.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Subscription</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Current Tier</p>
            <p className="text-lg font-semibold text-gray-800">{currentPlan}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Subscription Status</p>
            <p className="text-lg font-semibold text-gray-800">{currentStatus}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Trial</p>
            <p className={`text-lg font-semibold ${isTrial ? "text-blue-700" : "text-gray-800"}`}>
              {isTrial ? "Yes (Free Trial)" : "No"}
            </p>
          </div>
        </div>

        {isTrial && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p>
              Trial days remaining: <span className="font-semibold">{subscription.trial_days_remaining ?? "-"}</span>
            </p>
            {trialEndsAt && <p className="mt-1">Trial ends at: <span className="font-semibold">{trialEndsAt}</span></p>}
          </div>
        )}

        {subscription.message && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {subscription.message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Upgrade or Change Plan</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="Free">Free</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual (effective per user/mo)</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Selected plan price: <span className="font-semibold">₱{computedPrice}</span> per user / month.
        </div>

        {selectedPlan === "Free" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
            <FiAlertCircle className="mt-0.5" />
            <div>
              Choosing Free will cancel your paid plan and move your organization to Free tier limits.
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleUpgrade}
            disabled={loadingUpgrade || loadingCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <FiCreditCard />
            {loadingUpgrade ? "Updating..." : selectedPlan === "Free" ? "Move to Free" : "Apply Plan"}
          </button>

          <button
            onClick={handleCancel}
            disabled={loadingUpgrade || loadingCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
          >
            <FiXCircle />
            {loadingCancel ? "Cancelling..." : "Cancel Subscription"}
          </button>

          <button
            onClick={() => mutate()}
            disabled={loadingUpgrade || loadingCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw /> Refresh Status
          </button>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 flex items-start gap-2">
          <FiAlertCircle className="mt-0.5" />
          <div>
            Need help deciding? Compare plans on the
            <Link to="/pricing" className="ml-1 underline font-medium">Pricing page</Link>.
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Plan Change</h3>
            <p className="text-sm text-gray-600 mb-5">
              This will cancel your current subscription and switch your organization to the Free tier immediately.
              Do you want to continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={loadingCancel}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Current Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={loadingCancel}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loadingCancel ? "Switching..." : "Yes, Switch to Free"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
