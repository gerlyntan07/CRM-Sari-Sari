// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./hooks/protectedRoute.jsx";

// 🔹 Public pages
import Landing from "./pages/Landing";
import Header from "./components/Header";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPass from "./pages/ForgotPass";
import PublicManageAccount from './pages/PublicManageAccount.jsx';
import Resources from "./pages/Resources";
import Legal from "./pages/Legal";

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
import AdminManageAccount from "./pages/AdminManageAccount";
import AdminDeals from "./pages/AdminDeals";
import AdminDealsInformation from "./components/AdminDealsInformation";
import AdminDealsQuickAction from "./components/AdminDealsQuickAction";
import AdminTask from "./pages/AdminTask";
import AdminTerritory from "./pages/AdminTerritory";
import AdminCalls from "./pages/AdminCalls";
import AdminMeeting from "./pages/AdminMeeting";
import AdminCompanyDetails from "./components/AdminCompanyDetails";
import AdminHelp from "./pages/AdminHelp";
import AdminCalendar from "./pages/AdminCalendar";

// 🔹 Super Admin layout + pages
import SuperAdminPanel from "./components/SuperAdminPanel";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

// 🔹 Sales layout + pages
import SalesPanel from "./components/SalesPanel";
import SalesOverview from "./pages/SalesOverview";
//import SalesHub from "./pages/SalesHub"; // ✅ fixed typo
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
import SalesAudit from "./pages/SalesAudit";
import SalesTask from "./pages/SalesTask";
import SalesMeetings from "./pages/SalesMeetings";
import SalesCalls from "./pages/SalesCalls";
import SalesCalendar from "./pages/SalesCalendar";


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
import ManagerCalendar from "./pages/ManagerCalendar";

// 🔹 Marketing layout + pages
import MarketingPanel from "./components/MarketingPanel";
import MarketingDashboard from "./pages/MarketingDashboard";
import MarketingAccounts from "./pages/MarketingAccounts";
import MarketingContacts from "./pages/MarketingContacts";
import MarketingLeads from "./pages/MarketingLeads";
import MarketingLeadsInformation from "./components/MarketingLeadsInformation";
import MarketingLeadsConvert from "./components/MarketingLeadsConvert";
import MarketingTask from "./pages/MarketingTask";
import MarketingCampaign from "./pages/MarketingCampaign";
import MarketingTemplates from "./pages/MarketingTemplates";

// 🔹 Print pages
import QuotePrintPage from "./pages/QuotePrintPage";

