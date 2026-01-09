import React from "react";
import { useAuth } from "../hooks/useAuth";
import TargetDashboard from "../components/TargetDashboard";

export default function TManagerTargets() {
  const { userRole } = useAuth();

  return <TargetDashboard currentUserRole={userRole} currentUserId={null} />;
}
