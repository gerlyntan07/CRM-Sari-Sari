import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import api from "../api";

const CreateMeetingModal = ({
  onClose,
  formData: externalFormData,
  setFormData: setExternalFormData,
  isEditing = false,
  onSubmit,
  isSubmitting = false,
  users = [],
}) => {
  // Internal state if external is not provided
  const [internalFormData, setInternalFormData] = useState({
    subject: "",
    startTime: "",
    endTime: "",
    location: "",
    status: "PLANNED",
    notes: "",
    assignedTo: "",
    relatedType1: "Lead",
    relatedTo1: "",
    relatedType2: "Contact",
    relatedTo2: "",
  });

  // State for dynamic dropdown options
  const [relatedTo1Values, setRelatedTo1Values] = useState([]);
  const [relatedTo2Values, setRelatedTo2Values] = useState([]);

  const formData = externalFormData !== undefined ? externalFormData : internalFormData;
  const setFormData = setExternalFormData || setInternalFormData;

  // --- EFFECT 1: Fetch Level 1 Options (Leads or Accounts) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setRelatedTo1Values([]); // Clear options while loading

        let res;
        if (formData.relatedType1 === 'Lead') {
          res = await api.get(`/leads/admin/getLeads`);
        } else if (formData.relatedType1 === 'Account') {
          res = await api.get(`/accounts/admin/fetch-all`);
        }

        if (res && Array.isArray(res.data)) {
          setRelatedTo1Values(res.data);
        } else {
          setRelatedTo1Values([]);
        }
      } catch (error) {
        console.error("Error fetching relatedTo1 data:", error);
        setRelatedTo1Values([]);
      }
    };

    if (formData.relatedType1) {
      fetchData();
    }
  }, [formData.relatedType1]);

  // --- EFFECT 2: Fetch Level 2 Options (Contacts or Deals FROM Account) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setRelatedTo2Values([]); // Clear options while loading

        // Only fetch if we have an Account selected
        if (formData.relatedType1 === 'Account' && formData.relatedTo1) {
          let res;
          if (formData.relatedType2 === 'Contact') {
            res = await api.get(`/contacts/from-acc/${formData.relatedTo1}`);
          } else if (formData.relatedType2 === 'Deal') {
            res = await api.get(`/deals/from-acc/${formData.relatedTo1}`);
          }

          if (res && Array.isArray(res.data)) {
            setRelatedTo2Values(res.data);
          } else {
            setRelatedTo2Values([]);
          }
        } else {
          setRelatedTo2Values([]);
        }
      } catch (error) {
        console.error("Error fetching relatedTo2 data:", error);
        setRelatedTo2Values([]);
      }
    };

    // Fetch when the Account ID changes OR the sub-type (Contact/Deal) changes
    if (formData.relatedType2) {
      fetchData();
    }
  }, [formData.relatedType2, formData.relatedTo1, formData.relatedType1]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Logic: Reset dependent fields when parent changes
      if (name === "relatedType1") {
        updated.relatedTo1 = ""; // Clear selection
        if (value === "Lead") {
          updated.relatedType2 = null;
          updated.relatedTo2 = null;
          setRelatedTo2Values([]);
        } else if (value === "Account") {
          updated.relatedType2 = "Contact"; // Default to Contact
          updated.relatedTo2 = "";
        }
      }

      if (name === "relatedType2") {
        updated.relatedTo2 = ""; // Clear sub-selection
      }

      // Sync the old "relatedTo" / "relatedType" format for backward compatibility if needed
      if (name === "relatedTo1") {
         updated.relatedTo = value;
         updated.relatedType = updated.relatedType1;
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log("Meeting Scheduled:", formData);
      onClose();
    }
  };

  return (
    <div
      id="modalBackdrop"
      onClick={(e) => e.target.id === "modalBackdrop" && onClose()}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
        >
          <FiX size={22} />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
          {isEditing ? "Edit Meeting" : "Schedule Meeting"}
        </h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" onSubmit={handleSubmit}>
          
          <InputField
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g. Meeting with Client"
            required
            disabled={isSubmitting}
            className="md:col-span-2"
          />

          {/* --- RELATED TO SECTION (Refactored to match AdminCalls) --- */}
          <div className="w-full flex flex-col">
            <label className="block text-gray-700 font-medium mb-1 text-sm">Related To</label>
            <select
              name="relatedType1"
              onChange={handleInputChange}
              value={formData.relatedType1 || "Lead"}
              className="outline-none cursor-pointer mb-1 w-full border border-gray-300 rounded p-1 text-gray-700 disabled:bg-gray-100"
              disabled={isSubmitting}
            >
              <option value="Lead">Lead</option>
              <option value="Account">Account</option>
            </select>

            {Array.isArray(relatedTo1Values) && relatedTo1Values.length > 0 ? (
              <select
                name="relatedTo1"
                onChange={handleInputChange}
                value={formData.relatedTo1 || ""}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                disabled={isSubmitting}
              >
                <option value="">-- Select {formData.relatedType1} --</option>
                {relatedTo1Values.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formData.relatedType1 === 'Lead' ? item.title : item.name}
                  </option>
                ))}
              </select>
            ) : (
               <div className="text-gray-400 text-xs mt-1 border border-gray-200 rounded p-2 bg-gray-50">
                  {formData.relatedType1 ? `Loading ${formData.relatedType1}s...` : 'Select a type'}
               </div>
            )}
          </div>

          <div className="w-full flex flex-col">
            <label className="block text-gray-700 font-medium mb-1 text-sm">Associated With (Optional)</label>
            <select
              name="relatedType2"
              onChange={handleInputChange}
              value={formData.relatedType2 || "Contact"}
              className="outline-none cursor-pointer mb-1 w-full border border-gray-300 rounded p-1 text-gray-700 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isSubmitting || formData.relatedType1 === 'Lead'}
            >
              <option value="Contact">Contact</option>
              <option value="Deal">Deal</option>
            </select>

            {Array.isArray(relatedTo2Values) && relatedTo2Values.length > 0 ? (
              <select
                name="relatedTo2"
                onChange={handleInputChange}
                value={formData.relatedTo2 || ""}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
                disabled={isSubmitting || formData.relatedType1 === 'Lead'}
              >
                <option value="">-- Select {formData.relatedType2} --</option>
                {relatedTo2Values.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formData.relatedType2 === 'Contact' 
                      ? `${item.first_name} ${item.last_name}` 
                      : item.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.relatedType1 === 'Lead' ? 'Not applicable for Leads' : `No ${formData.relatedType2 || ''}s found for this Account`}
                disabled
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-gray-100 text-gray-500"
              />
            )}
          </div>
          {/* -------------------------------------------------------- */}

          <InputField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
          
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <InputField
                label="Start Time"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
            />
            <InputField
                label="End Time"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
            />
          </div>

          <SelectField
            label="Assigned To"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select assignee" },
              ...users.map((user) => ({
                value: String(user.id),
                label: `${user.first_name} ${user.last_name}`,
              })),
            ]}
            required={!isEditing}
            disabled={isSubmitting || users.length === 0}
          />

          <SelectField
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={["PLANNED", "HELD", "NOT_HELD"].map((opt) => ({ value: opt, label: opt.replace('_', ' ') }))}
            disabled={isSubmitting}
          />

          <TextareaField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="md:col-span-2"
            disabled={isSubmitting}
          />

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 md:col-span-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition disabled:opacity-70"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Meeting"
                : "Save Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ... InputField, SelectField, TextareaField (Same as before) ...
function InputField({ label, name, value, onChange, placeholder, type = "text", required = false, disabled = false, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label}</label>
      <input type={type} name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100" />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required = false, disabled = false, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label}</label>
      <select name={name} value={value ?? ""} onChange={onChange} required={required} disabled={disabled} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, name, value, onChange, placeholder, required = false, disabled = false, className = "", rows = 3 }) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label}</label>
      <textarea name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} rows={rows} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 resize-none" />
    </div>
  );
}

export default CreateMeetingModal;