import React, { useState, useEffect } from "react";
import { FiPhone, FiMail, FiCalendar, FiFileText, FiCheckSquare } from "react-icons/fi";
import api from '../api';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


export default function AdminDealsQuickAction({ selectedDeal, onStatusUpdate, onClose }) {
  const [selectedStage, setSelectedStage] = useState(selectedDeal?.stage || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();


  // Stage options matching the format used in AdminDeals.jsx
  const stageOptions = [
    { value: "PROSPECTING", label: "Prospecting" },
    { value: "QUALIFICATION", label: "Qualification" },
    { value: "PROPOSAL", label: "Proposal" },
    { value: "NEGOTIATION", label: "Negotiation" },
    { value: "CLOSED_WON", label: "Closed Won" },
    { value: "CLOSED_LOST", label: "Closed Lost" },
    { value: "CLOSED_CANCELLED", label: "Closed Cancelled" },


  ];

  // Update selectedStage when selectedDeal changes
  useEffect(() => {
    if (selectedDeal?.stage) {
      setSelectedStage(selectedDeal.stage);
    }
  }, [selectedDeal]);

  const handleUpdateStatus = async () => {
    if (!selectedDeal || !selectedDeal.id) {
      toast.error("No deal selected");
      return;
    }

    if (!selectedStage || selectedStage === selectedDeal.stage) {
      toast.info("Please select a different stage");
      return;
    }

    const dealId = selectedDeal.id;
    setIsUpdating(true);
    try {
      await api.put(`/deals/admin/${dealId}`, {
        stage: selectedStage,
      });

      // Close the modal first (like other admin pages)
      if (onClose) {
        onClose();
      }

      // Call the callback to refresh the deal data (after modal closes)
      // Pass true to keepModalClosed to prevent reopening the modal
      if (onStatusUpdate) {
        // Use setTimeout to ensure modal closes first
        setTimeout(async () => {
          await onStatusUpdate(true);
        }, 100);
      }

      // Then show success toast after modal closes
      setTimeout(() => {
        toast.success("Deal status updated successfully");
      }, 300);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.detail || "Failed to update deal status";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!selectedDeal) {
    return null;
  }

  return (
    <div className="space-y-4 font-inter text-[13px] w-full sm:w-[85%] mx-auto flex flex-col gap-4">
      {/* QUICK ACTIONS */}
      <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">
          Quick Actions
        </h4>

        <div className="flex flex-col gap-2 w-full">

          {/* --- SCHEDULE CALL BUTTON (updated) --- */}
          <button
            onClick={() => {
              // Check if account data exists to avoid errors
              const accountId = selectedDeal.account?.id || selectedDeal.account_id;

              navigate("/admin/calls", {
                state: {
                  openCallModal: true,
                  initialCallData: {
                    // 1. Pre-fill the Subject
                    subject: selectedDeal.title ? `Call regarding: ${selectedDeal.title}` : "",
                    relatedType1: "Account",
                    relatedTo1: accountId,
                    relatedType2: "Deal",
                    relatedTo2: selectedDeal.id,
                    contactId: selectedDeal.contact?.id
                  },
                },
              });
            }}
            className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
          >
            <FiPhone className="text-gray-600 w-4 h-4" />
            Schedule Call
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedDeal.contact?.email) {
                alert("No email address available");
                return;
              }

              const to = encodeURIComponent(selectedDeal.contact.email);
              const subject = encodeURIComponent("");
              const body = encodeURIComponent("");

              const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

              // Opens user's default email client
              window.location.href = mailtoUrl;
            }}
            className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
          >
            <FiMail className="text-gray-600 w-4 h-4" />
            Send E-mail
          </button>



          <button
            className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
            onClick={() => {
              // 1. Get the Account ID safely
              const accountId = selectedDeal.account?.id || selectedDeal.account_id;

              navigate("/admin/meetings", {
                state: {
                  openMeetingModal: true,
                  initialMeetingData: {
                    // 2. Pre-fill the Title/Subject
                    title: selectedDeal.title ? `Meeting: ${selectedDeal.title}` : "",

                    // 3. Set Parent (Account) - Use "relatedType1" if your Meetings form matches the Calls form structure
                    relatedType1: "Account",
                    relatedTo1: accountId,

                    // 4. Set Child (Deal)
                    relatedType2: "Deal",
                    relatedTo2: selectedDeal.id,
                  },
                },
              });
            }}
          >
            <FiCalendar className="text-gray-600 w-4 h-4" />
            Book Meeting
          </button>

          <button
            onClick={() => {
              // 1. Get the Account ID safely
              const accountId = selectedDeal.account?.id || selectedDeal.account_id;

              navigate("/admin/tasks", {
                state: {
                  openTaskModal: true,
                  initialTaskData: {
                    // 2. Pre-fill the Task Title
                    title: selectedDeal.title ? `Task for: ${selectedDeal.title}` : "",

                    // 3. Set Parent (Account)
                    relatedType1: "Account",
                    relatedTo1: accountId,

                    // 4. Set Child (Deal)
                    relatedType2: "Deal",
                    relatedTo2: selectedDeal.id,

                    // 5. Link Contact (Optional)
                    contactId: selectedDeal.contact?.id
                  },
                },
              });
            }}
            className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
          >
            <FiCheckSquare className="text-gray-600 w-4 h-4" />
            Tasks
          </button>
        </div>
      </div>

      {/* Promote Deal */}
      <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">
          Promote Deal
        </h4>
        <select
          className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          disabled={isUpdating}
        >
          {stageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className="w-full bg-gray-900 text-white py-1.5 rounded-md text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpdateStatus}
          disabled={isUpdating || !selectedStage || selectedStage === selectedDeal.stage}
        >
          {isUpdating ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
}
