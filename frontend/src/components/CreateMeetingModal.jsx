import React, { useState, useEffect, useRef, useMemo } from "react";
import { FiX } from "react-icons/fi";
import api from "../api";
import {toast} from 'react-toastify';

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
    status: "Planned",
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

      // Logic: Reset dependent fields ONLY when the user manually changes the Type
      if (name === "relatedType1") {
        // Only clear relatedTo1 if the TYPE actually changed. 
        // (This prevents issues if React calls this on mount for some reason)
        if (prev.relatedType1 !== value) {
             updated.relatedTo1 = ""; 
        }

        if (value === "Lead") {
          updated.relatedType2 = null;
          updated.relatedTo2 = null;
          setRelatedTo2Values([]);
        } else if (value === "Account") {
          updated.relatedType2 = "Contact";
          updated.relatedTo2 = "";
        }
      }

      if (name === "relatedType2") {
        if (prev.relatedType2 !== value) {
            updated.relatedTo2 = "";
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.status === "--") {
      toast.warn("Please select a valid status."); // Optional: Notify the user
      return;
    }

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
            <select
              name="relatedType1"
              onChange={handleInputChange}
              value={formData.relatedType1 || "Lead"}
              className="outline-none w-23 cursor-pointer mb-1 rounded p-1 text-gray-700 disabled:text-gray-200"
              disabled={isSubmitting}
            >
              <option value="Lead">Lead</option>
              <option value="Account">Account</option>
            </select>

            <SearchableSelect              
              items={Array.isArray(relatedTo1Values) ? relatedTo1Values : []}
              value={formData.relatedTo1 ?? ""}
              placeholder={`Search ${formData.relatedType1 || 'here'}...`
              }
              getLabel={(item) =>
                formData.relatedType1 === "Lead"
                  ? item.title
                  : item.name ?? ""
              }
              onChange={(newId) =>
                setFormData((prev) => ({
                  ...prev,
                  relatedTo1: newId, // keep string
                }))
              }
            />            
          </div>

          <div className="w-full flex flex-col">
            <select
              name="relatedType2"
              onChange={handleInputChange}
              value={formData.relatedType2 || "Contact"}
              className="outline-none cursor-pointer mb-1 w-23 rounded p-1 text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed"
              disabled={isSubmitting || formData.relatedType1 === 'Lead'}
            >
              <option value="Contact">Contact</option>
              <option value="Deal">Deal</option>
            </select>

            <SearchableSelect
              disabled={formData.relatedType1 === "Lead"}
              items={Array.isArray(relatedTo2Values) ? relatedTo2Values : []}
              value={formData.relatedTo2 ?? ""}
              placeholder={
                formData.relatedType1 === "Lead"
                  ? ""
                  : Array.isArray(relatedTo2Values) && relatedTo2Values.length > 0
                  ? `Search ${formData.relatedType2 || "Contact"}...`
                  : `No ${formData.relatedType2 || ""} data found`
              }
              getLabel={(item) =>
                formData.relatedType2 === "Contact"
                  ? `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()
                  : item.name ?? ""
              }
              onChange={(newId) =>
                setFormData((prev) => ({
                  ...prev,
                  relatedTo2: newId, // keep string
                }))
              }
            />            
          </div>
          {/* -------------------------------------------------------- */}

          <InputField
            label="Location"
            name="location"
            className="col-span-2"
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

          

          <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Assign To
                      </label>
                      <SearchableSelect              
              items={Array.isArray(users) ? users : []}
              value={formData.assignedTo ?? ""}
              placeholder={`Search an account...`
              }
              getLabel={(item) =>
                `${item.first_name} ${item.last_name}`
              }
              onChange={(newId) =>
                setFormData((prev) => ({
                  ...prev,
                  assignedTo: newId, // keep string
                }))
              }
            /> 
                    </div>   

          <SelectField
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={["--", "Planned", "Held", "Not held"].map((opt) => ({ value: opt, label: opt.replace('_', ' ') }))}
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

function SearchableSelect({
  items = [],
  value = "",
  onChange,
  getLabel,
  placeholder = "Search...",
  disabled = false,
  maxRender = 200,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selectedItem = items.find((it) => String(it.id) === String(value));
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? items.filter((it) => (getLabel(it) || "").toLowerCase().includes(query))
      : items;

    return base.slice(0, maxRender);
  }, [items, q, getLabel, maxRender]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        disabled={disabled}
        value={open ? q : selectedLabel}
        placeholder={placeholder}
        onFocus={() => !disabled && setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          if (!open) setOpen(true);
        }}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      />

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((it) => {
                const id = String(it.id);
                const label = getLabel(it);
                const active = String(value) === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      active ? "bg-blue-50" : ""
                    }`}
                  >
                    {label || "--"}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
          </div>

          {items.length > maxRender && (
            <div className="px-3 py-2 text-[11px] text-gray-400 border-t">
              Showing first {maxRender} results — keep typing to narrow.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CreateMeetingModal;