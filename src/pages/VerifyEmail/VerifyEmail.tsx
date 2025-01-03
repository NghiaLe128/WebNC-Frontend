import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const [code, setCode] = useState(Array(9).fill('')); // Initialize with 9 empty fields
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(60); // Countdown in seconds
  const [isCountdownActive, setIsCountdownActive] = useState(false); // To track if countdown is active
  const [emailSent, setEmailSent] = useState(false); // Flag to track if email has already been sent

  const location = useLocation();
  const formData = location.state;
  const [email, setEmail] = useState(formData.email);

  const navigate = useNavigate();

  // Send verify code to your email
  useEffect(() => {
    if (!emailSent) {
      const FetchVerifyCode = async () => {
        try {
          const response = await axios.post(`http://localhost:4000/user/verify-email`, { email });
          setMessage(response.data.message);

          if (response.status === 200) {
            setIsCountdownActive(true); // Start countdown
            setCountdown(60); // Reset countdown
            setEmailSent(true); // Mark email as sent
          }
        } catch (error: any) {
          setMessage(error.response?.data?.message || 'Something went wrong. Please try again.');
        }
      };

      FetchVerifyCode();
    }
  }, [email, emailSent]);

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

  const handleCodeChange = (e: any, index: number) => {
    const newCode = [...code];
    newCode[index] = e.target.value.slice(0, 1); // Limit to one character
    setCode(newCode);

    // Automatically focus on the next input field after entering a number
    if (e.target.value !== '' && index < 8) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleSignUp = async () => {
    const codeInput = code.join('');
    try {
      const response = await axios.post(`http://localhost:4000/user/verify-email-code`, { email, code: codeInput });
      setMessage(response.data.message);
      if (response.status === 200) {
        //If code is correct => begin creating a new account
        try {
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
            navigate("/auth");
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
        }
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500 py-12 px-6">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-2">Verify Email</h1>
        <h2 className="text-1xl text-center">
          We just emailed you a code to{" "}
          <strong>{formData.email}</strong>. Please enter the code below to confirm your email address.
        </h2>

        <div className="mb-2 text-center">
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
          <button
            type="submit"
            onClick={() => handleSignUp()}
            className="w-full py-3 mt-10 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
