import React, { useState, useEffect, useRef, useMemo } from "react";
import { FiX } from "react-icons/fi";
import api from "../api";
import {toast} from 'react-toastify';
import { useAuth } from '../hooks/useAuth'

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
  const getDefaultTimes = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    
    return {
      startTime: `${year}-${month}-${date}T08:00`,
      endTime: `${year}-${month}-${date}T09:00`,
    };
  };

  const defaultTimes = getDefaultTimes();
  
  const [internalFormData, setInternalFormData] = useState({
    subject: "",
    startTime: defaultTimes.startTime,
    endTime: defaultTimes.endTime,
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

  // Ensure external form data has default times if empty
  useEffect(() => {
    if (externalFormData !== undefined && setExternalFormData) {
      if (!externalFormData.startTime || !externalFormData.endTime) {
        setExternalFormData((prev) => ({
          ...prev,
          startTime: prev.startTime || defaultTimes.startTime,
          endTime: prev.endTime || defaultTimes.endTime,
        }));
      }
    }
  }, []);

  const formData = externalFormData !== undefined ? externalFormData : internalFormData;
  const setFormData = setExternalFormData || setInternalFormData;
  const {userRole} = useAuth();

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

        let items = [];
        if (res && Array.isArray(res.data)) {
          items = res.data;
        }

        // If in edit mode and have a relatedTo1 value, fetch that specific item 
        // so it appears in the list even if user doesn't normally have access to it
        if (isEditing && formData.relatedTo1) {
          try {
            let specificRes;
            if (formData.relatedType1 === 'Lead') {
              specificRes = await api.get(`/leads/get/${formData.relatedTo1}`);
            } else if (formData.relatedType1 === 'Account') {
              specificRes = await api.get(`/accounts/get/${formData.relatedTo1}`);
            }

            if (specificRes && specificRes.data) {
              // Check if item already exists in list (by id)
              const exists = items.some(item => String(item.id) === String(formData.relatedTo1));
              if (!exists) {
                items = [specificRes.data, ...items];
              }
            }
          } catch (err) {
            console.error("Error fetching specific related item:", err);
          }
        }

        setRelatedTo1Values(items);
      } catch (error) {
        console.error("Error fetching relatedTo1 data:", error);
        setRelatedTo1Values([]);
      }
    };

    if (formData.relatedType1) {
      fetchData();
    }
  }, [formData.relatedType1, userRole, isEditing, formData.relatedTo1]);

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

    //validation 
