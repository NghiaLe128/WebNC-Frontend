import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const GoogleLoginSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const email = query.get('email');
  const username = query.get('username');

  const [currentPassword] = useState('Abcde12345@'); // Hiển thị password mặc định
  const [newPassword, setNewPassword] = useState('');

  const handleSetPassword = async () => {
    try {
      const response = await axios.post(
        `http://localhost:4000/user/update-password`,
        {
          email,
          username,
          password: newPassword || currentPassword, // Use the new password if provided, else use the current one
        },
      );

      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Password Updated Successfully!',
          text: 'You can now log in.',
          timer: 2000,
          showConfirmButton: false,
        });

        navigate('/auth');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Update Password',
        text: error.response?.data?.message || 'An error occurred.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Update Your Password</h2>

        {/* Display Username and Email */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Username</label>
          <input
            type="text"
            value={username || ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            value={email || ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>

        {/* Display Current Password */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Current Password</label>
          <input
            type="text"
            value={currentPassword}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>

        {/* New Password Field */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter new password (optional)"
          />
        </div>

        <button
          onClick={handleSetPassword}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-500 transition"
        >
          Update Password
        </button>
      </div>
    </div>
  );
};

export default GoogleLoginSuccess;
