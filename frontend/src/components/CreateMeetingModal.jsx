import React, { useState } from "react";
import { FiX } from "react-icons/fi";

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
  });

  const formData =
    externalFormData !== undefined ? externalFormData : internalFormData;
  const setFormData = setExternalFormData || setInternalFormData;
  
  const relatedTypeOptions = ["Account", "Contact", "Lead", "Deal"];
  const getRelatedToOptions = () => {
    if (!formData.relatedType) return [];
    switch (formData.relatedType) {
      case "Account":
        return accounts
          .filter((account) => account.name && account.name.trim())
          .map((account) => ({ value: String(account.id), label: account.name }));
      case "Contact":
        return contacts
          .map((contact) => {
            const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
            return { value: String(contact.id), label: fullName };
          })
          .filter((item) => item.label);
      case "Lead":
        return leads
          .map((lead) => {
            const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
            return { value: String(lead.id), label: fullName };
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
    if (name === "relatedType") {
      setFormData((prev) => ({ ...prev, [name]: value, relatedTo: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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
          <SelectField
            label="Related Type"
            name="relatedType"
            value={formData.relatedType}
            onChange={handleInputChange}
            options={[{ value: "", label: "Select type" }, ...relatedTypeOptions.map((option) => ({ value: option, label: option }))]}
            disabled={isSubmitting}
          />
          <SelectField
            label="Related To"
            name="relatedTo"
            value={formData.relatedTo}
            onChange={handleInputChange}
            options={[{ value: "", label: "Select related item" }, ...getRelatedToOptions()]}
            disabled={!formData.relatedType || isSubmitting}
            className="lg:col-span-2" 
          />
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
