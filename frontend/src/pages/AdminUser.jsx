import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";

export default function AdminUser() {
  const { user } = useFetchUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
  });

  // ✅ Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/all");
        setUsers(res.data);
      } catch (error) {
        console.error("❌ Error fetching users:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Filter users for search
  const filteredUsers = users.filter(
    (u) =>
      `${u.first_name} ${u.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors = {
    Admin: "bg-red-100 text-red-700",
    Manager: "bg-blue-100 text-blue-700",
    Sales: "bg-green-100 text-green-700",
  };

  // ✅ Add new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.firstName || !newUser.email) return;

    try {
      const res = await api.post("/users/createuser", {
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });

      const createdUser = res.data;
      setUsers((prev) => [...prev, { ...createdUser, highlight: true }]);
      setShowAddModal(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "",
      });

      alert("✅ User created successfully!");
      setTimeout(() => {
        setUsers((prev) => prev.map((u) => ({ ...u, highlight: false })));
      }, 2000);
    } catch (error) {
      console.error("❌ Error creating user:", error.response?.data || error);
      alert(error.response?.data?.detail || "Failed to add user.");
    }
  };

  // ✅ Open delete confirmation modal
  const confirmDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // ✅ Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/users/deleteuser/${selectedUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      alert("✅ User deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting user:", error.response?.data || error);
      alert(error.response?.data?.detail || "Failed to delete user.");
    }
  };

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FiShield className="text-xl text-gray-700" />
          <h1 className="text-xl font-semibold text-gray-800">
            User Management
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <FiUserPlus className="text-sm" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[250px]">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <p className="p-6 text-gray-500 text-center">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-6 text-gray-400 text-center">
            No users found. Click “Add User” to create one.
          </p>
        ) : (
          <table className="min-w-full text-sm text-gray-700">
            <thead className="border-b bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b transition-all duration-300 ${
                    u.highlight ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-4">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-md ${
                        roleColors[u.role] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center space-x-3">
                    <button className="text-gray-600 hover:text-yellow-600">
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => confirmDelete(u)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🟢 Add User Modal (with blur background) */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative animate-fadeIn">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-xl" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Add New User
            </h2>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    required
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    required
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="john.doe@company.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="flex mt-1 gap-2">
                  <input
                    type="text"
                    placeholder="Enter or generate password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const chars =
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                      let pass = "";
                      for (let i = 0; i < 8; i++) {
                        pass += chars.charAt(
                          Math.floor(Math.random() * chars.length)
                        );
                      }
                      setNewUser({ ...newUser, password: pass });
                    }}
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  required
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                >
                  <option value="">Select role</option>
                  <option value="SALES">
                    Sales 
                  </option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  <FiUserPlus className="text-sm" /> Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟥 Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-xl" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Are you sure you want to delete{" "}
              <span className="font-bold">{selectedUser?.first_name}</span>?
            </h2>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
