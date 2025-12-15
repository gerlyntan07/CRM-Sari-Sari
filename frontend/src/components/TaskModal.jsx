// frontend/src/components/TaskModal.jsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import api from "../api";

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  setFormData,
  formData,
  isEditing = false,
  viewMode = false,
  users = [], 
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
        console.error("Error fetching related 1 data:", error);
        setRelatedTo1Values([]);
      }
    };

    fetchRelated1();
  }, [formData.relatedType1, isOpen]);

  // --- Effect 2: Fetch Level 2 Options (Contacts or Deals) when Account is selected ---
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchRelated2 = async () => {
      try {
        setRelatedTo2Values([]);

        // Only fetch level 2 if Type1 is Account and an Account is selected
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
        }
      } catch (error) {
        console.error("Error fetching related 2 data:", error);
        setRelatedTo2Values([]);
      }
    };

    fetchRelated2();
  }, [formData.relatedType1, formData.relatedTo1, formData.relatedType2, isOpen]);


  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData); 
  };

  const modalTitle = viewMode ? "Task Details" : isEditing ? "Edit Task" : "Create Task";

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
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-full sm:max-w-3xl text-left align-middle transform transition-all">
                <div className="bg-white w-full min-w-sm md:min-w-lg rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] flex flex-col hide-scrollbar">
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
                  >
                    &times;
                  </button>

                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
                    {modalTitle}
                  </h3>

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
                            disabled={viewMode}
                            className={`w-23 rounded-md text-sm focus:ring-2 focus:ring-blue-400 outline-none mb-2 ${viewMode ? "bg-gray-50" : ""}`}
                        >
                            <option value="Lead">Lead</option>
                            <option value="Account">Account</option>
                        </select>

                        {Array.isArray(relatedTo1Values) && relatedTo1Values.length > 0 ? (
                            <select
                                name="relatedTo1"
                                onChange={handleChange}
                                value={formData.relatedTo1}
                                disabled={viewMode}
                                className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${viewMode ? "bg-gray-50" : ""}`}
                            >
                                <option value="">-- Select {formData.relatedType1} --</option>
                                {relatedTo1Values.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {formData.relatedType1 === 'Lead' ? item.title : item.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={`No ${formData.relatedType1 || ''} data found`}
                                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-gray-100 text-gray-500"
                                disabled
                            />
                        )}
                    </div>

                    <div className="w-full flex flex-col">
                         <select
                            name="relatedType2"
                            onChange={handleChange}
                            value={formData.relatedType2 ?? "Contact"}
                            className={`w-23 rounded-md text-sm focus:ring-2 focus:ring-blue-400 outline-none mb-2 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                            disabled={viewMode || formData.relatedType1 === 'Lead'}
                        >
                            <option value="Contact">Contact</option>
                            <option value="Deal">Deal</option>
                        </select>

                        {Array.isArray(relatedTo2Values) && relatedTo2Values.length > 0 ? (
                            <select
                                name="relatedTo2"
                                onChange={handleChange}
                                value={formData.relatedTo2 ?? ""}
                                disabled={viewMode || formData.relatedType1 === 'Lead'}
                                className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100`}
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
                                value={formData.relatedType1 === 'Lead' ? 'N/A' : `No ${formData.relatedType2 || ''} data found`}
                                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-gray-100 text-gray-500"
                                disabled
                            />
                        )}
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
                      <select
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="">Select User</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
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
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}