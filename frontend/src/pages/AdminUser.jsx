import React, { useState } from "react";
import {
    FiShield,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiUserPlus,
    FiMapPin,
    FiX,
} from "react-icons/fi";
import useFetchUser from "../hooks/useFetchUser";


export default function AdminUser() {
    const { user } = useFetchUser();
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [newUser, setNewUser] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "",
    });

    // Empty initial user list (no dummy data)
    const [users, setUsers] = useState([]);

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roleColors = {
        ADMIN: "bg-red-100 text-red-700",
        MANAGER: "bg-blue-100 text-blue-700",
        SALES: "bg-green-100 text-green-700",
    };

    // Add new user
    const handleAddUser = (e) => {
        e.preventDefault();
        if (!newUser.firstName || !newUser.email) return;

        const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();

        setUsers([
            ...users,
            {
                name: fullName,
                email: newUser.email,
                role: newUser.role.toUpperCase(),
                status: "Active",
                permissions: ["Staff"],
            },
        ]);

        setNewUser({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "",
        });
        setShowModal(false);
    };

    // Delete user
    const handleDeleteUser = (index) => {
        const updatedUsers = users.filter((_, i) => i !== index);
        setUsers(updatedUsers);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <FiShield className="text-xl text-gray-700" />
                    <h1 className="text-xl font-semibold text-gray-800">User Management</h1>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                    <FiUserPlus className="text-sm" />
                    Add User
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[250px]">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by name, email,"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                </div>

                <select className="border border-gray-200 rounded-lg px-3 py-2 text-gray-600 min-w-[150px] focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                    <option>All Roles</option>
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Sales</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                <table className="min-w-full text-sm text-gray-700">
                    <thead className="border-b bg-gray-50 text-left text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Permissions</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="text-center py-6 text-gray-400"
                                >
                                    No users found. Click “Add User” to create one.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{user.email}</td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-md ${roleColors[user.role] || "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 bg-gray-900 text-white text-xs rounded-md">
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 space-x-2">
                                        {user.permissions.map((perm, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                                            >
                                                {perm}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="py-3 px-4 text-center space-x-3">
                                        <button className="text-gray-600 hover:text-yellow-600">
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
                        {/* Close button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <FiX className="text-xl" />
                        </button>

                        {/* Header */}
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                            Add New User
                        </h2>

                        {/* Form */}
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

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            {/* Password + Generate Button */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="flex mt-1 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter or generate secure password"
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
                                            let randomPass = "";
                                            for (let i = 0; i < 8; i++) {
                                                randomPass += chars.charAt(Math.floor(Math.random() * chars.length));
                                            }
                                            setNewUser({ ...newUser, password: randomPass });
                                        }}
                                        className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                                    >
                                        Generate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Generates a random 8-character password.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                        <option value="Sales Representative">Sales Representative</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                    <div>
                                        {/* Notes Section */}
                                        <div className="mt-6 w-full">
                                            <div className="bg-gradient-to-r from-blue-50 to-blue-200 border border-blue-300 rounded-xl p-4 shadow-sm w-full">
                                                <div className="flex items-center mb-2">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 text-blue-600 mr-2"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 11-9.95 9.95A10 10 0 0112 2z"
                                                        />
                                                    </svg>
                                                    <h3 className="text-sm font-semibold text-blue-800">
                                                        Important Note
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    Territory can be assigned{" "}
                                                    <span className="font-medium text-gray-900">
                                                        only after adding the user.
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>




                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
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
        </div>
    );
}
