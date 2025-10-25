import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

export default function ManagerTaskModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Call",
    priority: "Medium",
    status: "To Do",
    dueDate: "",
    assignedTo: "",
    relatedTo: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Center Modal */}
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
              {/* Modal Container */}
              <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 p-6 text-left align-middle transform transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Create New Task
                    </h3>
                    <p className="text-sm text-gray-500">
                      Create a new task and assign it to a sales representative.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
                  >
                    &times;
                  </button>
                </div>

                {/* Scrollable Form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 overflow-y-auto pr-2"
                >
                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter task title"
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter task description"
                      rows={2}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Type / Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Call</option>
                        <option>Meeting</option>
                        <option>Email</option>
                        <option>Follow-up</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  </div>

                  {/* Status / Due Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Due Date *
                      </label>
                      <input
                        type="datetime-local"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Assign To */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Assign To
                    </label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select sales representative</option>
                      <option>John Doe</option>
                      <option>Jane Smith</option>
                      <option>Michael Lee</option>
                    </select>
                  </div>

                  {/* Related To */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Related To
                    </label>
                    <select
                      name="relatedTo"
                      value={formData.relatedTo}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option>Lead</option>
                      <option>Opportunity</option>
                      <option>Customer</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional notes..."
                      rows={2}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                     className="px-5 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                       className="px-5 py-2 text-white bg-gray-900 rounded hover:bg-gray-800 transition"
                  >
                    Save Task
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
