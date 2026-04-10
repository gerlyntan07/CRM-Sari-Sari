import React from 'react';
import { X } from 'lucide-react';

const UserDetailsModal = ({ open, user, onClose }) => {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: "none" }}>
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100 p-8">
          <div className="flex items-center gap-4 flex-1">
            {/* Profile Picture - Circular */}
            {user.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt={`${user.first_name} ${user.last_name}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl border-2 border-gray-200">
                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
              </div>
            )}
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-medium">
                  {user.role}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-full p-1 w-10 h-10 flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        {/* OVERVIEW SECTION */}
        <div className="px-8 pb-8">
          <div className="bg-gradient-to-br from-gray-50/50 to-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-5">Overview</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-medium text-blue-600">{user.email}</p>
              </div>

              {/* Role */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role</p>
                <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-medium inline-block">
                  {user.role}
                </span>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Auth Provider */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Auth Provider</p>
                <p className="text-sm font-medium text-gray-900">{user.auth_provider ? user.auth_provider.charAt(0).toUpperCase() + user.auth_provider.slice(1) : 'Manual'}</p>
              </div>

              {/* Phone Number */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                <p className="text-sm font-medium text-gray-900">{user.phone_number ? user.phone_number : '—'}</p>
              </div>

              {/* Company */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Company</p>
                <p className="text-sm font-medium text-gray-900">{user.company && user.company.company_name ? user.company.company_name : '—'}</p>
              </div>

              {/* Company Number */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Company Number</p>
                <p className="text-sm font-medium text-gray-900">{user.company && user.company.company_number ? user.company.company_number : '—'}</p>
              </div>

              {/* Related to CEO */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Related to CEO</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.manager && user.manager.first_name && user.manager.last_name
                    ? `${user.manager.first_name} ${user.manager.last_name}`
                    : 'N/A'}
                </p>
              </div>

              {/* Created At */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created At</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.created_at ? new Date(user.created_at).toLocaleString() : '—'}
                </p>
              </div>

              {/* Last Login */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last Login</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
