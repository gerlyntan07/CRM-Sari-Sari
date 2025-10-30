import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

export default function ManagerUser() {
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


  useEffect(() => {
    document.title = "User Management | Sari-Sari CRM";
    const dummyUsers = [
      {
        id: 1,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@company.com",
        role: "Manager",
      },
      {
        id: 2,
        first_name: "John",
        last_name: "Smith",
        email: "john.smith@company.com",
        role: "Sales",
      },
    ];
    setUsers(dummyUsers);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors = {
    CEO: "bg-purple-100 text-purple-700",
    Admin: "bg-red-100 text-red-700",
    GroupManager: "bg-indigo-100 text-indigo-700",
    Manager: "bg-blue-100 text-blue-700",
    Marketing: "bg-yellow-100 text-yellow-700",
    Sales: "bg-green-100 text-green-700",
  };

  const handleAddUser = (e) => {
    e.preventDefault();

    if (!newUser.firstName || !newUser.email || !newUser.role || !newUser.password) {
      alert("⚠️ Please fill in all required fields.");
      return;
    }

    const createdUser = {
      id: users.length + 1,
      first_name: newUser.firstName,
      last_name: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      highlight: true,
    };

    setUsers((prev) => [...prev, createdUser]);
    setShowAddModal(false);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
    });

    alert("✅ User added successfully!");
    setTimeout(() => {
      setUsers((prev) => prev.map((u) => ({ ...u, highlight: false })));
    }, 2000);
  };

  const confirmDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setShowDeleteModal(false);
    alert("✅ User deleted successfully!");
  };

  return (
    <div className="p-4 sm:p-6 relative font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center gap-2">
          <FiShield className="text-xl text-blue-700" />
          <h1 className="text-2xl sm:text-xl font-semibold text-gray-800">
            User Management
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-gray-900 text-white w-full sm:w-auto px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm sm:text-base"
        >
          <FiUserPlus className="text-sm" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-1/3 shadow-sm">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search users by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-2 bg-transparent w-full outline-none text-sm"
          />
        </div>
         <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white shadow-sm cursor-pointer w-full sm:w-auto">
          <option>Users</option>
          <option>Name</option>
          <option>Email</option>
          <option>Role</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-md shadow-sm border border-gray-200">
        {loading ? (
          <p className="p-6 text-gray-500 text-center">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-6 text-gray-400 text-center">
            No users found. Click “Add User” to create one.
          </p>
        ) : (
          <table className="min-w-full text-gray-700 text-xs sm:text-sm">
             <thead className="bg-gray-100 text-left text-gray-600 uppercase">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Email</th>
                <th className="py-3 px-4 whitespace-nowrap">Role</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className={`transition-all duration-300 ${
                    u.highlight ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{u.email}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs sm:text-xs font-semibold rounded-md ${
                        roleColors[u.role] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center space-x-3 whitespace-nowrap">
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 relative animate-fadeIn">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-xl" />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 text-center sm:text-left">
              Add New User
            </h2>

            <form onSubmit={handleAddUser} className="space-y-4">
              {/* First / Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
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
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
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
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row mt-1 gap-2">
                  <input
                    type="text"
                    placeholder="Enter or generate password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
                        pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setNewUser({ ...newUser, password: pass });
                    }}
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition w-full sm:w-auto"
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
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                >
                  <option value="">Select Role</option>
                  <option value="CEO">CEO</option>
                  <option value="Admin">Admin</option>
                  <option value="GroupManager">Group Manager</option>
                  <option value="Manager">Manager</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition w-full sm:w-auto"
                >
                  <FiUserPlus className="text-sm" /> Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-xl" />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 text-center">
              Are you sure you want to delete{" "}
              <span className="font-bold">{selectedUser?.first_name}</span>?
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full sm:w-auto"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition w-full sm:w-auto"
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
