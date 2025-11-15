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
}) {
  const [salesList, setSalesList] = useState([]);

  useEffect(() => {
    if (isOpen) fetchSales();
  }, [isOpen]);

  const fetchSales = async () => {
    try {
      const response = await api.get("/users/sales/read");
      setSalesList(response.data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData); // modal does not close immediately; update handled in AdminTask
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
                <div className="bg-white w-full rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] flex flex-col hide-scrollbar">
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
                        Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option>Call</option>
                        <option>Meeting</option>
                        <option>Email</option>
                        <option>Follow-up</option>
                      </select>
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
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
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
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Completed</option>
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
                        {salesList.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Related To
                      </label>
                      <select
                        name="relatedTo"
                        value={formData.relatedTo}
                        onChange={handleChange}
                        disabled={viewMode}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="">Select type</option>
                        <option>Lead</option>
                        <option>Opportunity</option>
                        <option>Customer</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1 text-sm">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        disabled={viewMode}
                        placeholder="Additional notes..."
                        rows={3}
                        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none ${
                          viewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      />
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
