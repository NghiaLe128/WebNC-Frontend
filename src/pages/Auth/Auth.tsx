import axios from "axios";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async () => {
    navigate("/verify-email", { state: formData });
    /*try {
      const response = await axios.post(`http://localhost:4000/user/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Sign Up Successful!",
          text: "You can now log in.",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsSignUp(false);
      }
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";

      if (error.response) {
        console.error("Sign up error:", error.response.data);
        const errorData = error.response.data;
        errorMessage = errorData.message || errorMessage;
      } else {
        console.error("Sign up error:", error.message);
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Sign Up Failed",
        text: errorMessage,
      });
    }*/
  };

  const handleSignIn = async () => {
    try {
      const response = await axios.post(`http://localhost:4000/user/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 200) {
        const { user_id, user_name, access_token } = response.data;

        // Update login with all data
        login(user_id, user_name, access_token);

        // Call API to update expired tasks
        try {
          await axios.put(
            `http://localhost:4000/task/update-expired-tasks/${user_id}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            }
          );
          console.log("Expired tasks updated successfully");
        } catch (taskError: any) {
          console.error("Error updating expired tasks:", taskError.response?.data || taskError.message);
        }

        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: 'Welcome back!',
          timer: 2000,
          showConfirmButton: false,
        });

        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        navigate("/");
      }

    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";

      if (error.response) {
        console.error("Login error:", error.response.data);
        const errorData = error.response.data;
        errorMessage = errorData.message || errorMessage;
      } else {
        console.error("Login error:", error.message);
        errorMessage = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: errorMessage,
      });
    }
  };

  const handleGoogleLogin = () => {
    // Redirect the user to the Google OAuth endpoint
    window.location.href = `http://localhost:4000/user/auth/google`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleAuthMode = () => setIsSignUp(!isSignUp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.email ||
      !formData.password ||
      (isSignUp && !formData.confirmPassword)
    ) {
      Swal.fire({
        icon: "error",
        title: "Sign Up Failed",
        text: "Please fill all the required fields",
      });

      return;
    }
    if (formData.email)
      if (isSignUp && formData.password !== formData.confirmPassword) {
        Swal.fire({
          icon: "error",
          title: "Sign Up Failed",
          text: "Passwords do not match",
        });
        return;
      }

    if (!isSignUp) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };


  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 flex justify-center items-center">
      <div className="max-w-4xl w-full bg-white shadow-xl rounded-lg flex flex-col lg:flex-row">
        {/* Form Section */}
        <div className="lg:w-1/2 p-8 sm:p-12">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
              {isSignUp ? "Sign Up" : "Sign In"}
            </h1>
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
              {isSignUp && (
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="User Name"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-lg shadow-sm bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                  required
                />
              )}
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-lg shadow-sm bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                required
              />
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-lg shadow-sm bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/3 transform -translate-y-1/2 text-xl"
                >
                  {passwordVisible ? "🙈" : "👁️"}
                </button>
              </div>
              {isSignUp && (
                <div className="relative">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-lg shadow-sm bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="absolute right-3 top-1/3 transform -translate-y-1/2 text-xl"
                  >
                    {confirmPasswordVisible ? "🙈" : "👁️"}
                  </button>
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3 text-white font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-purple-600 hover:to-indigo-500 transition-all duration-300 shadow-md"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
              {!isSignUp && (
                <div className="relative mt-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <img
                      src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png"
                      alt="Google Logo"
                      className="w-5 h-5 mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="absolute right-0 text-indigo-600 font-medium text-sm mt-2 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>
            <p className="text-gray-600 mt-16">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-indigo-600 font-medium hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>

        {/* Illustration Section */}
        <div className="lg:flex-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 hidden lg:flex items-center justify-center">
          <img
            src="https://storage.googleapis.com/devitary-image-host.appspot.com/15848031292911696601-undraw_designer_life_w96d.svg"
            alt="Illustration"
            className="w-3/4 max-w-sm"
          />
        </div>
      </div>
    </div>


  );
};

export default Auth;
