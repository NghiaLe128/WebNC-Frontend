import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { UserInfo } from "../../types/type";
import { useNavigate } from "react-router-dom";

interface EditProfileProps {
  onClose: () => void;
  userData: UserInfo;
  onSave: (updatedData: UserInfo) => void;
}

const EditProfile: React.FC<EditProfileProps> = ({
  onClose,
  userData,
  onSave,
}) => {
  const [formData, setFormData] = useState<UserInfo>(userData);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const email = formData.userEmail;
  const [title, setTitle] = useState("profile");
  const [accessToken] = useState(localStorage.getItem("token"));
  const [code, setCode] = useState(Array(9).fill("")); // Initialize with 9 empty fields
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("profile"); // Step can be 'profile', 'code', or 'password'
  const [countdown, setCountdown] = useState(60); // Countdown in seconds
  const [isCountdownActive, setIsCountdownActive] = useState(false); // To track if countdown is active
  const navigate = useNavigate();

  const handleSave = async () => {
    const updatedUserData = {
      username: formData.userName,
      email: formData.userEmail,
    };

    console.log("userData.userId:", userData.userId);

    if (!userData.userId) {
      console.error("userId is missing");
      Swal.fire({
        title: "Error!",
        text: "User ID is missing. Cannot update profile.",
        icon: "error",
      });
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:4000/user/update-user/${userData.userId}`,
        updatedUserData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      onSave(response.data.data);
      Swal.fire({
        title: "Success!",
        text: "Profile updated successfully.",
        icon: "success",
      });
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to update profile. Please try again later.",
        icon: "error",
      });
    }
  };
  const handleCodeChange = (e: any, index: number) => {
    const newCode = [...code];
    newCode[index] = e.target.value.slice(0, 1); // Limit to one character
    setCode(newCode);

    // Automatically focus on the next input field after entering a number
    if (e.target.value !== "" && index < 8) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };
  const handleSendCode = async (e: any) => {
    setTitle("code");
    setShowChangePassword(!showChangePassword);
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:4000/user/forgot-password`,
        { email }
      );
      setMessage(response.data.message);
      if (response.status === 200) {
        setStep("code");
        setIsCountdownActive(true); // Start countdown
        setCountdown(60); // Reset countdown
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isCountdownActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer); // Clear the interval when the component is unmounted
    };
  }, [isCountdownActive, countdown]);
  const handleCodeSubmit = async (e: any) => {
    e.preventDefault();
    const codeInput = code.join("");
    try {
      const response = await axios.post(
        `http://localhost:4000/user/verify-code`,
        { email, code: codeInput }
      );
      setMessage(response.data.message);
      if (response.status === 200) {
        setStep("password"); // Move to password input step
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  const handleClearCode = () => {
    setCode(Array(9).fill(""));
  };
  const handleRetry = async () => {
    // Reset countdown and initiate a new email send request
    setCountdown(60);
    setIsCountdownActive(true);
    try {
      const response = await axios.post(
        `http://localhost:4000/user/reset-password`,
        { email }
      );
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };
  const handlePasswordChange = async (e: any) => {
    e.preventDefault();
    const password = e.target[0].value; // Lấy mật khẩu mới từ input
    const confirmPassword = e.target[1].value; // Lấy mật khẩu xác nhận từ input
    const updatedPassword = {
      email: formData.userEmail,
      newPassword: password,
    };

    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      Swal.fire({
        title: "Error!",
        text: "Passwords do not match. Please try again.",
        icon: "error",
      });
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:4000/user/reset-password`,
        updatedPassword,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setMessage(response.data.message);
      console.log("response:", response.data);
      onSave(response.data);
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Update Password Successful!",
          text: "You can log in now!",
          timer: 2000,
          showConfirmButton: false,
        });
        navigate("/profile");
      }
      //   setConfirmPassword("");
      //   setPassword("");
      onClose();
    } catch (error) {
      //   setConfirmPassword("");
      //   setPassword("");
      console.error("Failed to update password:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to update password. Please try again later.",
        icon: "error",
      });
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="w-full max-w-2xl p-6 bg-[#e6f4f1] rounded-lg shadow-lg transform transition-all">
        <h1 className="text-3xl text-center px-4 mb-6 py-2 rounded-lg font-bold text-white bg-[#008b8b]">
          {title === "code"
            ? "Verify Code"
            : title === "password"
            ? "Reset Password"
            : "Update Profile"}
        </h1>
        {!showChangePassword ? (
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1 block text-md font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-md font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="userEmail"
                value={formData.userEmail}
                className="w-full border rounded p-2"
                disabled
              />
            </div>

            {/* Change Password Toggle */}
            <div>
              <button
                onClick={handleSendCode}
                className="text-indigo-500 hover:underline"
              >
                {showChangePassword
                  ? "Cancel Change Password"
                  : "Change Password"}
              </button>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-xl">
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-16">
                {title === "code" ? "Enter your code" : "Enter new password"}
              </h1>
              {step === "code" ? (
                <form onSubmit={handleCodeSubmit}>
                  <div className="mb-2 flex justify-between space-x-2">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-input-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(e, index)}
                        className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 focus:border-indigo-500"
                      />
                    ))}
                  </div>

                  {/* Clear All Button */}
                  <div className="text-right mb-6">
                    <button
                      type="button"
                      onClick={handleClearCode}
                      className="py-2 text-sm text-indigo-600 hover:bg-indigo-100 rounded-lg transition duration-300 focus:outline-none"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Verify Code Button */}
                  <div className="flex justify-between mb-4">
                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
                      onClick={() => setTitle("password")}
                    >
                      Verify Code
                    </button>
                  </div>
                </form>
              ) : step === "password" ? (
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-6">
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
                    />
                  </div>
                  <div className="mb-6">
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
                  >
                    Reset Password
                  </button>
                </form>
              ) : null}

              {/* Message and Countdown */}
              {message && (
                <p
                  className={`mt-4 text-center ${
                    message.includes("Error")
                      ? "text-red-500"
                      : "text-green-500"
                  } font-medium`}
                >
                  {message}
                </p>
              )}

              {/* Countdown and Retry Button */}
              {isCountdownActive && countdown > 0 && step !== "password" && (
                <p className="mt-4 text-center text-indigo-600 font-medium">
                  Time remaining: {countdown}s
                </p>
              )}

              {countdown === 0 && step !== "password" && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mx-3 py-2 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mx-3 py-2 px-6 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {/* <div>
              <label className="mb-1 block text-md font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-md font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Save Change Password
              </button>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
