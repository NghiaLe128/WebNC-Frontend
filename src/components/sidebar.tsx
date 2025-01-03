import React, { useEffect, useState } from "react";
import classNames from "classnames";
import SidebarMenu from "./SidebarMenu";
import "../styles/Sidebar.css"; // Import CSS file
import { RiArrowLeftSLine } from "react-icons/ri";
import { useSideBarToggle } from "../hooks/use-sidebar-toggle";
import { SideNavItemGroup } from "../types/type";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // Import useTheme

// Sidebar component
const Sidebar = ({ menuItems }: { menuItems: SideNavItemGroup[] }) => {
  const { toggleCollapse, setToggleCollapse, invokeToggleCollapse } = useSideBarToggle();
  const { isTimerRunning } = useAuth(); // Get `isTimerRunning` from the context
  const { isDarkMode } = useTheme(); // Get `isDarkMode` from the ThemeContext

  const [isDarkModeState, setIsDarkModeState] = useState(isDarkMode); // Sync with theme context

  useEffect(() => {
    setIsDarkModeState(isDarkMode);
  }, [isDarkMode]);

  // Auto-collapse sidebar on screens smaller than 1024px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setToggleCollapse(true);
      } else {
        setToggleCollapse(false);
      }
    };

    handleResize(); // Set initial state based on screen width
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setToggleCollapse]);

  const sidebarToggle = () => {
    invokeToggleCollapse();
  };

  // Apply styles conditionally based on the timer state and theme
  const asideStyle = classNames("sidebar", {
    wide: !toggleCollapse,
    narrow: toggleCollapse,
    inactive: isTimerRunning, // Add the inactive class when timer is running
    dark: isDarkModeState, // Apply dark theme class
    light: !isDarkModeState, // Apply light theme class
  });

  const sidebarToggleStyle = classNames("sidebar-toggle", {
    isLeft: !toggleCollapse,
    isRight: toggleCollapse,
  });

  return (
    <>
      <aside className={asideStyle}>
        <div className="sidebar-top justify-center space-x-2">
          <img
            src="/AIStudyIcon.png"
            alt="Logo"
            className="sidebar-logo"
            width={45}
            height={45}
          />
          <h3
            className={classNames("sidebar-title", { hidden: toggleCollapse })}
          >
            <div className="US">AIS</div>
            <div>tudy</div>
          </h3>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <SidebarMenu key={idx} menuGroup={item} />
          ))}
        </nav>
      </aside>
      <button className={sidebarToggleStyle} onClick={sidebarToggle}>
        <RiArrowLeftSLine size={14} />
      </button>
    </>
  );
};

export default Sidebar;
