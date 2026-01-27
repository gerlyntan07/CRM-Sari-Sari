import React, { useState, useEffect, useRef } from "react";
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiEdit2, FiEye, FiEyeOff, FiCamera, FiInfo } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import LoadingSpinner from "../components/LoadingSpinner";

const getUserInitials = (firstName, lastName) => {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "U";
};

export default function AdminManageAccount() {
  const { user: currentUser, loading: userLoading, fetchUser } = useFetchUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null); // New uploaded picture (base64)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null); // What to display
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.first_name || "",
        lastName: currentUser.last_name || "",
        email: currentUser.email || "",
        phoneNumber: currentUser.phone_number || "",
      });
      // Show the same profile picture as shown in AdminHeader
      // This includes default avatars, user-uploaded images, or Google profile pictures
      setProfilePicturePreview(currentUser.profile_picture || null);
    }
  }, [currentUser]);

  useEffect(() => {
    document.title = "Manage Account | Sari-Sari CRM";
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview - show the new uploaded image
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result); // Store new uploaded picture
      setProfilePicturePreview(reader.result); // Show the new picture
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = () => {
    // Remove the uploaded picture and go back to original
    setProfilePicture(null);
    setProfilePicturePreview(currentUser?.profile_picture || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.warn("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone_number: formData.phoneNumber.trim() || null,
      };

      // Add profile picture if changed
      if (profilePicture !== null) {
        payload.profile_picture = profilePicture;
      }

      await api.put("/users/me", payload);
      await fetchUser();
      setIsEditing(false);
      setProfilePicture(null); // Reset uploaded picture state
      // profilePicturePreview will be updated by useEffect when currentUser changes
      
      // Dispatch custom event to notify AdminHeader to refresh user data
      window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      
      toast.success("Account information updated successfully!");
    } catch (error) {
      console.error("Error updating account:", error);
      const message =
        error.response?.data?.detail ||
        "Failed to update account information. Please try again.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.warn("Please fill in all password fields.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.warn("Password must be at least 8 characters long.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warn("New password and confirm password do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const payload = {
        password: passwordData.newPassword,
      };

      await api.put("/users/me", payload);
      await fetchUser(); // Refresh user data after password change
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Dispatch custom event to notify AdminHeader to refresh user data
      window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      
      setChangingPassword(false);
      toast.success("Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
      const message =
        error.response?.data?.detail ||
        "Failed to change password. Please try again.";
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-2 lg:p-8 font-inter relative">
      {(userLoading || !currentUser) && <LoadingSpinner />}
      {currentUser && (
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
            Manage Your Account
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Update your account information and change your password
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">          
    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              Profile Information
            </h2>
                     <div className="flex justify-center lg:justify-end w-full sm:w-auto">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition text-sm"
              >
                <FiEdit2 />
                Edit Profile
              </button>
            )}
          </div>
          </div>

          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex-shrink-0 relative group">
              {profilePicturePreview ? (
                <div className="relative">
                  <img
                    src={profilePicturePreview}
                    alt={`${currentUser.first_name} ${currentUser.last_name}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-semibold border-2 border-gray-200 shadow-sm">
                  {getUserInitials(currentUser.first_name, currentUser.last_name)}
                </div>
              )}
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    id="profile-picture-upload"
                  />
                  <label
                    htmlFor="profile-picture-upload"
                    className="cursor-pointer bg-gray-900 text-white p-1.5 rounded-full shadow-lg hover:bg-gray-800 transition flex items-center justify-center border-2 border-white"
                    title="Change profile picture"
                  >
                    <FiCamera size={14} />
                  </label>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {currentUser.first_name} {currentUser.last_name}
              </h3>
              <p className="text-gray-600 text-sm">{currentUser.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: currentUser.first_name || "",
                      lastName: currentUser.last_name || "",
                      email: currentUser.email || "",
                      phoneNumber: currentUser.phone_number || "",
                    });
                    setProfilePicture(null);
                    // Reset to show the same profile picture as in AdminHeader
                    setProfilePicturePreview(currentUser.profile_picture || null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition disabled:opacity-70"
                  disabled={saving}
                >
                  <FiSave />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">First Name</p>
                <p className="text-gray-800 font-medium">{currentUser.first_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Name</p>
                <p className="text-gray-800 font-medium">{currentUser.last_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-gray-800 font-medium">{currentUser.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="text-gray-800 font-medium">{currentUser.phone_number || "N/A"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
   <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6 justify-center lg:justify-start">          
      <FiLock className="text-blue-600" />
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  style={showNewPassword ? undefined : { WebkitTextSecurity: "disc" }}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  placeholder="Enter new password (min. 8 characters)"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700 hover:text-gray-900 focus:outline-none z-10 transition-colors cursor-pointer"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <FiEyeOff className="size-5" />
                  ) : (
                    <FiEye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  style={
                    showConfirmPassword ? undefined : { WebkitTextSecurity: "disc" }
                  }
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700 hover:text-gray-900 focus:outline-none z-10 transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="size-5" />
                  ) : (
                    <FiEye className="size-5" />
                  )}
                </button>
              </div>
            </div>

             <div className="pt-4 border-t border-gray-200 flex justify-center lg:justify-start">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition disabled:opacity-70"
                disabled={changingPassword}
              >
                <FiLock />
                {changingPassword ? "Changing Password..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>

          {/* Account Info Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
<h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6 justify-center lg:justify-start">
              <FiInfo className="text-blue-600" />
              Account Information
            </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Role</p>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-md">
                {currentUser.role}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-md ${
                  currentUser.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {currentUser.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Company</p>
              <p className="text-gray-800 font-medium">
                {currentUser.company?.company_name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Auth Provider</p>
              <p className="text-gray-800 font-medium">
                {currentUser.auth_provider
                  ? currentUser.auth_provider.charAt(0).toUpperCase() +
                    currentUser.auth_provider.slice(1)
                  : "N/A"}
              </p>
            </div>
            {currentUser.created_at && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Account Created</p>
                <p className="text-gray-800 font-medium">
                  {new Date(currentUser.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {currentUser.last_login && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Login</p>
                <p className="text-gray-800 font-medium">
                  {new Date(currentUser.last_login).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

