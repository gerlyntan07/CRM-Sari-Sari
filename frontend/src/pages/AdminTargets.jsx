import React from "react";
import { useAuth } from "../hooks/useAuth";
import TargetDashboard from "../components/TargetDashboard";

export default function AdminTargets() {
  const { userRole } = useAuth();
  
  // Get user ID from backend via API or token (you may need to add this)
  // For now, we'll let the API determine it from the auth token
  const currentUserId = null; // Backend will use the authenticated user's ID

  return <TargetDashboard currentUserRole={userRole} currentUserId={currentUserId} />;
}