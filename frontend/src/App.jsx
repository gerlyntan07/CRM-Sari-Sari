import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Landing from "./pages/Landing";
import Header from "./components/Header";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPass from "./pages/ForgotPass";

// Admin layout + pages
import AdminPanel from "./components/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccounts from "./pages/AdminAccounts";
import AdminContacts from "./pages/AdminContacts";
import AdminLeads from "./pages/AdminLeads";
import AdminAudit from "./components/AdminAudit";
import AdminTargets from "./pages/AdminTargets";
import AdminQuotes from "./pages/AdminQuotes";
import AdminUser from "./pages/AdminUser";          // ✅ New import


// Sales layout + pages
import SalesPanel from "./components/SalesPanel";
import SalesOverview from "./pages/SalesOverview";

// Manager layout + pages
import ManagerPanel from "./components/ManagerPanel";
import ManagerOverview from "./pages/ManagerOverview";
import ManagerAccounts from "./pages/ManagerAccounts";
import ManagerContacts from "./pages/ManagerContacts";




function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/header" element={<Header />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPass />} />

        {/* Admin Layout */}
        <Route path="/admin" element={<AdminPanel />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} /> {/* ✅ Redirect */}

          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="targets" element={<AdminTargets />} />
          <Route path="quotes" element={<AdminQuotes />} />
          <Route path="users" element={<AdminUser />} />

          {/* Add more admin routes here */}
        </Route>

        {/* Sales Layout */}
        <Route path="/sales" element={<SalesPanel />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SalesOverview />} />

          {/* Manager Layout */}
        <Route path="/manager" element={<ManagerPanel />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ManagerOverview />} />
        <Route path="accounts" element={<ManagerAccounts />} />
        <Route path="contacts" element={<ManagerContacts />} />
        </Route>

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
