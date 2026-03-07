import React, { useState, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiPlus, FiClock, FiCheckCircle, FiAlertCircle,
  FiUser, FiCalendar, FiMessageSquare, FiEdit, FiTrash2, FiEye,
  FiTag, FiRefreshCw, FiDownload, FiMoreVertical, FiSend, FiX,
  FiArrowUp, FiArrowDown, FiArrowRight
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from '../components/LoadingSpinner';

export default function TechnicalSupportTickets() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketResponse, setTicketResponse] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(10);

  // Mock data - replace with actual API calls
  const mockTickets = [
    {
      id: 1,
      title: "Unable to generate reports in Sales module",
      description: "User reports that the export feature in sales reports is not working. Error occurs when trying to download PDF reports.",
      category: "Feature Request",
      priority: "High",
      status: "Open",
      requester: "john.smith@company.com",
      requesterName: "John Smith",
      assignedTo: "Technical Support",
      createdAt: "2024-03-01T10:30:00Z",
      updatedAt: "2024-03-01T10:30:00Z",
      responses: [
        {
          id: 1,
          author: "System",
          message: "Ticket created automatically from user report",
          timestamp: "2024-03-01T10:30:00Z",
          isInternal: false
        }
      ]
    },
    {
      id: 2,
      title: "Login issues with multi-factor authentication",
      description: "Several users cannot complete MFA setup. The QR code appears to be corrupted and mobile app cannot scan it.",
      category: "System Usage",
      priority: "Critical",
      status: "In Progress", 
      requester: "sarah.johnson@company.com",
      requesterName: "Sarah Johnson",
      assignedTo: "Technical Support",
      createdAt: "2024-02-28T14:15:00Z",
      updatedAt: "2024-03-01T09:20:00Z",
      responses: [
        {
          id: 1,
          author: "System", 
          message: "Ticket created from user support request",
          timestamp: "2024-02-28T14:15:00Z",
          isInternal: false
        },
        {
          id: 2,
          author: "Tech Support",
          message: "Investigating MFA service. Found issue with QR code generation service.",
          timestamp: "2024-03-01T09:20:00Z", 
          isInternal: true
        }
      ]
    },
    {
      id: 3,
      title: "Request for bulk contact import feature",
      description: "Customer requests ability to import contacts from CSV files with more than 1000 rows. Current limitation is 500 rows.",
      category: "Feature Request", 
      priority: "Medium",
      status: "Resolved",
      requester: "michael.brown@company.com",
      requesterName: "Michael Brown",
      assignedTo: "Technical Support",
      createdAt: "2024-02-25T16:45:00Z",
      updatedAt: "2024-03-01T08:30:00Z",
      responses: [
        {
          id: 1,
          author: "System",
          message: "Feature request submitted through feedback form",
          timestamp: "2024-02-25T16:45:00Z",
          isInternal: false
        },
        {
          id: 2,
          author: "Tech Support",
          message: "Forwarded to development team for feasibility analysis",
          timestamp: "2024-02-26T10:20:00Z",
          isInternal: true
        },
        {
          id: 3,
          author: "Tech Support", 
          message: "Feature has been implemented in version 2.1. Bulk import now supports up to 5000 rows.",
          timestamp: "2024-03-01T08:30:00Z",
          isInternal: false
        }
      ]
    },
    {
      id: 4,
      title: "Calendar integration not syncing events",
      description: "Google Calendar integration appears to be broken. Events created in CRM are not appearing in Google Calendar.",
      category: "System Usage",
      priority: "High",
      status: "Open",
      requester: "lisa.wilson@company.com",  
      requesterName: "Lisa Wilson",
      assignedTo: "Technical Support",
      createdAt: "2024-03-01T11:20:00Z",
      updatedAt: "2024-03-01T11:20:00Z",
      responses: [
        {
          id: 1,
          author: "System",
          message: "Issue reported through in-app help desk",
          timestamp: "2024-03-01T11:20:00Z",
          isInternal: false
        }
      ]
    },
    {
      id: 5,
      title: "Dashboard widgets not loading properly",
      description: "Several dashboard widgets show loading spinner indefinitely. Affects sales performance and pipeline widgets.",
      category: "Bug Report",
      priority: "Medium", 
      status: "In Progress",
      requester: "david.garcia@company.com",
      requesterName: "David Garcia", 
      assignedTo: "Technical Support",
      createdAt: "2024-02-29T13:10:00Z",
      updatedAt: "2024-03-01T10:45:00Z",
      responses: [
        {
          id: 1,
          author: "System",
          message: "Bug report submitted with browser console logs",
          timestamp: "2024-02-29T13:10:00Z",
          isInternal: false
        },
        {
          id: 2,
          author: "Tech Support",
          message: "Identified issue with API caching. Working on fix.",
          timestamp: "2024-03-01T10:45:00Z",
          isInternal: true
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchTickets = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTickets(mockTickets);
        setFilteredTickets(mockTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast.error('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Filter tickets based on search and filters
  useEffect(() => {
    let filtered = tickets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.requester.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter  
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'text-red-700 bg-red-100';
      case 'In Progress':
        return 'text-yellow-700 bg-yellow-100';
      case 'Resolved':
        return 'text-green-700 bg-green-100';
      case 'Closed':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-700 bg-red-100';
      case 'High':
        return 'text-orange-700 bg-orange-100';
      case 'Medium':
        return 'text-blue-700 bg-blue-100';
      case 'Low':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Critical':
      case 'High':
        return <FiArrowUp className="h-4 w-4" />;
      case 'Medium':
        return <FiArrowRight className="h-4 w-4" />;
      case 'Low':
        return <FiArrowDown className="h-4 w-4" />;
      default:
        return <FiArrowRight className="h-4 w-4" />;
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    setTicketResponse('');
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
          : ticket
      ));
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleAddResponse = async () => {
    if (!ticketResponse.trim()) return;

    try {
      const newResponse = {
        id: Date.now(),
        author: "Tech Support",
        message: ticketResponse,
        timestamp: new Date().toISOString(),
        isInternal: false
      };

      setTickets(prev => prev.map(ticket =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              responses: [...ticket.responses, newResponse],
              updatedAt: new Date().toISOString()
            }
          : ticket  
      ));

      setSelectedTicket(prev => ({
        ...prev,
        responses: [...prev.responses, newResponse]
      }));

      setTicketResponse('');
      toast.success('Response added successfully');
    } catch (error) {
      toast.error('Failed to add response');
    }
  };

  // Pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Support Tickets</h1>
        <p className="text-gray-600">Handle user tickets regarding system usage and features</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="System Usage">System Usage</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Bug Report">Bug Report</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="cursor-pointer" onClick={() => handleTicketClick(ticket)}>
                      <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        #{ticket.id} {ticket.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {ticket.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiUser className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{ticket.requesterName}</div>
                        <div className="text-sm text-gray-500">{ticket.requester}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      <FiTag className="h-3 w-3 mr-1" />
                      {ticket.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityIcon(ticket.priority)}
                      <span className="ml-1">{ticket.priority}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(ticket.status)}`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiCalendar className="h-4 w-4 mr-1" />
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleTicketClick(ticket)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <FiMoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center">
              <p className="text-sm text-gray-700">
                Showing {indexOfFirstTicket + 1} to {Math.min(indexOfLastTicket, filteredTickets.length)} of {filteredTickets.length} tickets
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Ticket #{selectedTicket.id}
                </h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {getPriorityIcon(selectedTicket.priority)}
                    <span className="ml-1">{selectedTicket.priority}</span>
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {selectedTicket.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Ticket Details */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedTicket.title}</h3>
                <p className="text-gray-700 mb-4">{selectedTicket.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Requester:</span>
                    <p className="text-gray-700">{selectedTicket.requesterName}</p>
                    <p className="text-gray-500">{selectedTicket.requester}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Created:</span>
                    <p className="text-gray-700">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Responses</h4>
                <div className="space-y-4">
                  {selectedTicket.responses.map((response) => (
                    <div key={response.id} className={`p-4 rounded-lg ${response.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{response.author}</span>
                        <span className="text-xs text-gray-500">{new Date(response.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700">{response.message}</p>
                      {response.isInternal && (
                        <span className="inline-flex px-1 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800 mt-2">
                          Internal Note
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Response Input */}
            <div className="border-t border-gray-200 p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Response
                </label>
                <textarea
                  value={ticketResponse}
                  onChange={(e) => setTicketResponse(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your response to the user..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleAddResponse}
                  disabled={!ticketResponse.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <FiSend className="h-4 w-4 mr-2" />
                  Send Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}