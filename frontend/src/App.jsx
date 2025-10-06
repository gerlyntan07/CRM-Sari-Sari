import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Header from "./components/Header";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPass from "./pages/ForgotPass";
import AdminPanel from "./components/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccounts from "./pages/AdminAccounts"; 
import AdminContacts from "./pages/AdminContacts";
import AdminAudit from "./components/AdminAudit";

function App() {
  return (
    <Router>
      <Routes> 
        <Route path="/" element={<Landing />} />
        <Route path="/header" element={<Header />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
           <Route path="/forgot-password" element={<ForgotPass />} />

        {/* Admin Layout */}
        <Route path="/admin" element={<AdminPanel />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="contacts" element={<AdminContacts/>}/>
          <Route path="audit" element={<AdminAudit/>}/>
          {/* later you can add more: contacts, reports, etc. */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
