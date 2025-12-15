import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import api from "../api";

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  setFormData,
  formData,
  isEditing = false,
  viewMode = false,
}) {
  const [salesList, setSalesList] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [dealsList, setDealsList] = useState([]);

  const fetchSales = useCallback(async () => {
    try {
      const response = await api.get("/users/sales/read");
      setSalesList(response.data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  }, []);

  const fetchRelatedTables = useCallback(async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        api.get("/leads/admin/getLeads"),
        api.get("/accounts/admin/fetch-all"),
        api.get("/contacts/admin/fetch-all"),
        api.get("/deals/admin/fetch-all"),
      ]);

      setLeadsList(r1.data || []);
      setAccountsList(r2.data || []);
      setContactsList(r3.data || []);
      setDealsList(r4.data || []);
    } catch (error) {
      console.error("Error fetching related tables:", error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchSales();
    fetchRelatedTables();
  }, [isOpen, fetchSales, fetchRelatedTables]);

  // ✅ options depend on selected type (formData.type)
  const relatedOptions = useMemo(() => {
    switch (formData.type) {
      case "Lead":
        return leadsList;
      case "Account":
        return accountsList;
      case "Contact":
        return contactsList;
      case "Deal":
        return dealsList;
      default:
        return [];
    }
  }, [formData.type, leadsList, accountsList, contactsList, dealsList]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ when type changes, clear relatedTo (prevents mismatch)
  const handleTypeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      type: value,
      relatedTo: "", // reset because options change
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData); // ✅ send only formData (AdminTask expects 1 arg)
  };

  const modalTitle = viewMode ? "Task Details" : isEditing ? "Edit Task" : "Create Task";

  const renderRelatedLabel = (option) => {
    if (formData.type === "Account") return option.name;
    if (formData.type === "Contact") return `${option.first_name} ${option.last_name}`;
    if (formData.type === "Lead") return option.title;
    if (formData.type === "Deal") return option.name;
    return option.name || option.title || option.id;
  };

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

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm flex-1">
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        disabled={viewMode}
                        placeholder="Enter task title"
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Description</label>
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
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Type</label>
                      <select
                        name="type"
                        value={formData.type || ""}
                        onChange={handleTypeChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="">- -</option>
                        <option value="Account">Account</option>
                        <option value="Contact">Contact</option>
                        <option value="Lead">Lead</option>
                        <option value="Deal">Deal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Related To</label>
                      <select
                        name="relatedTo"
                        value={formData.relatedTo || ""}
                        onChange={handleChange}
                        disabled={viewMode || !formData.type}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode || !formData.type ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="">{formData.type ? "Select..." : "- -"}</option>
                        {relatedOptions.map((option) => (
                          <option value={option.id} key={option.id}>
                            {renderRelatedLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Priority</label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="">- -</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Due Date</label>
                      <input
                        type="datetime-local"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Assign To</label>
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
                        {salesList.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="">- -</option>
                        <option value="Not started">Not started</option>
                        <option value="In progress">In progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Deferred">Deferred</option>
                      </select>
                    </div>

                    {!viewMode && (
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 col-span-1 md:col-span-2 mt-4 w-full">
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
