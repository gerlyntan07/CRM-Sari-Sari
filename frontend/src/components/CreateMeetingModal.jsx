import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

const CreateMeetingModal = ({ onClose }) => { // receive onClose prop
    // Form states
    const [meetingTitle, setMeetingTitle] = useState('');
    const [location, setLocation] = useState('');
    const [duration, setDuration] = useState('30');
    const [meetingLink, setMeetingLink] = useState('');
    const [agenda, setAgenda] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [relatedType, setRelatedType] = useState('');
    const [relatedTo, setRelatedTo] = useState('');
    const [priority, setPriority] = useState('Medium');

    // Dropdown options
    const assignedToOptions = ['Lester Claro', 'Maria Sanchez', 'John Doe', 'Sarah Connor'];
    const relatedTypeOptions = ['Client', 'Project', 'Internal'];
    const relatedToOptions = {
        'Client': ['TechCorp Solutions', 'Alpha Solutions'],
        'Project': ['Project Falcon', 'Q3 Budget Review'],
        'Internal': ['Finance Department', 'HR Department'],
    };
    const priorityOptions = ['High', 'Medium', 'Low'];

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Meeting Scheduled:', {
            meetingTitle, location, duration, meetingLink, agenda,
            dueDate, assignedTo, relatedType, relatedTo, priority
        });
        alert('Meeting scheduled! Check console for details.');
        onClose(); // close modal after submit
    };

    // Optional: close modal when clicking on overlay
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center backdrop-blur-sm bg-black/50 pt-10 overflow-auto"
            onClick={handleOverlayClick} // close on background click
        >
            {/* Modal container */}
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200 relative max-h-[90vh] overflow-y-auto">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Schedule Meeting</h2>
                    <p className="text-sm text-gray-500 mt-1">Create new Meeting</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Meeting Title */}
                    <div>
                        <label htmlFor="meetingTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Title<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="meetingTitle"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                            placeholder="e.g. Follow-up call with Client"
                            value={meetingTitle}
                            onChange={(e) => setMeetingTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Location & Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                id="location"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                                placeholder="e.g. Conference Hall Southmall"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                                Duration
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="duration"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    min="1"
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">minutes</span>
                            </div>
                        </div>
                    </div>

                    {/* Meeting Link */}
                    <div>
                        <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Link
                        </label>
                        <input
                            type="url"
                            id="meetingLink"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                            placeholder="https://zoom.us/j/123456"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                        />
                    </div>

                    {/* Agenda */}
                    <div>
                        <label htmlFor="agenda" className="block text-sm font-medium text-gray-700 mb-1">
                            Agenda
                        </label>
                        <textarea
                            id="agenda"
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm resize-y"
                            placeholder="Add call notes and key discussion points."
                            value={agenda}
                            onChange={(e) => setAgenda(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Due Date & Assigned To */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned to<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="assignedTo"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select assignee</option>
                                    {assignedToOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Related Type & Related To */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="relatedType" className="block text-sm font-medium text-gray-700 mb-1">
                                Related Type
                            </label>
                            <div className="relative">
                                <select
                                    id="relatedType"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                                    value={relatedType}
                                    onChange={(e) => {
                                        setRelatedType(e.target.value);
                                        setRelatedTo('');
                                    }}
                                >
                                    <option value="">Select type</option>
                                    {relatedTypeOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="relatedTo" className="block text-sm font-medium text-gray-700 mb-1">
                                Related To
                            </label>
                            <div className="relative">
                                <select
                                    id="relatedTo"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                                    value={relatedTo}
                                    onChange={(e) => setRelatedTo(e.target.value)}
                                    disabled={!relatedType}
                                >
                                    <option value="">Select related item</option>
                                    {relatedType && relatedToOptions[relatedType]?.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                        </label>
                        <div className="relative">
                            <select
                                id="priority"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-gray-900 focus:border-gray-900 transition-colors shadow-sm text-sm"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                {priorityOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                            onClick={onClose} // Cancel closes modal
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors shadow-md"
                        >
                            Create Call
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMeetingModal;
