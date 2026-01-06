// frontend/src/components/TaskModal.jsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect, useRef } from "react";
import api from "../api";
import { useMemo } from "react";
import { HiX } from "react-icons/hi";
import { FiTrash2 } from "react-icons/fi";

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
   onEdit, // <-- new prop
  setFormData,
  formData,
  isEditing = false,
  viewMode = false,
  users = [],
  onDelete
}) {
  // Local state for the dropdown options
  const [relatedTo1Values, setRelatedTo1Values] = useState([]);
  const [relatedTo2Values, setRelatedTo2Values] = useState([]);

  // --- Logic to Handle Input Changes ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Logic from Calls: Reset dependent fields when parent type changes
      if (name === "relatedType1") {
        updated.relatedTo1 = "";
        if (value === "Lead") {
          updated.relatedType2 = null;
          updated.relatedTo2 = null;
          setRelatedTo2Values([]);
        } else if (value === "Account") {
          updated.relatedType2 = "Contact";
        }
      }

      if (name === "relatedType2") {
        updated.relatedTo2 = "";
      }

      return updated;
    });
  };

  // --- Effect 1: Fetch Level 1 Options (Leads or Accounts) ---
  useEffect(() => {
    if (!isOpen) return;

    const fetchRelated1 = async () => {
      try {
        setRelatedTo1Values([]);
        let res;
        if (formData.relatedType1 === "Lead") {
          res = await api.get(`/leads/admin/getLeads`);
        } else if (formData.relatedType1 === "Account") {
          res = await api.get(`/accounts/admin/fetch-all`);
        }

        let items = [];
        if (res && Array.isArray(res.data)) {
          items = res.data;
        }

        // If in edit mode and have a selected value, fetch that specific item
        if (isEditing && formData.relatedTo1) {
          try {
            let specificRes;
            if (formData.relatedType1 === "Lead") {
              specificRes = await api.get(`/leads/get/${formData.relatedTo1}`);
            } else if (formData.relatedType1 === "Account") {
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
        console.error("Error fetching related 1 data:", error);
        setRelatedTo1Values([]);
      }
    };

    fetchRelated1();
  }, [formData.relatedType1, isOpen, isEditing, formData.relatedTo1]);

  // --- Effect 2: Fetch Level 2 Options (Contacts or Deals) when Account is selected ---
  useEffect(() => {
    if (!isOpen) return;
    if (viewMode) return;

    const fetchRelated2 = async () => {
      try {
        setRelatedTo2Values([]);

        // Only fetch level 2 if Type1 is Account and an Account is selected
        if (formData.relatedType1 === "Account" && formData.relatedTo1) {
          let res;
          if (formData.relatedType2 === "Contact") {
            res = await api.get(`/contacts/from-acc/${formData.relatedTo1}`);
          } else if (formData.relatedType2 === "Deal") {
            res = await api.get(`/deals/from-acc/${formData.relatedTo1}`);
          }

          let items = [];
          if (res && Array.isArray(res.data)) {
            items = res.data;
          }

          // If in edit mode and have a selected value, fetch that specific item
          if (isEditing && formData.relatedTo2) {
            try {
              let specificRes;
              if (formData.relatedType2 === "Contact") {
                specificRes = await api.get(`/contacts/get/${formData.relatedTo2}`);
              } else if (formData.relatedType2 === "Deal") {
                specificRes = await api.get(`/deals/get/${formData.relatedTo2}`);
              }

              if (specificRes && specificRes.data) {
                // Check if item already exists in list (by id)
                const exists = items.some(item => String(item.id) === String(formData.relatedTo2));
                if (!exists) {
                  items = [specificRes.data, ...items];
                }
              }
            } catch (err) {
              console.error("Error fetching specific related item:", err);
            }
          }

          setRelatedTo2Values(items);
        }
      } catch (error) {
        console.error("Error fetching related 2 data:", error);
        setRelatedTo2Values([]);
      }
    };

    fetchRelated2();
  }, [
    formData.relatedType1,
    formData.relatedTo1,
    formData.relatedType2,
    formData.relatedTo2,
    isOpen,
    viewMode,
    isEditing,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
  };

  const modalTitle = viewMode
    ? "Task Details"
    : isEditing
    ? "Edit Task"
    : "Create Task";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-full sm:max-w-3xl text-left align-middle transform transition-all">
                <div className="bg-white w-full min-w-sm md:min-w-lg rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] flex flex-col hide-scrollbar">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
            >
              <HiX size={25} />
            </button>

                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
                    {modalTitle}
                  </h3>

               
 {/* here */}
  {viewMode && (
  <div
    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl shadow-lg w-full max-w-full lg:max-w-4xl max-h-[90vh] overflow-y-auto hide-scrollbar font-manrope relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 🔵 Top Header */}
      <div className="bg-tertiary w-full flex items-center justify-between p-3 lg:p-4 rounded-t-xl">
        <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
          Tasks
        </h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition cursor-pointer"
          >
            <HiX size={25} />
          </button>
      </div>

      {/* Action Buttons */}
      <div className="p-6 lg:p-4">
        <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {formData.subject || "No Title"}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              onClick={() => {
                if (setFormData) setFormData(formData);
                if (typeof onEdit === "function") onEdit();
              }}
            >
              Edit
            </button>
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
              onClick={() => onDelete(formData)} // <-- call your delete function here
            >
              <FiTrash2 className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 my-5"></div>

      {/* Overview Content */}
      <div className="p-4">
        <div className="flex w-full bg-[#6A727D] text-white overflow-x-auto">
          <button className="flex-1 min-w-[90px] px-4 py-2 lg:text-lg text-sm font-medium text-center text-white">
            Overview
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-5 border border-gray-200 text-sm text-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="font-semibold">Title:</p>
              <p>{formData.subject || "—"}</p>
            </div>
            {formData.relatedType1Text && formData.relatedTo1Text && (
              <div>
                <p className="font-semibold">{formData.relatedType1Text}:</p>
                <p>{formData.relatedTo1Text}</p>
              </div>
            )}
            {formData.relatedType2Text && formData.relatedTo2Text && (
              <div>
                <p className="font-semibold">{formData.relatedType2}:</p>
                <p>{formData.relatedTo2Text}</p>
              </div>
            )}
            <div>
              <p className="font-semibold">Priority:</p>
              <p>{formData.priority || "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Status:</p>
              <p>{formData.status || "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Due Date:</p>
              <p>{formData.dueDate || "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-semibold">Description:</p>
              <p className="whitespace-pre-wrap">{formData.description || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}




 {!viewMode && (
  <form
    onSubmit={handleSubmit}
    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm flex-1"
  >

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Title
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        disabled={viewMode}
                        placeholder="Enter task title"
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>

                    {/* --- Related Section Starts Here (Updated to match Calls) --- */}
                    <div className="w-full flex flex-col">
                      <select
                        name="relatedType1"
                        onChange={handleChange}
                        value={formData.relatedType1}
                        disabled={viewMode || isEditing}
                        className={`w-23 rounded-md text-sm focus:ring-2 focus:ring-blue-400 outline-none mb-2 disabled:text-gray-400 ${
                          viewMode || isEditing ? "cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="Lead">Lead</option>
                        <option value="Account">Account</option>
                      </select>

                      <SearchableSelect
                        disabled={isEditing}
                        items={
                          Array.isArray(relatedTo1Values)
                            ? relatedTo1Values
                            : []
                        }
                        value={formData.relatedTo1 ?? ""}
                        placeholder={`Search ${
                          formData.relatedType1 || "here"
                        }...`}
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
                        onChange={handleChange}
                        value={formData.relatedType2 ?? "Contact"}
                        className={`w-23 rounded-md text-sm focus:ring-2 focus:ring-blue-400 outline-none mb-2 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        disabled={viewMode || formData.relatedType1 === "Lead" || isEditing}
                      >
                        <option value="Contact">Contact</option>
                        <option value="Deal">Deal</option>
                      </select>

                      <SearchableSelect
                        disabled={formData.relatedType1 === "Lead" || isEditing}
                        items={
                          Array.isArray(relatedTo2Values)
                            ? relatedTo2Values
                            : []
                        }
                        value={formData.relatedTo2 ?? ""}
                        placeholder={
                          formData.relatedType1 === "Lead"
                            ? ""
                            : Array.isArray(relatedTo2Values) &&
                              relatedTo2Values.length > 0
                            ? `Search ${formData.relatedType2 || "Contact"}...`
                            : `No ${formData.relatedType2 || ""} data found`
                        }
                        getLabel={(item) =>
                          formData.relatedType2 === "Contact"
                            ? `${item.first_name ?? ""} ${
                                item.last_name ?? ""
                              }`.trim()
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
                    {/* --- Related Section Ends --- */}

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={viewMode}
                        placeholder="Enter task description"
                        rows={3}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Due Date
                      </label>
                      <input
                        type="datetime-local"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Assign To
                      </label>
                      <SearchableSelect
                        items={Array.isArray(users) ? users : []}
                        value={formData.assignedTo ?? ""}
                        placeholder={`Search an account...`}
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

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="Not started">Not started</option>
                        <option value="In progress">In Progress</option>
                        <option value="Deferred">Deferred</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    {!viewMode && (
                      <div className="flex flex-col sm:flex-row justify-end sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 col-span-1 md:col-span-2 mt-4 w-full">
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition"
                        >
                          {isEditing ? "Update Task" : "Create Task"}
                        </button>
                      </div>
                    )}
                    </form>
)}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
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
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
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