// 🔹 Team Manager layout + pages
import TManagerPanel from "./components/TManagerPanel";
import TManagerDashboard from "./pages/TManagerDashboard";
import TManagerAccounts from "./pages/TManagerAccounts";
import TManagerContacts from "./pages/TManagerContacts";
import TManagerLeads from "./pages/TManagerLeads";
import TManagerLeadsInformation from "./components/TManagerLeadsInformation";
import TManagerLeadsConvert from "./components/TManagerLeadsConvert";
import TManagerDeals from "./pages/TManagerDeals";
import TManagerDealsInformation from "./components/TManagerDealsInformation";
import TManagerDealsQuickAction from "./components/TManagerDealsQuickAction";
import TManagerQuotes from "./pages/TManagerQuotes";
import TManagerTargets from "./pages/TManagerTargets";
import TManagerTask from "./pages/TManagerTask";
import TManagerMeetings from "./pages/TManagerMeetings";
import TManagerCalls from "./pages/TManagerCalls";
import TManagerAudit from "./pages/TManagerAudit";
import TManagerUser from "./pages/TManagerUser";
import TManagerCalendar from "./pages/TManagerCalendar";

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
        <Route path="/resources" element={<Resources />} />
        <Route path="/legal" element={<Legal />} />        

        {/* ================= Print Routes (Standalone) ================= */}
        <Route
          path="/admin/quotes/:quoteId/print"
          element={
            <PrivateRoute requiredRole="ceo">
              <QuotePrintPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sales/quotes/:quoteId/print"
          element={
            <PrivateRoute requiredRole="sales">
              <QuotePrintPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/quotes/:quoteId/print"
          element={
            <PrivateRoute requiredRole="manager">
              <QuotePrintPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/group-manager/quotes/:quoteId/print"
          element={
            <PrivateRoute requiredRole="group manager">
              <QuotePrintPage />
            </PrivateRoute>
          }
        />

        {/* ================= Super Admin Layout ================= */}
        <Route path="/super-admin" element={<PrivateRoute requiredRole="admin"><SuperAdminPanel /></PrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
        </Route>

        {/* ================= Admin Layout ================= */}
        <Route path="/admin" element={<PrivateRoute requiredRole="ceo"><AdminPanel /></PrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="leads/:leadID" element={<AdminLeadsInformation />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="targets" element={<AdminTargets />} />
          <Route path="quotes" element={<AdminQuotes />} />
          <Route path="users" element={<AdminUser />} />
          <Route path="manage-account" element={<AdminManageAccount />} />
          <Route path="company-details" element={<AdminCompanyDetails/>}/>
          <Route path="deals" element={<AdminDeals />} />
          <Route path="deals/info" element={<AdminDealsInformation />} />
          <Route path="deals/quickaction" element={<AdminDealsQuickAction />} />
          <Route path="tasks" element={<AdminTask />} />
          <Route path="/admin/territory">
            <Route index element={<AdminTerritory />} />
            <Route path=":id" element={<AdminTerritory />} />
          </Route>
          <Route path="calls" element={<AdminCalls />} />
          <Route path="calls/info" element={<AdminCalls />} />
          <Route path="meetings" element={<AdminMeeting />} />
          <Route path="meetings/info" element={<AdminMeeting />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="help" element={<AdminHelp />} />
        </Route>

        {/* ================= Sales Layout ================= */}
        <Route path="/sales" element={<PrivateRoute requiredRole="sales"><SalesPanel /></PrivateRoute>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SalesOverview />} />
          <Route path="accounts" element={<SalesAccounts />} />
          <Route path="contacts" element={<SalesContacts />} />
          <Route path="leads" element={<SalesLeads />} />
          <Route path="leads/info" element={<SalesLeadsInformation />} />
          <Route path="leads/convert" element={<SalesLeadsConvert />} />
          <Route path="deals" element={<SalesDeals />} />
          <Route path="deals/info" element={<SalesDealsInformation />} />
          <Route path="deals/quickaction" element={<SalesDealsQuickAction />} />
          <Route path="quotes" element={<SalesQuotes />} />
          <Route path="targets" element={<SalesTargets />} />
          <Route path="audit" element={<SalesAudit />} />
          <Route path="manage-account" element={<PublicManageAccount />} />
          <Route path="/sales/territory">
            <Route index element={<AdminTerritory />} />
            <Route path=":id" element={<AdminTerritory />} />
          </Route>

            <Route path="meetings" element={<SalesMeetings />} />
          <Route path="calls" element={<SalesCalls />} />
          <Route path="tasks" element={<SalesTask />} />
          <Route path="calendar" element={<SalesCalendar />} />

        {/* <Route path="hub/*" element={<SalesHub />}>
            <Route index element={<Navigate to="mytasks" replace />} />
            <Route path="activities" element={<SalesActivities />} />
            <Route path="mytasks" element={<SalesMyTask />} />
            <Route path="pipeline" element={<SalesPipeline />} />
            <Route path="performance" element={<SalesPerformance />} />            
          </Route> */}
        </Route>

        {/* ================= Manager Layout ================= */}
        <Route path="/manager" element={<PrivateRoute requiredRole="manager"><ManagerPanel /></PrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="accounts" element={<ManagerAccounts />} />
          <Route path="contacts" element={<ManagerContacts />} />
          <Route path="leads" element={<ManagerLeads />} />
          <Route path="leads/info" element={<ManagerLeadsInformation />} />
          <Route path="leads/convert" element={<ManagerLeadsConvert />} />
          <Route path="deals" element={<ManagerDeals />} />
          <Route path="deals/info" element={<ManagerDealsInformation />} />
          <Route
            path="deals/quickaction"
            element={<ManagerDealsQuickAction />}
          />
          <Route path="quotes" element={<ManagerQuotes />} />
          <Route path="targets" element={<ManagerTargets />} />
          <Route path="meetings" element={<ManagerMeetings />} />
          <Route path="audit" element={<ManagerAudit />} />
          <Route path="calls" element={<ManagerCalls />} />
          <Route path="tasks" element={<ManagerTask />} />
          <Route path="calendar" element={<ManagerCalendar />} />
          <Route path="/manager/territory">
            <Route index element={<AdminTerritory />} />
            <Route path=":id" element={<AdminTerritory />} />
          </Route>
          <Route path="users" element={<ManagerUser />} />
          <Route path="manage-account" element={<PublicManageAccount />} />
        </Route>

        {/* ================= Marketing Layout ================= */}
        <Route>
          <Route path="/marketing" element={<PrivateRoute requiredRole="marketing"><MarketingPanel /></PrivateRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MarketingDashboard />} />
            <Route path="accounts" element={<MarketingAccounts />} />
            <Route path="contacts" element={<MarketingContacts />} />
            <Route path="leads" element={<MarketingLeads />} />
            <Route path="leads/info" element={<MarketingLeadsInformation />} />
            <Route path="leads/convert" element={<MarketingLeadsConvert />} />
            <Route path="tasks" element={<MarketingTask />} />
            <Route path="campaigns" element={<MarketingCampaign />} />
            <Route path="templates" element={<MarketingTemplates />} />
            <Route path="manage-account" element={<PublicManageAccount />} />
          </Route>
        </Route>

        {/* ================= Team Manager Layout ================= */}
        <Route path="/group-manager" element={<PrivateRoute requiredRole="group manager"><TManagerPanel /></PrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TManagerDashboard />} />
          <Route path="accounts" element={<TManagerAccounts />} />
          <Route path="contacts" element={<TManagerContacts />} />
          <Route path="leads" element={<TManagerLeads />} />
          <Route path="leads/info" element={<TManagerLeadsInformation />} />
          <Route path="leads/convert" element={<TManagerLeadsConvert />} />
          <Route path="deals" element={<TManagerDeals />} />
          <Route path="deals/info" element={<TManagerDealsInformation />} />
          <Route
            path="deals/quickaction"
            element={<TManagerDealsQuickAction />}
          />
          <Route path="quotes" element={<TManagerQuotes />} />
          <Route path="targets" element={<TManagerTargets />} />
          <Route path="tasks" element={<TManagerTask />} />
          <Route path="/group-manager/territory">
            <Route index element={<AdminTerritory />} />
            <Route path=":id" element={<AdminTerritory />} />
          </Route>
          <Route path="meetings" element={<TManagerMeetings />} />
          <Route path="calls" element={<TManagerCalls />} />
          <Route path="calendar" element={<TManagerCalendar />} />
          <Route path="audit" element={<TManagerAudit />} />
          <Route path="users" element={<TManagerUser />} />
          <Route path="manage-account" element={<PublicManageAccount />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
