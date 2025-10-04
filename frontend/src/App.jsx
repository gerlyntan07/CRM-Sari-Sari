import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Header from "./components/Header";
import Signup from "./pages/Signup";
import AdminPanel from "./components/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/header" element={<Header />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/admin" element={<AdminPanel />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* you can add Accounts, Contacts, etc. later here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
