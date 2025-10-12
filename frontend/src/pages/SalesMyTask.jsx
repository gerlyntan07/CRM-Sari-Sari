import { FiClock, FiPhone, FiEdit, FiTrash2 } from "react-icons/fi";

export default function SalesMyTasks() {
  return (
    <div className="p-4 bg-gradient-to-b from-blue-50 to-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold flex items-center gap-2 text-blue-700">
          <FiClock /> My Tasks & Follow-ups
        </h2>
        <select className="border rounded-lg px-3 py-1 text-sm text-gray-600">
          <option>All Tasks</option>
          <option>High Priority</option>
          <option>Completed</option>
        </select>
      </div>

      {/* Example Task Card */}
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-gray-800 flex items-center gap-2">
              <FiPhone className="text-blue-600" /> Follow up with TechStart Inc
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-md font-medium">
                HIGH
              </span>
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Discuss cloud migration proposal feedback
            </p>
            <p className="text-gray-400 text-xs mt-1">
              📅 10/13/2025 · Robert Davis
            </p>
          </div>
          <div className="flex gap-3">
            <FiEdit className="text-green-500 cursor-pointer" />
            <FiTrash2 className="text-red-500 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}
