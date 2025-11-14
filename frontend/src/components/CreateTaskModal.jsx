import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

export default function CreateTaskModal({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Call");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [relatedTo, setRelatedTo] = useState("Lead");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ title, type, priority, dueDate, relatedTo, description, notes });
    onClose();
  };

  return (
    // root Transition keeps the enter/leave animation for the whole modal
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* overlay */}
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

        {/* center container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* animated panel (simplified - using the same Transition.Child for panel animation) */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh]">
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
              >
                &times;
              </button>

              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
                Create New Task
              </h2>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
              >
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter task title"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Description
                  </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional details about the task"
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                      rows={3}
                    />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option>Call</option>
                    <option>Email</option>
                    <option>Meeting</option>
                    <option>Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Due Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Related To
                  </label>
                  <select
                    value={relatedTo}
                    onChange={(e) => setRelatedTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option>Lead</option>
                    <option>Account</option>
                    <option>Deal</option>
                    <option>Contact</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any internal notes or comments"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    rows={3}
                  />
                </div>

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
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