const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
     setIsSubmitted(true);  

    if (formData.status === "--") {
      toast.warn("Please select a valid status."); // Optional: Notify the user
      return;
    }
    
     const subject = formData.subject;
  if (!subject || subject.trim() === "") {
    toast.error("Subject is required.");
    return;
  }

     const assignedTo = formData.assignedTo;
      if (!assignedTo) {
        toast.error("Assigned To is required.");
        return;
      }
      
        const relatedTo1 = formData.relatedTo1;
  if (!relatedTo1) {
    toast.error(`Please select a ${formData.relatedType1 || "Lead/Account"}.`);
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
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-60 p-2 sm:p-4"
  >
    <div className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-3 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar">
      
      <button
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-black transition"
      >
        <FiX size={22} />
      </button>

      <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
        {isEditing ? "Edit Meeting" : "Schedule Meeting"}
      </h2>

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm"
        onSubmit={handleSubmit}
        noValidate  
      >
        <InputField
          label="Subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          placeholder="e.g. Meeting with Client"
          required
           isSubmitted={isSubmitted}
          className="md:col-span-2"
        />

        {/* RELATED TO 1 */}
        <div className="flex flex-col w-full">
          <select
            name="relatedType1"
            onChange={handleInputChange}
            value={formData.relatedType1 || "Lead"}
            className="w-full outline-none cursor-pointer mb-1 rounded p-2 text-gray-700 disabled:text-gray-400"
            disabled={isSubmitting}
          >
            <option value="Lead">Lead</option>
            <option value="Account">Account</option>
          </select>

          <SearchableSelect
            items={Array.isArray(relatedTo1Values) ? relatedTo1Values : []}
            disabled={isSubmitting}
            value={formData.relatedTo1 ?? ""}
            placeholder={`Search ${formData.relatedType1 || "here"}...`}
            getLabel={(item) =>
              formData.relatedType1 === "Lead"
                ? item.title
                : item.name ?? ""
            }
            onChange={(newId) =>
              setFormData((prev) => ({
                ...prev,
                relatedTo1: newId,
              }))
            }
            required={true}       
           isSubmitted={isSubmitted} 
          />
        </div>

        {/* RELATED TO 2 */}
        <div className="flex flex-col w-full">
          <select
            name="relatedType2"
            onChange={handleInputChange}
            value={formData.relatedType2 || "Contact"}
            className="w-full outline-none cursor-pointer mb-1 rounded p-2 text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={isSubmitting || formData.relatedType1 === "Lead"}
          >
            <option value="Contact">Contact</option>
            <option value="Deal">Deal</option>
          </select>

          <SearchableSelect
            items={Array.isArray(relatedTo2Values) ? relatedTo2Values : []}
            value={formData.relatedTo2 ?? ""}
            placeholder={
              formData.relatedType1 === "Lead"
                ? ""
                : relatedTo2Values?.length
                ? `Search ${formData.relatedType2}...`
                : `No ${formData.relatedType2} data found`
            }
            getLabel={(item) =>
              formData.relatedType2 === "Contact"
                ? `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()
                : item.name ?? ""
            }
            onChange={(newId) =>
              setFormData((prev) => ({
                ...prev,
                relatedTo2: newId,
              }))
            }
            disabled={formData.relatedType1 === "Lead"}
          />
        </div>

        <InputField
          label="Location"
          name="location"
          className="md:col-span-2"
          value={formData.location}
          onChange={handleInputChange}
          disabled={isSubmitting}
        />

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InputField
            label="Start Time"
            name="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
          <InputField
            label="End Time"
            name="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-gray-700 font-medium mb-1 text-sm">
           Assign To <span className="text-red-600 font-semibold">*</span>
          </label>
          

          <SearchableSelect
            items={Array.isArray(users) ? users : []}
            value={formData.assignedTo ?? ""}
            placeholder="Search an account..."
            getLabel={(item) => `${item.first_name} ${item.last_name}`}
            onChange={(newId) =>
              setFormData((prev) => ({
                ...prev,
                assignedTo: newId,
              }))
            } 
              disabled={userRole === 'Sales'}
              required={true}       // optional or required
           isSubmitted={isSubmitted} // form submit trigger
            />
        </div>

        <SelectField
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          options={["--", "Planned", "Held", "Not held"].map((opt) => ({
            value: opt,
            label: opt.replace("_", " "),
          }))}
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

        <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-2 mt-4">
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
function InputField({ label, name, value, onChange, placeholder, type = "text", required = false, disabled = false, className = "",  isSubmitted = false, 
  }) {
     const hasError = isSubmitted && !value?.trim();

  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type={type} name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled}
        className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border focus:ring-2 outline-none disabled:bg-gray-100
          ${hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-400"
          }
          ${className}
        `}/>
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required = false, disabled = false, className = "", isSubmitted = false,
}) {
  const hasError = isSubmitted && required && !value; 

  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label} {required && <span className="text-red-500">*</span>}
</label>
      <select name={name} value={value ?? ""} onChange={onChange} required={required} disabled={disabled} hasError={hasError} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100">
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
  required = false,
  isSubmitted = false, // <-- new
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selectedItem = items.find((it) => String(it.id) === String(value));
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

   // ✅ DEFINE hasError HERE
  const hasError = required && isSubmitted && !value;
  
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

         className={`w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2 disabled:bg-gray-100
          ${hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-400"
          }`}
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