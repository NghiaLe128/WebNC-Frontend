import { create } from "zustand";

interface SidebarToggle {
    toggleCollapse: boolean;
    invokeToggleCollapse: () => void;
    setToggleCollapse: (value: boolean) => void;  // Add this function
}

export const useSideBarToggle = create<SidebarToggle>((set, get) => ({
    toggleCollapse: false,
    invokeToggleCollapse: () => set({ toggleCollapse: !get().toggleCollapse }),
    setToggleCollapse: (value: boolean) => set({ toggleCollapse: value })  // Define setter function
}));
