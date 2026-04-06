import React from "react";
import useFetchUser from "../hooks/useFetchUser";

export default function SubscriptionBanner() {
  const { user, loading } = useFetchUser();

  if (loading || !user?.subscription_status) {
    return null;
  }

  const status = user.subscription_status;

  if (!status.show_trial_ending_banner && !status.show_downgraded_banner) {
    return null;
  }

  const isDowngraded = !!status.show_downgraded_banner;

  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 shadow-sm ${
        isDowngraded
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-blue-300 bg-blue-50 text-blue-900"
      }`}
    >
      <p className="font-semibold">
        {isDowngraded
          ? "Trial ended: You are now on the Free tier"
          : `Trial ending soon (${status.trial_days_remaining} day(s) left)`}
      </p>
      <p className="text-sm mt-1">{status.message || "Please subscribe to continue paid features."}</p>
    </div>
  );
}
