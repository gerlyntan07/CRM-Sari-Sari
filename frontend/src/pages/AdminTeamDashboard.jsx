import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiMessageSquare,
  FiCreditCard,
  FiMail,
  FiSearch,
  FiFilter,
  FiChevronRight,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiClock,
  FiSend,
  FiRefreshCw,
  FiUser,
  FiHeadphones,
  FiActivity,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  getSupportStats,
  getSupportTickets,
  updateSupportTicket,
  getActiveChatSessions,
  assignChatSession,
  closeChatSession,
  getChatMessages,
  sendChatMessage,
  getAllSubscriptions,
  sendOverdueEmail,
  updateSubscriptionStatus,
  getWebSocketUrl,
} from "../api/support";

export default function AdminTeamDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL path
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/tickets")) return "tickets";
    if (path.includes("/chat")) return "chat";
    if (path.includes("/subscriptions")) return "subscriptions";
    return "dashboard";
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState({ status: "", search: "" });
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Chat State
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);
  const wsRef = useRef(null);
  
  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState([]);
  const [subFilter, setSubFilter] = useState({ status: "", search: "" });
  const [sendingEmail, setSendingEmail] = useState(null);
  
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);
  
  // Handle tab change with navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "dashboard") navigate("/support/dashboard");
    else navigate(`/support/${tab}`);
  };

  useEffect(() => {
    document.title = "Admin Team Dashboard | Sari-Sari CRM";
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") loadTickets();
    else if (activeTab === "chat") loadChatSessions();
    else if (activeTab === "subscriptions") loadSubscriptions();
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);
  
  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const loadStats = async () => {
    try {
      const data = await getSupportStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const data = await getSupportTickets(ticketFilter.status ? { status: ticketFilter.status } : {});
      setTickets(data);
    } catch (error) {
      console.error("Failed to load tickets:", error);
      toast.error("Failed to load tickets");
    }
  };

  const loadChatSessions = async () => {
    try {
      const data = await getActiveChatSessions();
      setChatSessions(data);
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const data = await getAllSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      await updateSupportTicket(ticketId, { status, assigned_to: currentUser.id });
      toast.success(`Ticket marked as ${status}`);
      loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error("Failed to update ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleAssignChat = async (sessionId) => {
    try {
      await assignChatSession(sessionId);
      toast.success("Chat session assigned to you");
      loadChatSessions();
    } catch (error) {
      console.error("Failed to assign chat:", error);
      toast.error("Failed to assign chat session");
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    
    // Close existing WebSocket
    if (wsRef.current) wsRef.current.close();
    
    // Load existing messages
    try {
      const messages = await getChatMessages(session.id);
      setChatMessages(messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
    
    // Connect to WebSocket
    const wsUrl = getWebSocketUrl(session.id, currentUser.id, true);
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setChatMessages((prev) => [...prev, {
        id: Date.now(),
        sender_id: data.sender_id,
        message: data.message,
        created_at: data.timestamp,
        sender: { id: data.sender_id },
      }]);
    };
    
    // Assign if not assigned
    if (!session.support_agent_id) {
      handleAssignChat(session.id);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedSession) return;
    
    const messageText = chatInput.trim();
    setChatInput("");
    
    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: messageText }));
    }
    
    // Add to local messages immediately
    setChatMessages((prev) => [...prev, {
      id: Date.now(),
      sender_id: currentUser.id,
      message: messageText,
      created_at: new Date().toISOString(),
      sender: { id: currentUser.id },
    }]);
    
    // Save to database
    try {
      await sendChatMessage({
        session_id: selectedSession.id,
        message: messageText,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedSession) return;
    try {
      await closeChatSession(selectedSession.id);
      toast.success("Chat session closed");
      setSelectedSession(null);
      setChatMessages([]);
      if (wsRef.current) wsRef.current.close();
      loadChatSessions();
    } catch (error) {
      console.error("Failed to close chat:", error);
      toast.error("Failed to close chat session");
    }
  };

  const handleSendOverdueEmail = async (subscriptionId) => {
    setSendingEmail(subscriptionId);
    try {
      const result = await sendOverdueEmail(subscriptionId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send overdue email");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleUpdateSubStatus = async (subscriptionId, status) => {
    try {
      await updateSubscriptionStatus(subscriptionId, status);
      toast.success(`Subscription status updated to ${status}`);
      loadSubscriptions();
    } catch (error) {
      console.error("Failed to update subscription:", error);
      toast.error("Failed to update subscription status");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter.search && !t.subject.toLowerCase().includes(ticketFilter.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredSubs = subscriptions.filter((s) => {
    if (subFilter.status === "overdue" && !s.is_overdue) return false;
    if (subFilter.status && subFilter.status !== "overdue" && s.status !== subFilter.status) return false;
    if (subFilter.search && !s.company_name?.toLowerCase().includes(subFilter.search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Team Dashboard</h1>
        <p className="text-gray-600">Manage support tickets, live chat, and subscriptions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        {[
          { id: "dashboard", label: "Dashboard", icon: FiActivity },
          { id: "tickets", label: "Tickets", icon: FiMessageSquare },
          { id: "chat", label: "Live Chat", icon: FiHeadphones },
          { id: "subscriptions", label: "Subscriptions", icon: FiCreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === tab.id
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_tickets}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiMessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Open Tickets</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.open_tickets}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.in_progress_tickets}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiRefreshCw className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Resolved Tickets</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved_tickets}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Chats</p>
                <p className="text-3xl font-bold text-green-600">{stats.active_chats}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiHeadphones className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Overdue Subscriptions</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue_subscriptions}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="bg-white rounded-xl shadow-md">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={ticketFilter.search}
                onChange={(e) => setTicketFilter((p) => ({ ...p, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              />
            </div>
            <select
              value={ticketFilter.status}
              onChange={(e) => {
                setTicketFilter((p) => ({ ...p, status: e.target.value }));
                setTimeout(loadTickets, 0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <button
              onClick={loadTickets}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Tickets List */}
          <div className="divide-y divide-gray-200">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-800">{ticket.subject}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            ticket.status === "Open"
                              ? "bg-blue-100 text-blue-700"
                              : ticket.status === "In Progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : ticket.status === "Resolved"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            ticket.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : ticket.priority === "Medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Category: {ticket.category}</span>
                        <span>From: {ticket.creator?.first_name} {ticket.creator?.last_name}</span>
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <FiMessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No tickets found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Ticket Details</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-sm text-gray-500">Subject</span>
                <p className="font-medium text-gray-800">{selectedTicket.subject}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <p className="font-medium">{selectedTicket.status}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Priority</span>
                  <p className="font-medium">{selectedTicket.priority}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="font-medium">{selectedTicket.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created</span>
                  <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Submitted By</span>
                <p className="font-medium">
                  {selectedTicket.creator?.first_name} {selectedTicket.creator?.last_name}
                  <span className="text-gray-500 text-sm ml-2">({selectedTicket.creator?.email})</span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Description</span>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              {selectedTicket.status === "Open" && (
                <button
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "In Progress")}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                >
                  Mark In Progress
                </button>
              )}
              {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Closed" && (
                <button
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "Resolved")}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Mark Resolved
                </button>
              )}
              {selectedTicket.status !== "Closed" && (
                <button
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "Closed")}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Tab */}
      {activeTab === "chat" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Active Sessions</h3>
              <button
                onClick={loadChatSessions}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {chatSessions.length > 0 ? (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      selectedSession?.id === session.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {session.user?.first_name} {session.user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                      {!session.support_agent_id && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FiHeadphones className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active chat sessions</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-green-500 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <FiUser className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedSession.user?.first_name} {selectedSession.user?.last_name}
                      </p>
                      <p className="text-xs text-green-100">{selectedSession.user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseChat}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                  >
                    End Chat
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4 max-h-[400px]">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === currentUser.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender_id === currentUser.id
                            ? "bg-green-500 text-white rounded-br-md"
                            : "bg-white shadow-sm border border-gray-200 text-gray-700 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.sender_id === currentUser.id ? "text-green-100" : "text-gray-400"
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition disabled:opacity-50"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FiHeadphones className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a chat session to start responding</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <div className="bg-white rounded-xl shadow-md">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company name..."
                value={subFilter.search}
                onChange={(e) => setSubFilter((p) => ({ ...p, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              />
            </div>
            <select
              value={subFilter.status}
              onChange={(e) => setSubFilter((p) => ({ ...p, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
              <option value="overdue">Overdue Only</option>
            </select>
            <button
              onClick={loadSubscriptions}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEO Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubs.length > 0 ? (
                  filteredSubs.map((sub) => (
                    <tr key={sub.id} className={sub.is_overdue ? "bg-red-50" : ""}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{sub.company_name}</p>
                          <p className="text-xs text-gray-500">{sub.ceo_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {sub.plan_name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              sub.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : sub.status === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {sub.status}
                          </span>
                          {sub.is_overdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3" />
                              {sub.days_overdue}d overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDate(sub.end_date)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{sub.ceo_email || "N/A"}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {sub.is_overdue && sub.ceo_email && (
                            <button
                              onClick={() => handleSendOverdueEmail(sub.id)}
                              disabled={sendingEmail === sub.id}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs flex items-center gap-1 disabled:opacity-50"
                            >
                              {sendingEmail === sub.id ? (
                                <FiRefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <FiMail className="w-3 h-3" />
                              )}
                              Send Reminder
                            </button>
                          )}
                          <select
                            value={sub.status}
                            onChange={(e) => handleUpdateSubStatus(sub.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="Active">Active</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Expired">Expired</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <FiCreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No subscriptions found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
