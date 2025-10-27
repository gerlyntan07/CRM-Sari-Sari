import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🔹 Public pages
import Landing from "./pages/Landing";
import Header from "./components/Header";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPass from "./pages/ForgotPass";

// 🔹 Admin layout + pages
import AdminPanel from "./components/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccounts from "./pages/AdminAccounts";
import AdminContacts from "./pages/AdminContacts";
import AdminLeads from "./pages/AdminLeads";
import AdminLeadsInformation from "./components/AdminLeadsInformation";
import AdminAudit from "./components/AdminAudit";
import AdminTargets from "./pages/AdminTargets";
import AdminQuotes from "./pages/AdminQuotes";
import AdminUser from "./pages/AdminUser";
import AdminDeals from "./pages/AdminDeals";
import AdminDealsInformation from "./components/AdminDealsInformation";
import AdminDealsQuickAction from "./components/AdminDealsQuickAction";
import AdminTask from "./pages/AdminTask";
import AdminTerritory from "./pages/AdminTerritory";
import AdminCalls from "./pages/AdminCalls";
import AdminMeeting from "./pages/AdminMeeting";
import AdminLeadsConvert from "./components/AdminLeadsConvert";

// 🔹 Sales layout + pages
import SalesPanel from "./components/SalesPanel";
import SalesOverview from "./pages/SalesOverview";
import SalesHub from "./pages/SalesHub"; // ✅ fixed typo
import SalesActivities from "./pages/SalesActivities";
import SalesMyTask from "./pages/SalesMyTask"; // ✅ add this new page
import SalesPipeline from "./pages/SalesPipeline";
import SalesPerformance from "./pages/SalesPerformance";
import SalesAccounts from "./pages/SalesAccounts";
import SalesContacts from "./pages/SalesContacts";
import SalesLeads from "./pages/SalesLeads";
import SalesLeadsInformation from "./components/SalesLeadsInformation";
import SalesLeadsConvert from "./components/SalesLeadsConvert";
import SalesDeals from "./pages/SalesDeals";
import SalesDealsInformation from "./components/SalesDealsInformation";
import SalesDealsQuickAction from "./components/SalesDealsQuickAction";
import SalesQuotes from "./pages/SalesQuotes";
import SalesTargets from "./pages/SalesTargets";


// 🔹 Manager layout + pages
import ManagerPanel from "./components/ManagerPanel";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerAccounts from "./pages/ManagerAccounts";
import ManagerContacts from "./pages/ManagerContacts";
import ManagerLeads from "./pages/ManagerLeads";
import ManagerLeadsInformation from "./components/ManagerLeadsInformation";
import ManagerLeadsConvert from "./components/ManagerLeadsConvert";
import ManagerDeals from "./pages/ManagerDeals";
import ManagerDealsInformation from "./components/ManagerDealsInformation";
import ManagerDealsQuickAction from "./components/ManagerDealsQuickAction";
import ManagerQuotes from "./pages/ManagerQuotes";
import ManagerTargets from "./pages/ManagerTargets";
import ManagerAudit from "./pages/ManagerAudit";
import ManagerCalls from "./pages/ManagerCalls";
import ManagerTask from "./pages/ManagerTask";
import ManagerMeetings from "./pages/ManagerMeetings";
import ManagerUser from "./pages/ManagerUser";



function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        className="z-[9999]"
      />
      <Routes>
        {/* ================= Public Routes ================= */}
        <Route path="/" element={<Landing />} />
        <Route path="/header" element={<Header />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPass />} />

        {/* ================= Admin Layout ================= */}
        <Route path="/admin" element={<AdminPanel />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="leads/info" element={<AdminLeadsInformation />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="targets" element={<AdminTargets />} />
          <Route path="quotes" element={<AdminQuotes />} />
          <Route path="users" element={<AdminUser />} />
          <Route path="deals" element={<AdminDeals />} />
          <Route path="deals/info" element={<AdminDealsInformation />} />
          <Route path="deals/quickaction" element={<AdminDealsQuickAction />} />
          <Route path="tasks" element={<AdminTask/>}/>
          <Route path="territory" element={<AdminTerritory/>}/>
          <Route path="calls" element={<AdminCalls/>}/>
          <Route path="meetings" element={<AdminMeeting/>}/>
           <Route path="leads/convert" element={<AdminLeadsConvert/>} />

        </Route>

        {/* ================= Sales Layout ================= */}
        <Route path="/sales" element={<SalesPanel />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SalesOverview />} />
          <Route path="accounts" element={<SalesAccounts/>}/>
          <Route path="contacts" element={<SalesContacts/>}/>
           <Route path="leads" element={<SalesLeads />} />
            <Route path="leads/info" element={<SalesLeadsInformation />} />
            <Route path="leads/convert" element={<SalesLeadsConvert/>} />\
          <Route path="deals" element={<SalesDeals />} />
          <Route path="deals/info" element={<SalesDealsInformation />} />
          <Route path="deals/quickaction" element={<SalesDealsQuickAction />} />
          <Route path="quotes" element={<SalesQuotes />} />
          <Route path="targets" element={<SalesTargets />} />

          <Route path="hub/*" element={<SalesHub />}>
            <Route index element={<Navigate to="mytasks" replace />} />
            <Route path="activities" element={<SalesActivities />} />
            <Route path="mytasks" element={<SalesMyTask />} />
            <Route path="pipeline" element={<SalesPipeline/>}/>
            <Route path="performance" element={<SalesPerformance/>}/> 
           
          </Route>
        </Route>

        {/* ================= Manager Layout ================= */}
        <Route path="/manager" element={<ManagerPanel />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="accounts" element={<ManagerAccounts />} />
          <Route path="contacts" element={<ManagerContacts />} />
          <Route path="leads" element={<ManagerLeads />} />
          <Route path="leads/info" element={<ManagerLeadsInformation />} />
          <Route path="deals" element={<ManagerDeals />} />
          <Route path="deals/info" element={<ManagerDealsInformation />} />
          <Route path="deals/quickaction" element={<ManagerDealsQuickAction />} />
          <Route path="quotes" element={<ManagerQuotes />} />
          <Route path="targets" element={<ManagerTargets />} />
          <Route path="meetings" element={<ManagerMeetings />} />
          <Route path="audit" element={<ManagerAudit />} />
          <Route path="calls" element={<ManagerCalls />} />
          <Route path="tasks" element={<ManagerTask/>}/>
          <Route path="users" element={<ManagerUser/>}/>
          <Route path="leads/convert" element={<ManagerLeadsConvert/>} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
