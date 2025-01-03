"use client";
import React, { useState, useRef, useEffect } from "react";
import classNames from "classnames";
import { PiHandWavingThin } from "react-icons/pi";
import { IoNotificationsOutline } from "react-icons/io5";
import { FaUserCircle, FaSignOutAlt, FaMoon, FaSun, FaSignInAlt } from "react-icons/fa";
import "../styles/Header.css";
import { useSideBarToggle } from "../hooks/use-sidebar-toggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // Import useTheme hook

const Header: React.FC = () => {
  const [accessToken] = useState(localStorage.getItem('token'));

  const { toggleCollapse } = useSideBarToggle();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logout } = useAuth(); // Check if the user is authenticated
  const { isDarkMode, toggleTheme } = useTheme(); // Use theme context
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setDropdownOpen((prevState) => !prevState);

  const handleProfileClick = () => {
    window.location.href = "/profile";
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/auth";
  };

  const handleLogin = () => {
    window.location.href = "/auth"; // Redirect to login page
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const headerStyle = classNames({
    ["header isWide"]: !toggleCollapse,
    ["header isNarrow"]: toggleCollapse,
  });

  return (
    <div className={headerStyle}>
      <div className="hello">
        <div className="first-line">
          Hello!! {<PiHandWavingThin className="icon" size={25} />}
        </div>
        <div className="second-line">Welcome back!</div>
      </div>

      <div className="right-items">
        <div className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
        </div>

        <div className="notification">
          <IoNotificationsOutline size={20} />
        </div>

        <div className="user-setting" ref={dropdownRef}>
          <FaUserCircle
            size={35}
            className="user-icon"
            onClick={toggleDropdown}
          />
          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleProfileClick}>
                <FaUserCircle className="dropdown-icon" /> Profile
              </div>
              {accessToken ? (
                <div className="dropdown-item" onClick={handleLogout}>
                  <FaSignOutAlt className="dropdown-icon" /> Logout
                </div>
              ) : (
                <div className="dropdown-item" onClick={handleLogin}>
                  <FaSignInAlt className="dropdown-icon" /> Login
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Header);
