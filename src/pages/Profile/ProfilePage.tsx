import React, { useEffect, useState } from "react";
import { FaEnvelope, FaUser, FaLock, FaEdit, FaCamera } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import { UserInfo } from "../../types/type";
import axios from "axios";
import EditProfile from "./EditProfile";
import Swal from "sweetalert2";

const ProFilePage: React.FC = () => {
  const [accessToken] = useState(localStorage.getItem("token"));
  const { isDarkMode } = useTheme();
  const userId = localStorage.getItem("userId");
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<UserInfo>({
    userId: userId || "",
    userName: "",
    userEmail: "",
    userPassword: "",
    avatar: "",
  });
  const [toggleEditProfileModal, setToggleEditProfileModal] =
    useState<boolean>(false);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // Fix TypeScript issue here
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleClosePopup = () => {
    setToggleEditProfileModal(false);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!accessToken || !userId) {
        setShowAlert(true);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:4000/user/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setUserDetails({
          userId: userId || "",
          userName: response.data.data.username,
          userEmail: response.data.data.email,
          userPassword: userDetails.userPassword,
          avatar: response.data.data.avatar || "",
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchUserData();
  }, []); // Run only once on component mount

  useEffect(() => {
    if (!userId || !accessToken) {
      setShowAlert(true);
    }
  }, [userId, accessToken]);

  const handleSave = async (updatedData: UserInfo) => {
    // Update the user details
    setUserDetails(updatedData);

    // Fetch the updated user data from the server
    const userId = localStorage.getItem("userId");
    if (!accessToken || !userId) {
      setShowAlert(true);
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:4000/user/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setUserDetails({
        userId: userId || "",
        userName: response.data.data.username,
        userEmail: response.data.data.email,
        userPassword: userDetails.userPassword,
        avatar: response.data.data.avatar || "", // Ensure avatar is included
      });
    } catch (error) {
      console.error("Failed to fetch updated user data:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string); // TypeScript knows that reader.result is a string here
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) {
      alert("Please select an avatar to upload.");
      return; // Prevent submission if no avatar is selected
    }

    const formData = new FormData();
    formData.append("avatar", avatarFile); // Ensure avatarFile is used here

    try {
      // Sending the request to update the avatar on the server
      const response = await axios.post(
        `http://localhost:4000/user/upload-avatar/${userId}`, // Ensure the URL is correct
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,  // Pass the authorization token
            "Content-Type": "multipart/form-data",  // Set the content type for file upload
          },
        }
      );
      
      // Update the user details with the new avatar URL from the API response
      setUserDetails((prevState) => ({
        ...prevState,
        avatar: response.data.user.avatar, // Ensure the new avatar URL is used
      }));

      // Clear preview and file state
      setAvatarPreview(null);
      setAvatarFile(null);

      Swal.fire({
        icon: "success",
        title: "Avatar updated successfully!",
        showConfirmButton: false,
        timer: 1500, // The modal will close after 1.5 seconds
      });

    } catch (error) {
      console.error("Error updating avatar:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to update avatar",
        text: "There was an error while updating your avatar. Please try again.",
      });
    }
  };

  const handleCancelAvatarChange = () => {
    setAvatarPreview(null);  // Clear preview on cancel
    setAvatarFile(null);     // Clear file state
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500'}`}>
      {/* Alert for unauthenticated access */}
      {showAlert && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className={`text-center p-6 rounded-xl shadow-lg max-w-sm w-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <p className={`text-xl ${isDarkMode ? 'text-red-400' : 'text-red-600'} font-semibold mb-4`}>
              You must log in to access this page.
            </p>
            <button
              onClick={() => (window.location.href = "/auth")}
              className={`py-3 px-10 rounded-full text-lg font-semibold transition duration-300 ease-in-out transform ${isDarkMode
                ? "bg-blue-700 text-white hover:bg-blue-800 hover:scale-105"
                : "bg-blue-500 text-white hover:bg-blue-600 hover:scale-105"
                }`}
            >
              Log In
            </button>
          </div>
        </div>
      )}

      {!showAlert && userId && accessToken && (
        <div className={`bg-white shadow-2xl rounded-3xl overflow-hidden w-full max-w-4xl flex relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Left: Avatar Section */}
          <div className={`flex flex-col items-center justify-center w-1/3 p-8 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gradient-to-b from-indigo-600 to-purple-600 text-white'}`}>
            <img
              className="h-40 w-40 rounded-full border-4 border-white shadow-lg transform transition-all duration-500 hover:scale-105"
              src={avatarPreview || userDetails.avatar || "/user.png"}
              alt="Avatar"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-4"
              style={{ display: 'none' }} // Hide file input
              id="fileInput"
            />
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              className={`flex items-center mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-300 ease-in-out`}
            >
              <FaCamera className="mr-2" />
              <span>Change Avatar</span>
            </button>

            <h2 className="mt-6 text-2xl font-bold">{userDetails.userName}</h2>
            <p className="text-sm text-gray-200">Software Engineer</p>
          </div>

          {/* Right: User Information Section */}
          <div className="flex-1 p-8 relative">
            <button
              onClick={() => setToggleEditProfileModal(!toggleEditProfileModal)}
              className="absolute top-4 right-4 text-indigo-600 hover:text-indigo-800 transition-colors duration-300"
            >
              <FaEdit className="text-2xl" title="Edit Profile" />
            </button>

            <h2 className={`text-3xl font-extrabold text-gray-800 mb-6`}>Profile Information</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <FaEnvelope className="text-indigo-600 text-2xl" />
                <p className="text-lg">
                  Email: <span className={`text-gray-600 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userDetails.userEmail}</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <FaUser className="text-indigo-600 text-2xl" />
                <p className="text-lg">
                  Username: <span className={`text-gray-600 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userDetails.userName}</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <FaLock className="text-indigo-600 text-2xl" />
                <p className="text-lg">
                  Password: <span className={`text-gray-600 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{"*".repeat(10)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Image Preview */}
      {avatarPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className={`bg-white p-8 rounded-2xl shadow-xl max-w-md w-full transition-transform transform scale-95 hover:scale-100 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <h3 className={`text-2xl font-semibold text-center text-gray-800 mb-6`}>Preview Avatar</h3>
            <img
              src={avatarPreview}
              alt="Avatar Preview"
              className="w-32 h-32 object-cover rounded-full border-4 border-gray-300 mx-auto mb-6"
            />
            <div className="flex justify-between gap-4">
              <button
                onClick={handleSaveAvatar}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-300"
              >
                Save
              </button>
              <button
                onClick={handleCancelAvatarChange}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!toggleEditProfileModal ? null : (
        <EditProfile
          onClose={handleClosePopup}
          userData={userDetails}
          onSave={handleSave}
        />
      )}
    </div>

  );
};

export default ProFilePage;
