import React, { useState } from "react";
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
  accounts = [],
  contacts = [],
  leads = [],
  deals = [],
}) => {
  const [internalFormData, setInternalFormData] = useState({
    subject: "",
    startTime: "",
    endTime: "",
    location: "",
    status: "PLANNED",
    notes: "",
    assignedTo: "",
    relatedType: "",
    relatedTo: "",
    relatedType1: "Lead",
    relatedTo1: "",
    relatedType2: "Contact",
    relatedTo2: "",
  });
  const [relatedTo2Values, setRelatedTo2Values] = useState([]);

  const formData =
    externalFormData !== undefined ? externalFormData : internalFormData;
  const setFormData = setExternalFormData || setInternalFormData;
  
  React.useEffect(() => {
    if (!formData) return;
    if (formData.relatedType === "Lead" || formData.relatedType === "Account") {
      setFormData((prev) => ({
        ...prev,
        relatedType1: formData.relatedType || "Lead",
        relatedTo1: formData.relatedTo || "",
      }));
      if (formData.relatedType === "Lead") {
        setFormData((prev) => ({
          ...prev,
          relatedType2: null,
          relatedTo2: "",
        }));
        setRelatedTo2Values([]);
      }
    }
    if (formData.relatedType === "Contact" || formData.relatedType === "Deal") {
      setFormData((prev) => ({
        ...prev,
        relatedType2: formData.relatedType || "Contact",
        relatedTo2: formData.relatedTo || "",
      }));
    }
  }, [formData.relatedType, formData.relatedTo]);
  
  React.useEffect(() => {
    const shouldFetch =
      formData.relatedType1 === "Account" &&
      formData.relatedTo1 &&
      formData.relatedType2 &&
      String(formData.relatedTo1).trim() !== "";
    if (!shouldFetch) {
      setRelatedTo2Values([]);
      return;
    }
    const fetchData = async () => {
      try {
        setRelatedTo2Values([]);
        let res;
        if (formData.relatedType2 === "Contact") {
          res = await api.get(`/contacts/from-acc/${formData.relatedTo1}`);
        } else if (formData.relatedType2 === "Deal") {
          res = await api.get(`/deals/from-acc/${formData.relatedTo1}`);
        }
        if (res && Array.isArray(res.data)) {
          setRelatedTo2Values(res.data);
        } else {
          setRelatedTo2Values([]);
        }
      } catch (error) {
        console.error("Error fetching relatedTo2 values:", error);
        setRelatedTo2Values([]);
      }
    };
    fetchData();
  }, [formData.relatedType2, formData.relatedTo1, formData.relatedType1]);
  
  const getRelatedTo1Options = () => {
    const type = formData.relatedType1 || "Lead";
    if (!type) return [];
    switch (type) {
      case "Lead":
        return leads
          .map((lead) => {
            const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
            const title = lead.title || "";
            return { value: String(lead.id), label: title || fullName || "" };
          })
          .filter((item) => item.label);
      case "Account":
        return accounts
          .filter((account) => account.name && account.name.trim())
          .map((account) => ({ value: String(account.id), label: account.name }));
      default:
        return [];
    }
  };
  
  React.useEffect(() => {
    if (!formData.relatedType1) {
      setFormData((prev) => ({
        ...prev,
        relatedType1: "Lead",
      }));
    }
  }, []);
  const getRelatedTo2Options = () => {
    const type = formData.relatedType2;
    if (!type) return [];
    if (formData.relatedType1 === "Account") {
      return (relatedTo2Values || [])
        .map((item) => {
          if (type === "Contact") {
            const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim();
            return { value: String(item.id), label: fullName };
          }
          return { value: String(item.id), label: item.name || "" };
        })
        .filter((opt) => opt.label);
    }
    switch (type) {
      case "Contact":
        return contacts
          .map((contact) => {
            const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
            return { value: String(contact.id), label: fullName };
          })
          .filter((item) => item.label);
      case "Deal":
        return deals
          .filter((deal) => deal.name && deal.name.trim())
          .map((deal) => ({ value: String(deal.id), label: deal.name }));
      default:
        return [];
    }
  };
  const statusOptions = ["PLANNED", "HELD", "NOT_HELD"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "relatedType1") {
      setFormData((prev) => ({
        ...prev,
        relatedType: value,
        relatedTo: "",
        relatedTo1: "",
      }));
      setRelatedTo2Values([]);
      if (value === "Lead") {
        setFormData((prev) => ({
          ...prev,
          relatedType2: null,
          relatedTo2: "",
        }));
        setRelatedTo2Values([]);
      } else if (value === "Account" && !formData.relatedType2) {
        setFormData((prev) => ({
          ...prev,
          relatedType2: "Contact",
        }));
      }
    }
    if (name === "relatedTo1") {
      setFormData((prev) => ({
        ...prev,
        relatedType: prev.relatedType1,
        relatedTo: value,
      }));
      setRelatedTo2Values([]);
    }
    if (name === "relatedType2") {
      setFormData((prev) => ({
        ...prev,
        relatedType: value,
        relatedTo: "",
        relatedTo2: "",
      }));
      setRelatedTo2Values([]);
    }
    if (name === "relatedTo2") {
      setFormData((prev) => ({
        ...prev,
        relatedType: prev.relatedType2,
        relatedTo: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log("Meeting Scheduled:", formData);
      alert("Meeting scheduled! Check console for details.");
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") {
      onClose();
    }
  };

  return (
    <div
      id="modalBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
        >
          <FiX size={22} />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
          {isEditing ? "Edit Meeting" : "Schedule Meeting"}
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          onSubmit={handleSubmit}
        >
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
          <InputField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g. Conference Hall Southmall"
            disabled={isSubmitting}
          />
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
            options={statusOptions.map((option) => ({ value: option, label: option.replace('_', ' ') }))}
            disabled={isSubmitting}
          />
          <div className="w-full flex flex-col">
            <select
              name="relatedType1"
              onChange={handleInputChange}
              value={formData.relatedType1 ?? "Lead"}
              className="outline-none cursor-pointer mb-1 w-22 text-gray-700"
              disabled={isSubmitting}
            >
              <option value="Lead">Lead</option>
              <option value="Account">Account</option>
            </select>
            <select
              name="relatedTo1"
              onChange={handleInputChange}
              value={formData.relatedTo1 ?? ""}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
              disabled={isSubmitting}
            >
              <option value="">--</option>
              {getRelatedTo1Options().map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {formData.relatedType1 === "Account" && (
            <div className="w-full flex flex-col">
              <select
                name="relatedType2"
                onChange={handleInputChange}
                value={formData.relatedType2 ?? "Contact"}
                className="outline-none cursor-pointer mb-1 w-22 text-gray-700"
                disabled={isSubmitting}
              >
                <option value="Contact">Contact</option>
                <option value="Deal">Deal</option>
              </select>
              <select
                name="relatedTo2"
                onChange={handleInputChange}
                value={formData.relatedTo2 ?? ""}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
                disabled={isSubmitting}
              >
                <option value="">--</option>
                {getRelatedTo2Options().map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TextareaField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add meeting notes and key discussion points."
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

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  className = "",
  min,
}) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className = "",
}) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  rows = 3,
}) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 resize-none"
      />
    </div>
  );
}

export default CreateMeetingModal;
