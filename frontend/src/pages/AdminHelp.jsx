import React, { useState, useEffect } from "react";
import { FiAlertCircle, FiBookOpen, FiChevronRight, FiX, FiSend, FiSearch, FiMessageSquare, FiHelpCircle, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-toastify";

export default function AdminHelp() {
  const [activeSection, setActiveSection] = useState(null);
  const [issueForm, setIssueForm] = useState({
    subject: "",
    category: "",
    description: "",
    priority: "medium",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Help Center | Sari-Sari CRM";
  }, []);

  // Sample FAQ/Solutions data
  const solutions = [
    {
      id: 1,
      category: "Getting Started",
      title: "How to create your first account?",
      content: "Navigate to the Accounts page from the sidebar, click the 'Add Account' button, fill in the required information such as company name, email, and phone number, then click Save.",
    },
    {
      id: 2,
      category: "Getting Started",
      title: "How to add new contacts?",
      content: "Go to Contacts in the sidebar, click 'Add Contact', enter the contact details including name, email, phone, and associated account, then save the contact.",
    },
    {
      id: 3,
      category: "Leads & Deals",
      title: "How to convert a lead to a deal?",
      content: "Open the lead you want to convert, click on the 'Convert to Deal' button, review the pre-filled information, make any necessary adjustments, and confirm the conversion.",
    },
    {
      id: 4,
      category: "Leads & Deals",
      title: "How to manage deal stages?",
      content: "Deals progress through stages: Prospecting, Qualification, Proposal, Negotiation, and Closed. Update the stage by editing the deal and selecting the appropriate stage from the dropdown.",
    },
    {
      id: 5,
      category: "Tasks & Activities",
      title: "How to create and assign tasks?",
      content: "Navigate to Tasks, click 'Add Task', fill in the task details, assign it to a team member, set the due date and priority, then save. The assigned user will be notified.",
    },
    {
      id: 6,
      category: "Tasks & Activities",
      title: "How to schedule meetings?",
      content: "Go to Meetings, click 'Schedule Meeting', select participants, set the date and time, add an agenda, and save. All participants will receive calendar invites.",
    },
    {
      id: 7,
      category: "Reports & Analytics",
      title: "How to view sales performance?",
      content: "Access the Dashboard to see key metrics. For detailed reports, navigate to Targets to view individual and team performance against set goals.",
    },
    {
      id: 8,
      category: "Account Settings",
      title: "How to manage user permissions?",
      content: "Go to Users in the sidebar, select a user, and edit their role. Different roles (Admin, Manager, Sales, Marketing) have different access levels and permissions.",
    },
  ];

  const issueCategories = [
    "Technical Issue",
    "Login Problem",
    "Data Issue",
    "Feature Request",
    "Performance Issue",
    "Other",
  ];

  // Filter solutions based on search query
  const filteredSolutions = solutions.filter(
    (solution) =>
      solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solution.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solution.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group solutions by category
  const groupedSolutions = filteredSolutions.reduce((acc, solution) => {
    if (!acc[solution.category]) {
      acc[solution.category] = [];
    }
    acc[solution.category].push(solution);
    return acc;
  }, {});

  const handleInputChange = (field, value) => {
    setIssueForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    
    if (!issueForm.subject.trim() || !issueForm.category || !issueForm.description.trim()) {
      toast.warn("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Your issue has been submitted successfully! We'll get back to you soon.");
      setIssueForm({
        subject: "",
        category: "",
        description: "",
        priority: "medium",
      });
      setActiveSection(null);
      setIsSubmitting(false);
    }, 1500);
  };

  const [expandedSolution, setExpandedSolution] = useState(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Help Center</h1>
        <p className="text-gray-600">How can we help you today?</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Report an Issue Card */}
        <div
          onClick={() => setActiveSection(activeSection === "report" ? null : "report")}
          className={`bg-white rounded-xl shadow-md border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
            activeSection === "report" ? "border-red-400 ring-2 ring-red-100" : "border-transparent hover:border-red-200"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Report an Issue</h2>
                  <p className="text-gray-500 text-sm">Having a problem? Let us know</p>
                </div>
              </div>
              <FiChevronRight
                className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                  activeSection === "report" ? "rotate-90" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Browse Solutions Card */}
        <div
          onClick={() => setActiveSection(activeSection === "solutions" ? null : "solutions")}
          className={`bg-white rounded-xl shadow-md border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
            activeSection === "solutions" ? "border-blue-400 ring-2 ring-blue-100" : "border-transparent hover:border-blue-200"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiBookOpen className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Browse Solutions</h2>
                  <p className="text-gray-500 text-sm">Find answers to common questions</p>
                </div>
              </div>
              <FiChevronRight
                className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                  activeSection === "solutions" ? "rotate-90" : ""
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Issue Section */}
      {activeSection === "report" && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiMessageSquare className="text-red-500" />
              Report an Issue
            </h3>
            <button
              onClick={() => setActiveSection(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmitIssue} className="space-y-5">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={issueForm.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={issueForm.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition bg-white"
              >
                <option value="">Select a category</option>
                {issueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <div className="flex gap-3">
                {["low", "medium", "high"].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handleInputChange("priority", priority)}
                    className={`px-4 py-2 rounded-lg border transition capitalize ${
                      issueForm.priority === priority
                        ? priority === "high"
                          ? "bg-red-500 text-white border-red-500"
                          : priority === "medium"
                          ? "bg-yellow-500 text-white border-yellow-500"
                          : "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={issueForm.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Please describe the issue in detail. Include steps to reproduce if applicable."
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Submit Issue
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Browse Solutions Section */}
      {activeSection === "solutions" && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiHelpCircle className="text-blue-500" />
              Browse Solutions
            </h3>
            <button
              onClick={() => setActiveSection(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for solutions..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition"
            />
          </div>

          {/* Solutions List */}
          <div className="space-y-6">
            {Object.keys(groupedSolutions).length > 0 ? (
              Object.entries(groupedSolutions).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((solution) => (
                      <div
                        key={solution.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedSolution(
                              expandedSolution === solution.id ? null : solution.id
                            )
                          }
                          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition text-left"
                        >
                          <span className="font-medium text-gray-700">
                            {solution.title}
                          </span>
                          <FiChevronRight
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                              expandedSolution === solution.id ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        {expandedSolution === solution.id && (
                          <div className="px-4 py-3 bg-white border-t border-gray-200">
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {solution.content}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                              <FiCheckCircle className="text-green-500" />
                              Was this helpful?
                              <button className="text-blue-500 hover:underline ml-1">
                                Yes
                              </button>
                              <span>|</span>
                              <button className="text-blue-500 hover:underline">
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No solutions found matching "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try a different search term or{" "}
                  <button
                    onClick={() => setActiveSection("report")}
                    className="text-blue-500 hover:underline"
                  >
                    report an issue
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links Footer */}
      {!activeSection && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Need more help?
          </h3>
          <p className="text-gray-600 mb-4">
            Contact our support team for personalized assistance
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition text-gray-700"
            >
              <FiMessageSquare className="w-4 h-4" />
              Email Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
