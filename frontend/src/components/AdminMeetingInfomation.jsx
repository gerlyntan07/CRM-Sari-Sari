import React, { useState, useEffect, useCallback } from 'react';

// --- Custom Status Message Component ---
const StatusBox = ({ message, visible }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed top-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-xl z-[9999] transition-all duration-300 
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'}
      `}
      style={{ willChange: 'opacity, transform' }}
    >
      {message}
    </div>
  );
};

// --- Tab Content Components ---

const OverviewContent = () => (
  <>
    <h2 className="text-xl font-medium text-gray-800 mb-2">Meeting Agenda & Summary</h2>
    <p className="text-gray-600 leading-relaxed">
      This area contains all the details for the Enterprise Inc. meeting. The goal of this session is to review Q3 performance metrics and align on the strategy for the upcoming Q4 product launch. Key discussion points will include budget allocations and marketing outreach goals.
    </p>
    <ul className="list-disc list-inside mt-4 space-y-1 text-gray-600">
      <li>Q3 Financial Performance Review</li>
      <li>Q4 Product Feature Prioritization</li>
      <li>Marketing Budget Sign-off</li>
      <li>Next Steps & Action Items</li>
    </ul>
    <p className="text-sm text-gray-400 mt-6">
      (This is the default content for the Overview tab.)
    </p>
  </>
);

const NotesContent = () => (
  <>
    <h2 className="text-xl font-medium text-gray-800 mb-2">Meeting Notes</h2>
    <textarea 
      className="w-full h-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-700 outline-none" 
      placeholder="Start typing your meeting notes here..."
    ></textarea>
  </>
);

const RelatedToContent = () => (
  <>
    <h2 className="text-xl font-medium text-gray-800 mb-2">Related Entities</h2>
    <ul className="space-y-3">
      <li className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <p className="font-medium text-indigo-600">Account: Enterprise Inc.</p>
        <p className="text-sm text-gray-500">Industry: Technology | ID: AC-10928</p>
      </li>
      <li className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <p className="font-medium text-indigo-600">Opportunity: Q4 Software Renewal ($150k)</p>
        <p className="text-sm text-gray-500">Status: Negotiation | Stage: Proposal</p>
      </li>
      <li className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <p className="font-medium text-indigo-600">Contact: Jane Doe</p>
        <p className="text-sm text-gray-500">Title: VP of Product | Email: jane@enterprise.com</p>
      </li>
    </ul>
  </>
);

const TabContentMap = {
  overview: OverviewContent,
  notes: NotesContent,
  related: RelatedToContent,
};


// --- Main Application Component ---
const App = () => {
  // Modal starts open by default (useState(true))
  const [isModalOpen, setIsModalOpen] = useState(true); 
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState({ message: '', visible: false });

  // Status message logic
  const showStatusMessage = useCallback((message) => {
    setStatus({ message, visible: true });
    // Hide message after 2.5 seconds
    const timer = setTimeout(() => {
      setStatus(s => ({ ...s, visible: false }));
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickAction = (actionName) => {
    console.log(`Action clicked: ${actionName}`);
    showStatusMessage(`'${actionName}' initiated successfully!`);
  };

  const closeModal = () => setIsModalOpen(false);
  // The openModal function is no longer needed since the modal starts open.

  // Effect for handling body scroll lock and escape key
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } 

    const handleEscape = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = ''; // Clean up body style
    };
  }, [isModalOpen]);

  // Dynamically determine the content component to render
  const CurrentContent = TabContentMap[activeTab];

  const tabs = [
    { name: 'Overview', key: 'overview' },
    { name: 'Notes', key: 'notes' },
    { name: 'Related to', key: 'related' },
  ];

  const quickActions = [
    { name: 'Schedule Call', icon: <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> },
    { name: 'Send E-mail', icon: <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 4v4a2 2 0 002 2h14a2 2 0 002-2v-4"></path></svg> },
    { name: 'Book Meeting', icon: <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v4a2 2 0 002 2h4a2 2 0 002-2V7m-4 10h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg> },
    { name: 'Create Quote', icon: <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v4m0 0h-4m4 0h4M9 14h6m-4-4v4m0 0h-4m4 0h4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg> },
  ];


  // Use global styles for a consistent look
  const globalStyles = `
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 10px; }
  `;

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 font-sans">
      <style>{globalStyles}</style>
      
      {/* The Launch Button was removed from here. */}

      {/* Modal Backdrop and Container */}
      <div 
        onClick={(e) => e.target === e.currentTarget && closeModal()}
        className={`fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
          isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Modal Content Card */}
        <div 
          className={`bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden transform transition-transform duration-300 ease-out 
            ${isModalOpen ? 'scale-100' : 'scale-95'}
          `}
        >
          {/* Header Section */}
          <div className="p-6 pb-2 relative">
            <span className="text-gray-500 text-sm block -mt-2 mb-2">Meeting</span>
            
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <h1 className="text-2xl font-semibold text-gray-800">Enterprise Inc.</h1>
            </div>
            
            {/* Close Button (X) */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 p-2 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex w-full overflow-hidden">
            <div className="flex flex-grow bg-gray-600">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.key;
                
                // Base classes for all tabs
                let tabClasses = "tab-btn flex-1 px-6 py-3 text-sm font-medium transition-colors duration-200";

                if (isActive) {
                  // Active tab style
                  tabClasses += ' text-gray-800 bg-white';
                } else {
                  // Inactive tab style
                  tabClasses += ' text-white bg-gray-600 hover:bg-gray-700';
                  // Add dark gray left border for 'Notes' and 'Related to'
                  if (tab.key !== 'overview') {
                    tabClasses += ' border-l border-gray-700';
                  }
                }

                return (
                  <button 
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)} 
                    className={tabClasses}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            
            {/* Left Content Wrapper (Tab Content) */}
            <div className="flex-1 h-[30rem] md:h-auto overflow-hidden">
              <div className="tab-content bg-white border border-gray-200 rounded-lg p-4 h-full custom-scrollbar">
                {/* Render the current active tab's component */}
                {CurrentContent ? <CurrentContent /> : null}
              </div>
            </div>
            
            {/* Right Sidebar (Quick Actions) */}
            <div className="w-full md:w-80 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map(action => (
                  <button 
                    key={action.name}
                    onClick={() => handleQuickAction(action.name)}
                    className="quick-action-btn flex items-center w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm" 
                  >
                    {action.icon}
                    {action.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* End Main Content Area */}
        </div>
        {/* End Modal Content Card */}
      </div>
      
      {/* Custom Status Message */}
      <StatusBox message={status.message} visible={status.visible} />
    </div>
  );
};

export default App;