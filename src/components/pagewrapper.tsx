"use client";
import classNames from "classnames";
import { ReactNode } from "react";
import { useSideBarToggle } from "../hooks/use-sidebar-toggle";
import { useTheme } from "../context/ThemeContext"; // Import useTheme hook

// bọc nội dung trang
export default function PageWrapper({ children }: { children: ReactNode }) {
  const { toggleCollapse } = useSideBarToggle();
  const { isDarkMode } = useTheme(); // Get dark mode state from ThemeContext

  const bodyStyle = classNames(
    "flex flex-col p-4 min-h-screen mt-3 mr-4 transition-colors duration-300", // Add transition for smoother theme change
    {
      ["pl-[18.4rem]"]: !toggleCollapse,
      ["pl-[9.7rem]"]: toggleCollapse,
      // Dark mode styles
      ["bg-background-dark"]: isDarkMode,
      // Light mode styles
      ["bg-background-light"]: !isDarkMode,
    }
  );

  return <div className={bodyStyle}>{children}</div>;
}
