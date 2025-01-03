import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom"; // React Router imports
import classNames from "classnames";
import "../styles/SidebarMenu.css"; // Import CSS file
import { SideNavItem, SideNavItemGroup } from "../types/type"; // Import types
import { useSideBarToggle } from "../hooks/use-sidebar-toggle";

// Helper function to get link class
const getLinkClass = (isActive: boolean, toggleCollapse: boolean) =>
  classNames("inactive-link", {
    "active-link": isActive,
    "justify-center": toggleCollapse,
  });

const SidebarMenuItem: React.FC<{ item: SideNavItem }> = ({ item }) => { // Typed props
  const { toggleCollapse } = useSideBarToggle();
  const location = useLocation(); // React Router hook to get current path
  const isActive = location.pathname.includes(item.path); // Determine if the link is active
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    console.log(isDarkMode)
    setIsDarkMode(savedTheme === "dark");
  }, []);

  return (
    <Link to={item.path} className={getLinkClass(isActive, toggleCollapse)}>
      <div className="icon-container">{item.icon}</div>
      {!toggleCollapse && <span className="inactive-text">{item.title}</span>}
    </Link>
  );
};

const SidebarMenu: React.FC<{ menuGroup: SideNavItemGroup }> = ({ menuGroup }) => { // Typed props
  const { toggleCollapse } = useSideBarToggle();

  const menuGroupTitleStyle = classNames("menu-group-title", {
    "menu-group-title-centered": toggleCollapse,
  });

  return (
    <>
      {menuGroup.title ? (
        <h3 className={menuGroupTitleStyle}>
          {!toggleCollapse ? menuGroup.title : "..."}
        </h3>
      ) : null}
      {menuGroup.menuList?.map((item, index) => (
        <SidebarMenuItem key={index} item={item} />
      ))}
    </>
  );
};

export default SidebarMenu;
