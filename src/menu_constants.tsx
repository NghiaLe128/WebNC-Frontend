import { BsCalendar, BsClipboard, BsClock, BsGraphUp, BsGear, BsHouseDoor, BsQuestionCircle } from "react-icons/bs";
import { SideNavItemGroup } from "./types/type";

export const SIDENAV_ITEMS: SideNavItemGroup[] = [
    {
        title: "Dashboard",
        menuList: [
            {
                title: 'Home',
                path: '/home',
                icon: <BsHouseDoor size={20} />,
            }
        ]
    },
    {
        title: "Features",
        menuList: [
            {
                title: 'Task Management',
                path: '/tasks',
                icon: <BsClipboard size={20} />,
                submenu: true,
                subMenuItems: [
                    { title: 'View Tasks', path: '/tasks' },
                    { title: 'Add Task', path: '/tasks/new' },
                ],
            },
            {
                title: 'Schedule',
                path: '/schedule',
                icon: <BsCalendar size={20} />,
            },
            {
                title: 'Focus Timer',
                path: '/timer',
                icon: <BsClock size={20} />,
            },
            {
                title: 'Analytics',
                path: '/analytics',
                icon: <BsGraphUp size={20} />,
            }
        ]
    },
    {
        title: "Settings",
        menuList: [
            {
                title: 'Profile',
                path: '/profile',
                icon: <BsGear size={20} />,
            },
            {
                title: 'Help',
                path: '/help',
                icon: <BsQuestionCircle size={20} />,
            }
        ]
    }
];
