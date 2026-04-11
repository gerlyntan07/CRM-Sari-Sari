import React, { useState, useEffect } from "react";
import { X, User, Lock, Shield, Upload } from "lucide-react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api";

// Utility to generate a random password
function generatePassword(length = 12) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";
  for (let i = 0; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  return password;
}

// Utility to map display role values to database values
function mapRoleToDatabase(displayRole) {
  const roleMap = {
    "Admin (CEO)": "CEO",
    "Group Manager": "Group Manager",
    "Manager": "Manager",
    "Sales": "Sales",
  };
  return roleMap[displayRole] || displayRole;
}

// Utility to map database role values to display values
function mapRoleToDisplay(dbRole) {
  const roleMap = {
    "CEO": "Admin (CEO)",
    "Group Manager": "Group Manager",
    "Manager": "Manager",
    "Sales": "Sales",
  };
  return roleMap[dbRole] || dbRole;
}

export default function AddUserForm({ onClose, onSuccess, editMode = false, initialData = null, tenantId = null, initialResetPasswordMode = false }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    password: "",
    profile_picture: null,
    phone_number: "",
    is_active: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [resetPasswordMode, setResetPasswordMode] = useState(initialResetPasswordMode);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (editMode && initialData) {
      console.log("Edit mode - Loading user data:", {
        name: `${initialData.first_name} ${initialData.last_name}`,
        profile_picture: initialData.profile_picture ? "EXISTS" : "MISSING"
      });
      
      setFormData({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        email: initialData.email || "",
        role: mapRoleToDisplay(initialData.role) || "",
        password: "",
        profile_picture: null,
        phone_number: initialData.phone_number || "",
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
      
      // Set profile picture preview if it exists
      if (initialData.profile_picture) {
        console.log("Setting profile picture preview");
        setProfilePicturePreview(initialData.profile_picture);
      } else {
        console.log("No profile picture in initialData");
        setProfilePicturePreview(null);
      }
    } else {
      // Reset for add mode
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        role: "",
        password: "",
        profile_picture: null,
        phone_number: "",
        is_active: true,
      });
      setProfilePicturePreview(null);
    }
  }, [editMode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "profile_picture") {
      const file = files[0];
      setFormData({ ...formData, profile_picture: file });
      // Create preview URL
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePicturePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setProfilePicturePreview(null);
      }
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({
      ...formData,
      password: newPassword,
    });
  };

  const handleGenerateResetPassword = () => {
    const generatedPassword = generatePassword();
    setNewPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!newPassword.trim()) {
        toast.error("New password is required");
        setLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters long");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      // Reset password via backend
      const resetData = new FormData();
      resetData.append("password", newPassword.trim());

      const response = await api.put(
        `/users/resetpassword/${initialData.id}`,
        resetData,
        {
          headers: { "Content-Type": undefined }
        }
      );

      toast.success("Password reset successfully");
      setNewPassword("");
      setConfirmPassword("");
      setResetPasswordMode(false);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.first_name.trim()) {
        toast.error("First name is required");
        setLoading(false);
        return;
      }

      if (!formData.last_name.trim()) {
        toast.error("Last name is required");
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        toast.error("Email is required");
        setLoading(false);
        return;
      }

      if (!formData.role) {
        toast.error("Role is required");
        setLoading(false);
        return;
      }

      if (!editMode) {
        if (!formData.password) {
          toast.error("Password is required");
          setLoading(false);
          return;
        }

        if (formData.password.length < 8) {
          toast.error("Password must be at least 8 characters long");
          setLoading(false);
          return;
        }
      }

      const submissionData = new FormData();
      submissionData.append("first_name", formData.first_name);
      submissionData.append("last_name", formData.last_name);
      submissionData.append("email", formData.email);
      submissionData.append("role", mapRoleToDatabase(formData.role));

      // Check if profile picture was removed during edit
      const profilePictureWasRemoved = editMode && initialData?.profile_picture && profilePicturePreview === null;

      // Include profile picture if it's a new File (not existing image)
      if (formData.profile_picture && typeof formData.profile_picture === "object") {
        submissionData.append("profile_picture", formData.profile_picture);
      } else if (profilePictureWasRemoved) {
        // Send delete flag if profile picture was removed
        submissionData.append("delete_profile_picture", "true");
      }

      // Include phone number if provided (non-empty) - optional field
      if (formData.phone_number && formData.phone_number.trim()) {
        submissionData.append("phone_number", formData.phone_number.trim());
      } else if (editMode) {
        // If editing and phone number is empty, send empty string to clear it
        submissionData.append("phone_number", "");
      }

      // Include tenant/company ID if provided (for super-admin creating users for specific tenant)
      if (tenantId) {
        submissionData.append("company_id", tenantId);
      }

      // Always include password for create, only if provided for edit
      if (!editMode) {
        submissionData.append("password", formData.password);
      } else if (formData.password) {
        submissionData.append("password", formData.password);
      }

      // Debug: log FormData contents
      console.log("FormData being sent:", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: mapRoleToDatabase(formData.role),
        password: formData.password,
        phone_number: formData.phone_number || "(empty - optional)",
        company_id: tenantId,
        has_profile_picture: formData.profile_picture && typeof formData.profile_picture === "object",
        profile_picture_removed: profilePictureWasRemoved
      });

      let response;
      try {
        if (editMode && initialData?.id) {
          // Update user via FormData endpoint
          response = await api.put(`/users/updateuser-form/${initialData.id}`, submissionData, {
            headers: { "Content-Type": undefined }
          });
        } else {
          // Create new user via FormData endpoint
          response = await api.post("/users/createuser-form", submissionData, {
            headers: { "Content-Type": undefined }
          });
        }
      } catch (error) {
        throw new Error(error.response?.data?.detail || (editMode ? "Failed to update user" : "Failed to add user"));
      }

      toast.success(editMode ? "User updated successfully" : "User added successfully");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.message || (editMode ? "Failed to update user" : "Failed to add user"));
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full rounded-lg border border-gray-300/50 px-4 py-2.5 pr-10 text-sm bg-white/50 backdrop-blur-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition duration-200";

  const label = "text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <style>{`
        input[type="password"]::-webkit-outer-spin-button,
        input[type="password"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="password"]::-ms-reveal {
          display: none;
        }
      `}</style>
      {/* MODAL */}
      <div className="bg-white rounded-3xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "none" }}>
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {resetPasswordMode ? "Reset Password" : (editMode ? "Edit User" : "Add New User")}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {resetPasswordMode ? (
                <>
                  Set a new password for{" "}
                  <span className="font-bold text-gray-900">
                    {initialData?.first_name} {initialData?.last_name}
                  </span>
                </>
              ) : (editMode ? "Update user account information." : "Create a new user account for your platform.")}
            </p>
          </div>

          <button
            onClick={() => {
              if (resetPasswordMode && initialResetPasswordMode) {
                // If opened directly in reset mode, close the modal
                onClose();
              } else if (resetPasswordMode) {
                // If switched to reset mode, go back to edit form
                setResetPasswordMode(false);
              } else {
                // Normal close
                onClose();
              }
            }}
            className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-full p-1 w-10 h-10 flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        {/* RESET PASSWORD MODE */}
        {resetPasswordMode ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50/50 to-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <Lock size={24} className="text-purple-600" />
                <h3 className="font-bold text-gray-900 text-lg">New Password</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={label}>
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateResetPassword}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                    >
                      Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter or generate password"
                      className={input}
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
                  <label className={label}>
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className={input}
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

                <p className="text-xs text-gray-500">Password must be at least 8 characters long.</p>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                }}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold border border-blue-600 shadow transition duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        ) : (
          /* REGULAR USER FORM MODE */
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* USER INFO CARD */}
          <div className="bg-gradient-to-br from-blue-50/50 to-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <User size={24} className="text-blue-600" />
              <h3 className="font-bold text-gray-900 text-lg">User Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={label}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., John"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Doe"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john.doe@company.com"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>
                  Role <span className="text-red-500">*</span>
                </label>
                <select name="role" value={formData.role} onChange={handleChange} className={input}>
                  <option value="" disabled>Select a role</option>
                  <option value="Admin (CEO)">Admin (CEO)</option>
                  <option value="Group Manager">Group Manager</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={label}>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="e.g., +1 (555) 123-4567"
                  className={input}
                />
              </div>

              <div className="md:col-span-2">
                <label className={label}>Profile Picture</label>

                {profilePicturePreview ? (
                  <div className="relative w-full">
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden" style={{ minHeight: '300px' }}>
                      <img src={profilePicturePreview} alt="Profile Preview" className="max-w-full max-h-64 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePicturePreview(null);
                        setFormData({ ...formData, profile_picture: null });
                      }}
                      className="absolute -top-3 -right-3 hover:opacity-80 transition"
                    >
                      <X size={25} className="text-white bg-black rounded-full p-1" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-12 cursor-pointer transition duration-200 bg-gray-50/50 hover:bg-blue-50/30">
                    <div className="text-center">
                      <Upload size={40} className="mx-auto mb-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        Click to upload profile picture
                      </span>
                      <span className="text-xs text-gray-400 block mt-1">PNG, JPG up to 5MB</span>
                    </div>
                    <input
                      type="file"
                      name="profile_picture"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* PASSWORD CARD - Only show in add mode */}
          {!editMode && (
          <div className="bg-gradient-to-br from-purple-50/50 to-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Lock size={24} className="text-purple-600" />
              <h3 className="font-bold text-gray-900 text-lg">
                Password
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={label}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                  >
                    Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editMode}
                    placeholder="Enter or generate password"
                    className={input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700 hover:text-gray-900 focus:outline-none z-10 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <FiEyeOff className="size-5" />
                    ) : (
                      <FiEye className="size-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long.</p>
              </div>


            </div>
          </div>
          )}

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold border border-blue-600 shadow transition duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? editMode ? "Saving..." : "Adding..." : editMode ? "Save Changes" : "Add User"}
            </button>
          </div>
          </form>
        )}
      </div>
    </div>
  );
}
