import React from "react";
import { useTheme } from "../../context/ThemeContext";

const HelpPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`min-h-screen p-8 ${
        isDarkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50"
      }`}
    >
      <header className="text-center mb-16">
        <h1
          className={`text-5xl font-extrabold mb-4 drop-shadow-md ${
            isDarkMode ? "text-indigo-200" : "text-indigo-800"
          }`}
        >
          Help Center
        </h1>
        <p
          className={`text-lg ${
            isDarkMode ? "text-gray-300" : "text-black"
          }`}
        >
          Discover how to make the most of the{" "}
          <span
            className={`font-bold decoration-blue-400 ${
              isDarkMode ? "text-indigo-400" : "text-indigo-600"
            }`}
          >
            AI-powered Study Planner
          </span>{" "}
          with our comprehensive guide.
        </p>
      </header>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section: Project Idea & Purpose */}
        <section
          className={`shadow-lg rounded-xl p-8 transition-transform hover:scale-105 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-3xl font-bold mb-4 border-b-4 pb-2 ${
              isDarkMode ? "text-indigo-400 border-indigo-700" : "text-indigo-700 border-indigo-200"
            }`}
          >
            Project Idea & Purpose
          </h2>
          <p className={`leading-relaxed text-lg ${isDarkMode ? "text-gray-200" : "text-black"}`}>
            The AI-powered Study Planner is designed to empower students and lifelong learners to
            manage their study schedules effortlessly. It utilizes AI to provide personalized
            feedback, enhance learning efficiency, and promote sustainable time management.
          </p>
        </section>

        {/* Section: Core Features */}
        <section
          className={`shadow-lg rounded-xl p-8 transition-transform hover:scale-105 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-3xl font-bold mb-6 border-b-4 pb-2 ${
              isDarkMode ? "text-indigo-400 border-indigo-700" : "text-indigo-700 border-indigo-200"
            }`}
          >
            Core Features
          </h2>

          {/* Authentication & Profile Management */}
          <div className="mb-8">
            <h3
              className={`text-2xl font-semibold mb-3 ${isDarkMode ? "text-indigo-200" : "text-indigo-800"}`}
            >
              Authentication & Profile Management
            </h3>
            <ul
              className={`list-disc pl-6 space-y-2 text-lg ${isDarkMode ? "text-gray-300" : "text-black"}`}
            >
              <li>Create an account using email/password or social sign-in.</li>
              <li>Securely access accounts and update profile details.</li>
            </ul>
          </div>

          {/* Scheduling & Task Management */}
          <div className="mb-8">
            <h3
              className={`text-2xl font-semibold mb-3 ${isDarkMode ? "text-indigo-200" : "text-indigo-800"}`}
            >
              Scheduling & Task Management
            </h3>
            <ul
              className={`list-disc pl-6 space-y-2 text-lg ${isDarkMode ? "text-gray-300" : "text-black"}`}
            >
              <li>Manage tasks with priority levels, estimated time, and status.</li>
              <li>Use a drag-and-drop calendar interface for scheduling tasks.</li>
              <li>Analyze schedules and receive AI-driven suggestions.</li>
            </ul>
          </div>

          {/* Focus Timer */}
          <div className="mb-8">
            <h3
              className={`text-2xl font-semibold mb-3 ${isDarkMode ? "text-indigo-200" : "text-indigo-800"}`}
            >
              Focus Timer
            </h3>
            <ul
              className={`list-disc pl-6 space-y-2 text-lg ${isDarkMode ? "text-gray-300" : "text-black"}`}
            >
              <li>Track focused work sessions with timers.</li>
              <li>Set work and break durations for optimal productivity.</li>
              <li>Receive notifications upon timer completion.</li>
            </ul>
          </div>

          {/* Analytics */}
          <div>
            <h3
              className={`text-2xl font-semibold mb-3 ${isDarkMode ? "text-indigo-200" : "text-indigo-800"}`}
            >
              Analytics
            </h3>
            <ul
              className={`list-disc pl-6 space-y-2 text-lg ${isDarkMode ? "text-gray-300" : "text-black"}`}
            >
              <li>Visualize progress through focus session data.</li>
              <li>Gain insights into total time spent and task statuses.</li>
              <li>Receive motivational feedback and AI-generated insights.</li>
            </ul>
          </div>
        </section>

        {/* Section: Need More Help */}
        <section
          className={`text-white shadow-xl rounded-xl p-8 transition-transform hover:scale-105 ${
            isDarkMode ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gradient-to-r from-blue-500 to-indigo-500"
          }`}
        >
          <h2
            className={`text-3xl font-bold mb-4 border-b-4 pb-2 ${
              isDarkMode ? "border-blue-300" : "border-blue-300"
            }`}
          >
            Need More Help?
          </h2>
          <p className="leading-relaxed mb-6 text-lg">
            If you’re facing any issues or have questions, feel free to reach out:
          </p>
          <ul className="space-y-3 text-lg">
            <li>
              Email:{" "}
              <a
                href="mailto:support@studyplanner.com"
                className="text-blue-200 underline hover:text-blue-100"
              >
                support@studyplanner.com
              </a>
            </li>
            <li>Phone: +1-800-STUDY</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;
