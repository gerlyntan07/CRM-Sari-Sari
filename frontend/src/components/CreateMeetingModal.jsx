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
  // Use external formData if provided, otherwise use internal state
  const [internalFormData, setInternalFormData] = useState({
    meetingTitle: "",
    location: "",
    duration: "",
    meetingLink: "",
    agenda: "",
    dueDate: "",
    assignedTo: "",
    relatedType: "",
    relatedTo: "",
    priority: "Low",
  });

  const formData =
    externalFormData !== undefined ? externalFormData : internalFormData;
  const setFormData = setExternalFormData || setInternalFormData;
  const relatedTypeOptions = ["Account", "Contact", "Lead", "Deal"];
  
  // Build relatedTo options based on selected relatedType
  const getRelatedToOptions = () => {
    if (!formData.relatedType) return [];
    
    switch (formData.relatedType) {
      case "Account":
        return accounts
          .filter((account) => account.name && account.name.trim())
          .map((account) => ({
            value: String(account.id),
            label: account.name,
          }));
      case "Contact":
        return contacts
          .map((contact) => {
            const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
            return { value: String(contact.id), label: fullName };
          })
          .filter((item) => item.label); // Filter out empty names
      case "Lead":
        return leads
          .map((lead) => {
            const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
            return { value: String(lead.id), label: fullName };
          })
          .filter((item) => item.label); // Filter out empty names
      case "Deal":
        return deals
          .filter((deal) => deal.name && deal.name.trim())
          .map((deal) => ({
            value: String(deal.id),
            label: deal.name,
          }));
      default:
        return [];
    }
  };
  
  const priorityOptions = ["High", "Medium", "Low"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Reset relatedTo when relatedType changes
    if (name === "relatedType") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        relatedTo: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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
            label="Meeting Title"
            name="meetingTitle"
            value={formData.meetingTitle}
            onChange={handleInputChange}
            placeholder="e.g. Follow-up call with Client"
            required
            disabled={isSubmitting}
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
            label="Duration (minutes)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="30"
            min="1"
            disabled={isSubmitting}
          />
          <InputField
            label="Meeting Link"
            name="meetingLink"
            type="url"
            value={formData.meetingLink}
            onChange={handleInputChange}
            placeholder="https://zoom.us/j/123456"
            disabled={isSubmitting}
          />
          <InputField
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleInputChange}
            required
            className="md:col-span-2"
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
            label="Related Type"
            name="relatedType"
            value={formData.relatedType}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select type" },
              ...relatedTypeOptions.map((option) => ({
                value: option,
                label: option,
              })),
            ]}
            disabled={isSubmitting}
          />
          <SelectField
            label="Related To"
            name="relatedTo"
            value={formData.relatedTo}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select related item" },
              ...getRelatedToOptions(),
            ]}
            disabled={!formData.relatedType || isSubmitting}
          />
          <SelectField
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            options={priorityOptions.map((option) => ({
              value: option,
              label: option,
            }))}
            disabled={isSubmitting}
          />
          <TextareaField
            label="Agenda"
            name="agenda"
            value={formData.agenda}
            onChange={handleInputChange}
            placeholder="Add call notes and key discussion points."
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
