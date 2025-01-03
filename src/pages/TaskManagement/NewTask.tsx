// NewTask.tsx
import React, { useState } from "react";
import { Task } from "../../types/type";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";

interface NewTaskProps {
  Tasks?: Task[];
  onAddTask: (newTask: Task) => void;
  onClose: () => void;
}

const NewTask: React.FC<NewTaskProps> = ({ Tasks, onAddTask, onClose }) => {
  const [taskData, setTaskData] = useState<Task>({
    id: "",
    title: "",
    description: "",
    startDate: new Date(),
    dueDate: new Date(),
    priority: "low",
    status: "todo",
    estimateTime: 0,
  });

  const [dateError, setDateError] = useState(true);
  const [suggest_loading, setSuggestLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    keyIssues: { title: string; content: string }[];
  } | null>(null);
  const [SuggestModal, setSuggestModal] = useState(false);

  const userId = localStorage.getItem("userId");
  const { isDarkMode } = useTheme();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
  };

  const handleDateChange = (
    date: Date | null,
    fields: "startDate" | "dueDate"
  ) => {
    if (taskData.startDate !== null && date !== null) {
      if (
        fields === "dueDate" &&
        taskData.startDate.getTime() > date.getTime()
      ) {
        setDateError(false);
      } else {
        setDateError(true);
        setTaskData({
          ...taskData,
          [fields]: date,
          estimateTime: Math.ceil(
            Math.abs(taskData.startDate.getTime() - date.getTime()) /
            (1000 * 3600 * 24)
          ),
        });
      }
    }
  };

  const getFormatedStringFromDays = (numberOfDays: number) => {
    const months = Math.floor((numberOfDays % 365) / 30);
    const weeks = Math.floor((numberOfDays % 365) / 7);
    const days = Math.floor(((numberOfDays % 365) % 30) % 7);

    const monthsDisplay =
      months > 0 ? months + (months === 1 ? " month " : " months ") : "";
    const weeksDisplay =
      weeks > 0 ? weeks + (weeks === 1 ? " week " : " weeks ") : "";
    const daysDisplay = days > 0 ? days + (days === 1 ? " day" : " days") : " ";
    return monthsDisplay + weeksDisplay + daysDisplay;
  };

  const handleSubmit = async () => {
    if (!taskData.title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Task name is required!",
      });
      return;
    }

    const priorityMap = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    const statusMap = {
      todo: "Todo",
      inprogress: "In Progress",
      completed: "Completed",
      expired: "Expired",
    };

    const formattedData = {
      name: taskData.title,
      description: taskData.description,
      priority: priorityMap[taskData.priority],
      status: statusMap[taskData.status],
      startDate: taskData.startDate ? taskData.startDate.toISOString() : new Date().toISOString(),
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : new Date().toISOString(),
    };

    try {
      const response = await axios.post(
        `http://localhost:4000/task/createTasks/${userId}`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Include Bearer token
          },
        }
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Task added successfully!",
      }).then(() => {
        // Reload the page after closing the success alert
        window.location.reload();
      });

      setTaskData({
        id: "",
        title: "",
        description: "",
        startDate: null,
        dueDate: null,
        priority: "low",
        status: "inprogress",
        estimateTime: 0,
      });
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "Failed to add task. Please try again.";

      console.error("Error creating task:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error: ${errorMessage}`,
      });
    }
  };

  function parseFeedback(feedbackText: string) {
    const lines = feedbackText.split("\n").filter(line => line.trim() !== "");
    const keyIssues = lines.map(line => {
      const match = line.match(/^\* \*\*(.+?):\*\*/); // Match lines starting with * **Title:**
      if (match) {
        return {
          title: match[1].trim() + ": ",
          content: line.replace(match[0], "").trim(), // Remove the matched title part
        };
      } else {
        return {
          title: "",
          content: line.trim(), // Use the full line as content if no title match
        };
      }
    });

    return { keyIssues };
  };
  const AI_Suggest = async () => {
    setSuggestLoading(true);

    const priorityMap = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    const statusMap = {
      todo: "Todo",
      inprogress: "In Progress",
      completed: "Completed",
      expired: "Expired",
    };
    const curTask = {
      title: taskData.title,
      description: taskData.description,
      priority: priorityMap[taskData.priority],
      estimateTime: taskData.estimateTime,
      status: statusMap[taskData.status],
      startDate: taskData.startDate ? taskData.startDate.toISOString() : new Date().toISOString(),
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : new Date().toISOString(),
    };

    try {
      const response = await axios.post(
        `http://localhost:4000/task/suggest`,
        {
          curTask,
          Tasks,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Include Bearer token
          },
        }
      );

      const parsedFeedback = parseFeedback(response.data.feedback); // Parse the feedback into structured data
      setFeedback(parsedFeedback);
      setSuggestModal(true);
    } catch (error) {
      console.error('Error analyzing schedule:', error);
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center  ${isDarkMode ? "bg-black bg-opacity-50"
          : "bg-gray-800 bg-opacity-80"
        }`}
    >
      <div
        className={`w-full max-w-lg p-6 rounded-lg shadow-lg transform transition-all ${isDarkMode ? "bg-[#545555FF]"
            : "bg-[#e6f4f1]"
          }`}
        style={{ animation: "fadeIn 0.3s ease-in-out" }}
      >
        <div className="flex bg-[#008b8b] rounded-lg mb-6 items-center justify-center pt-3 pb-3">
          <svg
            width="30"
            height="30"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3"
          >
            <path
              d="M21.9199 24.6004C22.1033 24.7671 22.3421 24.8597 22.5899 24.8604H22.7299C22.8747 24.8402 23.0133 24.7886 23.1359 24.7091C23.2586 24.6297 23.3624 24.5243 23.4399 24.4004L26.5899 19.4004C26.7318 19.1763 26.7788 18.905 26.7207 18.6462C26.6626 18.3874 26.504 18.1623 26.2799 18.0204C26.0558 17.8785 25.7845 17.8314 25.5257 17.8896C25.2669 17.9477 25.0418 18.1063 24.8999 18.3304L22.3799 22.3304L20.8299 20.9004C20.6334 20.7231 20.3747 20.6309 20.1104 20.6441C19.8462 20.6572 19.5978 20.7745 19.4199 20.9704C19.33 21.0672 19.2602 21.181 19.2145 21.305C19.1688 21.429 19.1481 21.5608 19.1537 21.6929C19.1593 21.8249 19.191 21.9546 19.247 22.0743C19.303 22.194 19.3821 22.3014 19.4799 22.3904L21.9199 24.6004Z"
              fill="white"
            ></path>
            <path
              d="M21.9199 36.9205C22.1062 37.0825 22.3431 37.1745 22.5899 37.1805H22.7299C22.8747 37.1604 23.0133 37.1087 23.136 37.0293C23.2586 36.9498 23.3624 36.8444 23.4399 36.7205L26.5899 31.7205C26.7287 31.4972 26.774 31.2283 26.716 30.9719C26.6579 30.7155 26.5013 30.4923 26.2799 30.3505C26.169 30.2802 26.0453 30.2325 25.9158 30.21C25.7864 30.1876 25.6539 30.1908 25.5257 30.2196C25.3976 30.2484 25.2763 30.3022 25.169 30.3778C25.0616 30.4535 24.9702 30.5495 24.8999 30.6605L22.3799 34.6605L20.8299 33.2405C20.6337 33.0615 20.3743 32.9677 20.109 32.9799C19.8436 32.9921 19.594 33.1092 19.4149 33.3055C19.2359 33.5017 19.1422 33.7611 19.1544 34.0264C19.1666 34.2918 19.2837 34.5415 19.4799 34.7205L21.9199 36.9205Z"
              fill="white"
            ></path>
            <path
              d="M21.9199 48.7301C22.1033 48.8968 22.3421 48.9894 22.5899 48.9901H22.7299C22.8738 48.9711 23.0119 48.921 23.1345 48.8433C23.2571 48.7656 23.3613 48.6621 23.4399 48.5401L26.5899 43.5401C26.6602 43.4291 26.7079 43.3054 26.7304 43.176C26.7528 43.0466 26.7496 42.914 26.7208 42.7858C26.692 42.6577 26.6383 42.5365 26.5626 42.4291C26.487 42.3217 26.3909 42.2303 26.2799 42.1601C26.169 42.0898 26.0453 42.0421 25.9158 42.0196C25.7864 41.9972 25.6539 42.0004 25.5257 42.0292C25.3976 42.058 25.2763 42.1117 25.169 42.1874C25.0616 42.263 24.9702 42.3591 24.8999 42.4701L22.3799 46.4701L20.8299 45.0001C20.6337 44.821 20.3743 44.7273 20.109 44.7395C19.8436 44.7517 19.594 44.8688 19.4149 45.0651C19.2359 45.2613 19.1422 45.5207 19.1544 45.786C19.1666 46.0514 19.2837 46.301 19.4799 46.4801L21.9199 48.7301Z"
              fill="white"
            ></path>
            <path
              d="M47 8H37C37 6.67392 36.4732 5.40215 35.5355 4.46447C34.5979 3.52678 33.3261 3 32 3C30.6739 3 29.4021 3.52678 28.4645 4.46447C27.5268 5.40215 27 6.67392 27 8H17C15.4087 8 13.8826 8.63214 12.7574 9.75736C11.6321 10.8826 11 12.4087 11 14V55C11 56.5913 11.6321 58.1174 12.7574 59.2426C13.8826 60.3679 15.4087 61 17 61H47C48.5913 61 50.1174 60.3679 51.2426 59.2426C52.3679 58.1174 53 56.5913 53 55V14C53 12.4087 52.3679 10.8826 51.2426 9.75736C50.1174 8.63214 48.5913 8 47 8V8ZM22.57 13.82C22.7081 14.4365 23.0514 14.9879 23.5437 15.3839C24.036 15.78 24.6482 15.9972 25.28 16H38.72C39.3518 15.9972 39.964 15.78 40.4563 15.3839C40.9486 14.9879 41.2919 14.4365 41.43 13.82H45.83C45.9845 13.82 46.1375 13.8506 46.2801 13.91C46.4227 13.9694 46.5521 14.0565 46.6609 14.1662C46.7696 14.2759 46.8556 14.4061 46.9138 14.5492C46.972 14.6923 47.0013 14.8455 47 15V54C47.0013 54.1545 46.972 54.3077 46.9138 54.4508C46.8556 54.5939 46.7696 54.7241 46.6609 54.8338C46.5521 54.9435 46.4227 55.0306 46.2801 55.09C46.1375 55.1494 45.9845 55.18 45.83 55.18H18.17C18.0155 55.18 17.8625 55.1494 17.7199 55.09C17.5773 55.0306 17.4479 54.9435 17.3391 54.8338C17.2304 54.7241 17.1444 54.5939 17.0862 54.4508C17.028 54.3077 16.9987 54.1545 17 54V15C16.9987 14.8455 17.028 14.6923 17.0862 14.5492C17.1444 14.4061 17.2304 14.2759 17.3391 14.1662C17.4479 14.0565 17.5773 13.9694 17.7199 13.91C17.8625 13.8506 18.0155 13.82 18.17 13.82H22.57ZM28.13 10C28.1731 10.0057 28.2169 10.0057 28.26 10C28.3061 10.01 28.3539 10.01 28.4 10C28.4 10 28.4 10 28.46 10L28.64 9.91C28.6937 9.88258 28.744 9.84902 28.79 9.81C28.8377 9.76665 28.8782 9.71602 28.91 9.66L29 9.44C29.0245 9.38158 29.0445 9.32141 29.06 9.26C29.0657 9.19345 29.0657 9.12655 29.06 9.06C29.06 9.06 29.06 9.06 29.06 9C29.0657 8.95685 29.0657 8.91315 29.06 8.87C29.07 8.82387 29.07 8.77613 29.06 8.73C29.0075 8.49043 28.9874 8.24492 29 8C29 7.20435 29.3161 6.44129 29.8787 5.87868C30.4413 5.31607 31.2044 5 32 5C32.7956 5 33.5587 5.31607 34.1213 5.87868C34.6839 6.44129 35 7.20435 35 8C35.0028 8.24627 34.9726 8.49179 34.91 8.73C34.9 8.77613 34.9 8.82387 34.91 8.87C34.9043 8.91315 34.9043 8.95685 34.91 9C34.91 9 34.91 9 34.91 9.06C34.9043 9.12655 34.9043 9.19345 34.91 9.26C34.9255 9.32141 34.9455 9.38158 34.97 9.44L35.08 9.59C35.1118 9.64602 35.1523 9.69665 35.2 9.74C35.246 9.77902 35.2963 9.81258 35.35 9.84C35.4057 9.87785 35.4663 9.90811 35.53 9.93C35.53 9.93 35.53 9.93 35.59 9.93C35.6794 9.94456 35.7706 9.94456 35.86 9.93H39.5V13.15C39.5 13.3569 39.4178 13.5553 39.2715 13.7015C39.1253 13.8478 38.9269 13.93 38.72 13.93H25.28C25.0731 13.93 24.8747 13.8478 24.7285 13.7015C24.5822 13.5553 24.5 13.3569 24.5 13.15V10H28.13ZM51 55C51 56.0609 50.5786 57.0783 49.8284 57.8284C49.0783 58.5786 48.0609 59 47 59H17C15.9391 59 14.9217 58.5786 14.1716 57.8284C13.4214 57.0783 13 56.0609 13 55V14C13 12.9391 13.4214 11.9217 14.1716 11.1716C14.9217 10.4214 15.9391 10 17 10H22.5V11.82H18.17C17.3283 11.8226 16.5221 12.1588 15.9279 12.7549C15.3337 13.351 15 14.1583 15 15V54C15 54.8417 15.3337 55.649 15.9279 56.2451C16.5221 56.8412 17.3283 57.1774 18.17 57.18H45.83C46.6717 57.1774 47.4779 56.8412 48.0721 56.2451C48.6663 55.649 49 54.8417 49 54V15C49 14.1583 48.6663 13.351 48.0721 12.7549C47.4779 12.1588 46.6717 11.8226 45.83 11.82H41.5V10H47C48.0609 10 49.0783 10.4214 49.8284 11.1716C50.5786 11.9217 51 12.9391 51 14V55Z"
              fill="white"
            ></path>
            <path
              d="M29 35H44C44.2652 35 44.5196 34.8946 44.7071 34.7071C44.8946 34.5196 45 34.2652 45 34C45 33.7348 44.8946 33.4804 44.7071 33.2929C44.5196 33.1054 44.2652 33 44 33H29C28.7348 33 28.4804 33.1054 28.2929 33.2929C28.1054 33.4804 28 33.7348 28 34C28 34.2652 28.1054 34.5196 28.2929 34.7071C28.4804 34.8946 28.7348 35 29 35Z"
              fill="white"
            ></path>
            <path
              d="M29 23H44C44.2652 23 44.5196 22.8946 44.7071 22.7071C44.8946 22.5196 45 22.2652 45 22C45 21.7348 44.8946 21.4804 44.7071 21.2929C44.5196 21.1054 44.2652 21 44 21H29C28.7348 21 28.4804 21.1054 28.2929 21.2929C28.1054 21.4804 28 21.7348 28 22C28 22.2652 28.1054 22.5196 28.2929 22.7071C28.4804 22.8946 28.7348 23 29 23Z"
              fill="white"
            ></path>
            <path
              d="M44 25H37C36.7348 25 36.4804 25.1054 36.2929 25.2929C36.1054 25.4804 36 25.7348 36 26C36 26.2652 36.1054 26.5196 36.2929 26.7071C36.4804 26.8946 36.7348 27 37 27H44C44.2652 27 44.5196 26.8946 44.7071 26.7071C44.8946 26.5196 45 26.2652 45 26C45 25.7348 44.8946 25.4804 44.7071 25.2929C44.5196 25.1054 44.2652 25 44 25Z"
              fill="white"
            ></path>
            <path
              d="M44 37H37C36.7348 37 36.4804 37.1054 36.2929 37.2929C36.1054 37.4804 36 37.7348 36 38C36 38.2652 36.1054 38.5196 36.2929 38.7071C36.4804 38.8946 36.7348 39 37 39H44C44.2652 39 44.5196 38.8946 44.7071 38.7071C44.8946 38.5196 45 38.2652 45 38C45 37.7348 44.8946 37.4804 44.7071 37.2929C44.5196 37.1054 44.2652 37 44 37Z"
              fill="white"
            ></path>
            <path
              d="M44 49H37C36.7348 49 36.4804 49.1054 36.2929 49.2929C36.1054 49.4804 36 49.7348 36 50C36 50.2652 36.1054 50.5196 36.2929 50.7071C36.4804 50.8946 36.7348 51 37 51H44C44.2652 51 44.5196 50.8946 44.7071 50.7071C44.8946 50.5196 45 50.2652 45 50C45 49.7348 44.8946 49.4804 44.7071 49.2929C44.5196 49.1054 44.2652 49 44 49Z"
              fill="white"
            ></path>
            <path
              d="M29 47H44C44.2652 47 44.5196 46.8946 44.7071 46.7071C44.8946 46.5196 45 46.2652 45 46C45 45.7348 44.8946 45.4804 44.7071 45.2929C44.5196 45.1054 44.2652 45 44 45H29C28.7348 45 28.4804 45.1054 28.2929 45.2929C28.1054 45.4804 28 45.7348 28 46C28 46.2652 28.1054 46.5196 28.2929 46.7071C28.4804 46.8946 28.7348 47 29 47Z"
              fill="white"
            ></path>
          </svg>
          <h2
            className={`text-2xl font-bold ${isDarkMode ? "bg-gradient-to-br from-white via-yellow-300 to-yellow-600 text-transparent bg-clip-text"
                : "text-white"
              }`}
          >
            Create New Task
          </h2>
        </div>

        <div className="form-control mb-2 ">
          <label className="label ">
            <span
              className={`label-text font-medium ${isDarkMode ? "text-white"
                  : "text-black"
                }`}
            >
              Task Title <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            type="text"
            name="title"
            value={taskData.title}
            onChange={handleChange}
            className="input size-10 w-full input-bordered border-2 rounded-md border-slate-200 p-3 mt-2"
          />
        </div>
        <div className="form-control mb-2 ">
          <label className="label ">
            <span
              className={`label-text font-medium ${isDarkMode ? "text-white"
                  : "text-black"
                }`}
            >
              Description</span>
          </label>
          <input
            type="text"
            name="description"
            value={taskData.description}
            onChange={handleChange}
            className=" input w-full size-10 input-bordered border-2 rounded-md border-slate-200 p-3 mt-2"
          />
        </div>
        <div className="flex justify-between">
          <div className="mb-2 form-control">
            <label className="label">
              <span
                className={`label-text font-medium ${isDarkMode ? "text-white"
                    : "text-black"
                  }`}
              >
                Start Date <span className="text-red-500">*</span>
              </span>
            </label>
            <div>
              <DatePicker
                showIcon
                selected={taskData.startDate}
                onChange={(date) => handleDateChange(date, "startDate")}
                className="flex border-2 rounded-md cursor-pointer mt-2"
                showTimeSelect
                dateFormat="Pp"
                icon={
                  <svg
                    className="mt-2.5 mr-2"
                    height="24"
                    version="1.1"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="translate(0 -1028.4)">
                      <path
                        d="m5 1032.4c-1.1046 0-2 0.9-2 2v14c0 1.1 0.8954 2 2 2h6 2 6c1.105 0 2-0.9 2-2v-14c0-1.1-0.895-2-2-2h-6-2-6z"
                        fill="#bdc3c7"
                      />
                      <path
                        d="m5 3c-1.1046 0-2 0.8954-2 2v14c0 1.105 0.8954 2 2 2h6 2 6c1.105 0 2-0.895 2-2v-14c0-1.1046-0.895-2-2-2h-6-2-6z"
                        fill="#ecf0f1"
                        transform="translate(0 1028.4)"
                      />
                      <path
                        d="m5 3c-1.1046 0-2 0.8954-2 2v3 1h18v-1-3c0-1.1046-0.895-2-2-2h-6-2-6z"
                        fill="#e74c3c"
                        transform="translate(0 1028.4)"
                      />
                      <path
                        d="m7 5.5a1.5 1.5 0 1 1 -3 0 1.5 1.5 0 1 1 3 0z"
                        fill="#c0392b"
                        transform="translate(.5 1028.4)"
                      />
                      <path
                        d="m6 1c-0.5523 0-1 0.4477-1 1v3c0 0.5523 0.4477 1 1 1s1-0.4477 1-1v-3c0-0.5523-0.4477-1-1-1z"
                        fill="#bdc3c7"
                        transform="translate(0 1028.4)"
                      />
                      <path
                        d="m7 5.5a1.5 1.5 0 1 1 -3 0 1.5 1.5 0 1 1 3 0z"
                        fill="#c0392b"
                        transform="translate(12.5 1028.4)"
                      />
                      <g fill="#bdc3c7">
                        <path d="m18 1029.4c-0.552 0-1 0.4-1 1v3c0 0.5 0.448 1 1 1s1-0.5 1-1v-3c0-0.6-0.448-1-1-1z" />
                        <path d="m5 1039.4v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z" />
                        <path d="m5 1042.4v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z" />
                        <path d="m5 1045.4v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z" />
                      </g>
                    </g>
                  </svg>
                }
              />
            </div>
          </div>

          <div className="mb-2 form-control">
            <label className="label">
              <span
                className={`label-text font-medium ${isDarkMode ? "text-white"
                    : "text-black"
                  }`}
              >
                Due Date <span className="text-red-500">*</span>
              </span>
            </label>
            <div>
              <DatePicker
                showIcon
                selected={taskData.dueDate}
                onChange={(date) => handleDateChange(date, "dueDate")}
                className="flex border-2 rounded-md cursor-pointer mt-2"
                showTimeSelect
                dateFormat="Pp"
                icon={
                  <svg
                    className="mt-2.5 mr-2"
                    height="24"
                    version="1.1"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="translate(0 -1028.4)">
                      <path
                        d="m5 1032.4c-1.1046 0-2 0.9-2 2v14c0 1.1 0.8954 2 2 2h6 2 6c1.105 0 2-0.9 2-2v-14c0-1.1-0.895-2-2-2h-6-2-6z"
                        fill="#bdc3c7"
                      />
                      <path
                        d="m5 3c-1.1046 0-2 0.8954-2 2v14c0 1.105 0.8954 2 2 2h6 2 6c1.105 0 2-0.895 2-2v-14c0-1.1046-0.895-2-2-2h-6-2-6z"
                        fill="#ecf0f1"
                        transform="translate(0 1028.4)"
                      />
                      <path
                        d="m5 3c-1.1046 0-2 0.8954-2 2v3 1h18v-1-3c0-1.1046-0.895-2-2-2h-6-2-6z"
                        fill="#e74c3c"
                        transform="translate(0 1028.4)"
                      />
                      <path
                        d="m7 5.5a1.5 1.5 0 1 1 -3 0 1.5 1.5 0 1 1 3 0z"
                        fill="#c0392b"
                        transform="translate(.5 1028.4)"
                      />
                      <path
                        d="m6 1c-0.5523 0-1 0.4477-1 1v3c0 0.5523 0.4477 1 1 1s1-0.4477 1-1v-3c0-0.5523-0.4477-1-1-1z"
                        fill="#bdc3c7"
                        transform="translate(0 1028.4)"
                      />
                      <path
                        d="m7 5.5a1.5 1.5 0 1 1 -3 0 1.5 1.5 0 1 1 3 0z"
                        fill="#c0392b"
                        transform="translate(12.5 1028.4)"
                      />
                      <g fill="#bdc3c7">
                        <path d="m18 1029.4c-0.552 0-1 0.4-1 1v3c0 0.5 0.448 1 1 1s1-0.5 1-1v-3c0-0.6-0.448-1-1-1z" />
                        <path d="m5 1039.4v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z" />
                        <path d="m5 1042.4v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z" />
                        <path d="m5 1045.4v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z" />
                      </g>
                    </g>
                  </svg>
                }
              />
            </div>
          </div>
        </div>
        {!dateError ? (
          <span className="text-red-500 mb-3">
            Due Date must be later than Start Date
          </span>
        ) : null}
        <div className="flex justify-between  ">
          <div className="mb-2 form-control">
            <label className="label">
              <span
                className={`label-text pr-1 font-medium ${isDarkMode ? "text-white"
                    : "text-black"
                  }`}
              >
                Priority Level
              </span>
            </label>
            <div>
              <select
                name="priority"
                value={taskData.priority}
                onChange={handleChange}
                className="select select-bordered w-auto cursor-pointer border-2 rounded-md pt-1 pb-2 pr-6 mt-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="mb-2 form-control">
            <label className="label">
              <span
                className={`label-text pr-1 font-medium ${isDarkMode ? "text-white"
                    : "text-black"
                  }`}
              >
                Status
              </span>
            </label>
            <div>
              <select
                name="status"
                value={taskData.status}
                onChange={handleChange}
                className="select select-bordered w-auto cursor-pointer border-2 rounded-md pt-1 pb-2 pr-6 mt-2"
              >
                <option value="todo">To do</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="mb-2 form-control">
            <label className="label">
              <span className={`label-text pr-1 font-medium ${isDarkMode ? "text-white"
                  : "text-black"
                }`}
              >
                Estimate Time
              </span>
            </label>
            <div className=" p-3 w-fit bg-rose-300 rounded-md pt-1 pb-2 mt-2">
              {getFormatedStringFromDays(taskData.estimateTime)}
              {/* <input
                type="number"
                name="estimateTime"
                value={taskData.estimateTime}
                onChange={(e) =>
                  setTaskData((prev) => ({
                    ...prev,
                    estimateTime: Math.max(Number(e.target.value), 0), // Prevent negative values
                  }))
                }
                className="select select-bordered w-auto cursor-pointer border-2 rounded-md pt-1 pb-2 pr-2 pl-2 mt-2"
                min={0} // Prevent negative values
              /> */}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={AI_Suggest}
            disabled={suggest_loading}
            className={`btn btn-outline px-2 py-2 rounded-md font-medium ${
              isDarkMode ? "bg-[#2A9E4BFF] text-blue hover:bg-[#00FFC3FF] hover:text-gray-800"
              : "bg-[#9ADAACFF] text-blue hover:bg-[#00FF48FF] hover:text-white"
            }`}
            style={{ marginRight: "10px" }}
          >
            {suggest_loading ? 'Analyzing...' : 'AI suggest'}
          </button>

          <button
            className={`btn btn-primary  px-5 py-2 rounded-xl  transition-all delay-50 mr-3 ${isDarkMode ? "bg-[#234848FF] hover:bg-[#a5e4e4] hover:text-black text-white"
                : "bg-[#95b0b0] hover:bg-[#a5e4e4] text-black"
              }`}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className={`btn btn-primary  px-5 py-2 rounded-xl transition-all delay-50 text-weight-bold ${
                isDarkMode ? "bg-[#4F39CAFF] hover:bg-[#2904FBFF] text-white"
                : "bbg-[#AEEEEE] hover:bg-[#a5e4e4] text-black"
              }`}
            onClick={handleSubmit}
          >
            Add Task
          </button>

        </div>
      </div>

      {/* Show Suggest Modal */}
      {SuggestModal && (
        <div className="bg-white rounded-lg shadow-xl p-8 w-11/12 md:w-2/3 lg:w-1/2 transform transition-all scale-95 max-h-full overflow-y-auto">
          <div className="space-y-6 mb-6">
            {feedback?.keyIssues.map((issue, index) => {
              return (
                <div key={index}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333' }}>
                    {issue.title.replace(/\*\*/g, '')}
                  </span>

                  <span style={{ fontSize: '1rem', color: '#333' }}>
                    {issue.content}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default NewTask;
