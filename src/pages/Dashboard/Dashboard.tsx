import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function Dashboard() {
  const { userId, userName } = useAuth();
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 relative ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
      }`}
      style={{
        background: isDarkMode
          ? "linear-gradient(to bottom right, #1e3c72, #243b55)"
          : "linear-gradient(to bottom right, #1e3c72, #2a5298, #6dd5ed)",
      }}
    >
      {/* Welcome Section */}
      <h1 className="text-4xl font-extrabold text-center text-white mb-6 shadow-lg">
        Welcome,{" "}
        <span
          className={`text-transparent bg-clip-text ${
            isDarkMode
              ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
              : "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500"
          } animate-pulse`}
        >
          {userId ? userName : "Guest"}
        </span>
        !
      </h1>

      {/* Project Title Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl text-white font-bold tracking-wide">FINAL PROJECT</h2>
        <p className="text-lg text-white italic tracking-wide">
          <span className="font-medium">PROJECT:</span> AI-POWERED STUDY PLANNER
        </p>
      </div>

      {/* Card Section */}
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 text-white"
            : "bg-white text-gray-800"
        } bg-opacity-80 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-2xl w-full mt-8`}
      >
        <h3 className="text-2xl font-bold text-center mb-4">Project Creators</h3>

        {/* Student Details */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Person */}
          <p className="text-lg flex items-center space-x-2">
            <strong className="font-medium">ID1:</strong>
            <span>21127228 - Nguyễn Gia Bảo</span>
          </p>
          {/* Second Person */}
          <p className="text-lg flex items-center space-x-2">
            <strong className="font-medium">ID2:</strong>
            <span>21127654 - Nguyễn Đức Nhã</span>
          </p>

          {/* Third Person */}
          <p className="text-lg flex items-center space-x-2 col-span-2 justify-self-center">
            <strong className="font-medium">ID3:</strong>
            <span>21127116 - Nguyễn Lê Thanh Nghĩa</span>
          </p>
        </div>

        {/* Class & Supervisors */}
        <div className="border-t mt-6 pt-4 space-y-2">
          <p className="text-lg flex items-center space-x-2">
            <strong className="font-medium">Class:</strong>
            <span>21KTPM2 | University of Science, VNU-HCM</span>
          </p>
          <p className="text-lg flex items-center space-x-2">
            <strong className="font-medium">Supervisors:</strong>
            <span>
              Nguyễn Huy Khánh (Theory), Mai Anh Tuấn (Practice), Đỗ Nguyên Kha
              (Practice), Trần Duy Quang (Practice)
            </span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm opacity-70">
        © 2024 AI-Powered Study Planner Team. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;
