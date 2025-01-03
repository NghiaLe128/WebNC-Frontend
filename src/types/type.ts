export type SideNavItem = {
  title: string;
  path: string;
  icon?: JSX.Element;
  submenu?: boolean;
  subMenuItems?: SideNavItem[];
};

export type SideNavItemGroup = {
  title?: string;
  menuList: SideNavItem[];
};
export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: Date | null; // ISO string for simplicity
  dueDate: Date | null; // ISO string for simplicity
  priority: "low" | "medium" | "high";
  status: "todo" | "expired" | "inprogress" | "completed";
  estimateTime: number;
}

export interface TaskCategory {
  name: string;
  tasks: Task[];
}
export interface UserInfo {
  userId: string;
  userName: string;
  userEmail: string;
  userPassword: string;
  avatar: string;
}
