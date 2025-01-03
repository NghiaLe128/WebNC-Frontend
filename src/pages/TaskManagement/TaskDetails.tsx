import React, { useState } from "react";
import { Task } from "../../types/type";
import DatePicker from "react-datepicker";
import axios from "axios";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";

interface TaskDetailsProps {
  Tasks?: Task[];
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  Tasks,
  task,
  onClose,
  onSave,
  onDelete,
}) => {
  const [dateError, setDateError] = useState(true);
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggest_loading, setSuggestLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    keyIssues: { title: string; content: string }[];
  } | null>(null);
  const [SuggestModal, setSuggestModal] = useState(false);
  const { isDarkMode } = useTheme();


  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditedTask({ ...editedTask, [name]: value });
    setErrors({ ...errors, [name]: "" }); // Clear errors on input
  };


  const handleDateChange = (date: Date | null, field: string) => {
    // Ensure that startDate is a valid Date object
    if (editedTask.startDate && date) {
      const startDate = new Date(editedTask.startDate); // Convert it to a Date object if necessary
      if (field === "dueDate" && startDate.getTime() > date.getTime()) {
        setDateError(false);
      } else {
        setDateError(true);
        setEditedTask({
          ...editedTask,
          [field]: date,
          estimateTime: Math.ceil(
            Math.abs(startDate.getTime() - date.getTime()) / (1000 * 3600 * 24)
          ),
        });
      }
    }
  };

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editedTask.title.trim()) {
      newErrors.title = "Task title is required.";
    }
    if (!editedTask.priority) {
      newErrors.priority = "Priority must be selected.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateFields()) {
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
        name: editedTask.title,
        description: editedTask.description,
        priority: priorityMap[editedTask.priority],
        status: statusMap[editedTask.status],
        startDate: editedTask.startDate,
        dueDate: editedTask.dueDate
      };


      try {
        // API call to save the task
        const response = await axios.put(
          `http://localhost:4000/task/updateTasks/${task.id}`,
          formattedData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Include Bearer token
            },
          }
        );

        onSave(response.data); // Assuming the API returns the updated task
        Swal.fire({
          title: "Success!",
          text: "Task updated successfully.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          // Reload the page after closing the success alert
          window.location.reload();
        });
        onClose();
      } catch (error: any) {
        console.error("Failed to update task:", error);
        Swal.fire({
          title: "Error!",
          text: error.response?.data?.message || "Something went wrong.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };

  const handleDelete = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // API call to delete the task
          const response = await axios.delete(
            `http://localhost:4000/task/deleteTasks/${task.id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`, // Include Bearer token
              },
            }
          );

          if (response.status === 200) {
            // Task deleted successfully
            Swal.fire({
              title: "Deleted!",
              text: "The task has been deleted.",
              icon: "success",
              confirmButtonText: "OK",
            }).then(() => {
              onDelete(task.id); // Update state or UI after deletion
              onClose(); // Close the modal or dialog
            });
          }
        } catch (error: any) {
          console.error("Failed to delete task:", error);
          Swal.fire({
            title: "Error!",
            text: error.response?.data?.message || "Something went wrong.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      }
    });
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
      title: editedTask.title,
      description: editedTask.description,
      priority: priorityMap[editedTask.priority],
      estimateTime: editedTask.estimateTime,
      status: statusMap[editedTask.status],
      startDate: editedTask.startDate,
      dueDate: editedTask.dueDate
    };

    try {
      const response = await axios.post(
        `http://localhost:4000/task/suggest`,
        {
          curTask,
          Tasks
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
        <h2
          className={`text-2xl text-center px-4 mb-6 py-2 rounded-lg font-bold bg-[#008b8b] ${isDarkMode ? "bg-gradient-to-br from-white via-yellow-300 to-yellow-600 text-gray-800"
              : "text-white"
            }`}
        >
          Task Details
        </h2>
        <div className="space-y-5">
          {/* Task Title*/}
          <div>
            <label
              className={`mb-1 block text-md font-medium ${isDarkMode ? "text-white"
                  : "text-gray-700"
                }`}
            >
              Task Title
            </label>
            <input
              type="text"
              name="title"
              value={editedTask.title}
              onChange={handleInputChange}
              className={`input input-bordered w-full size-10 input-bordered border-2 rounded-md border-slate-200 p-2 ${errors.title ? "border-red-500" : ""
                }`}
            />
            {errors.title && (
              <p className="text-red-500 text-md mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className={`mb-1 block text-md font-medium ${isDarkMode ? "text-white"
                  : "text-gray-700"
                }`}
            >
              Description
            </label>
            <textarea
              name="description"
              value={editedTask.description}
              onChange={handleInputChange}
              className="textarea textarea-bordered w-full border-2 rounded-md border-slate-200 p-2"
            />
          </div>

          {/* Priority and Status */}
          <div className="flex space-x-4">
            {/* Priority */}
            <div className="w-full">
              <label
                className={`mb-1 block text-md font-medium ${isDarkMode ? "text-white"
                    : "text-gray-700"
                  }`}
              >
                Priority
              </label>
              <select
                name="priority"
                value={editedTask.priority}
                onChange={handleInputChange}
                className="select select-bordered w-full input input-bordered border-2 rounded-md border-slate-200"
              >
                <option value="">Select priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {errors.priority && (
                <p className="text-red-500 text-md mt-1">{errors.priority}</p>
              )}
            </div>

            {/* Status */}
            <div className="w-full">
              <label
                className={`mb-1 block text-md font-medium ${isDarkMode ? "text-white"
                    : "text-gray-700"
                  }`}
              >
                Status
              </label>
              <select
                name="status"
                value={editedTask.status}
                onChange={handleInputChange}
                className="select select-bordered w-full input input-bordered border-2 rounded-md border-slate-200"
              >
                <option value="todo">To do</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="w-full">
              <label
                className={`mb-1 block text-md font-medium ${isDarkMode ? "text-white"
                    : "text-gray-700"
                  }`}
              >
                Start Date
              </label>
              <DatePicker
                showIcon
                selected={editedTask.startDate ? new Date(editedTask.startDate) : null}
                onChange={(date) => handleDateChange(date, "startDate")}
                className="flex border-2 rounded-md cursor-pointer w-full p-2"
                showTimeSelect
                dateFormat="Pp"
                icon={
                  <svg
                    className="mt-0.5"
                    height="24"
                    version="1.1"
                    width="24"
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
                    </g>
                  </svg>
                }
              />
            </div>
            <div className="w-full">
              <label
                className={`mb-1 block text-md font-medium ${isDarkMode ? "text-white"
                    : "text-gray-700"
                  }`}
              >
                Due Date
              </label>
              <DatePicker
                showIcon
                selected={editedTask.dueDate ? new Date(editedTask.dueDate) : null}
                onChange={(date) => handleDateChange(date, "dueDate")}
                className="flex border-2 rounded-md cursor-pointer w-full p-2"
                showTimeSelect
                dateFormat="Pp"
                icon={
                  <svg
                    className="mt-0.5"
                    height="24"
                    version="1.1"
                    width="24"
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
                    </g>
                  </svg>
                }
              />
            </div>
          </div>
          {!dateError ? (
            <span className="text-red-500 mb-3">
              Due Date must be later than Start Date
            </span>
          ) : null}
          {/* Estimate Time */}
          <div className="flex mt-3">
            <label className={`block text-md font-medium mr-4 ${
              isDarkMode ? "text-white"
              : "text-gray-700"
            }`}>
              Estimated Time:
            </label>
            <div className="w-fit bg-rose-300 rounded-md pl-4 pr-4">
              {editedTask.estimateTime} day
            </div>
            {/* <input
              type="number"
              name="estimatedTime"
              value={editedTask.estimateTime || ""}
              onChange={handleInputChange}
              className="input input-bordered w-full border-2 rounded-md border-slate-200 p-2"
              placeholder="Enter estimated time"
            /> */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={AI_Suggest}
            disabled={suggest_loading}
            className={`btn btn-outline px-2 py-2 rounded-md font-medium ${
              isDarkMode ? "bg-[#2A9E4BFF] text-blue hover:bg-[#00FFC3FF] hover:text-gray-800"
              : "bg-[#9ADAACFF] text-blue hover:bg-[#00FF48FF] hover:text-white"
            }`}
          >
            {suggest_loading ? 'Analyzing...' : 'AI suggest'}
          </button>

          <button
            onClick={onClose}
            className={`btn btn-outline px-4 py-2 rounded-md font-medium ${isDarkMode ? "bg-[#234848FF] hover:bg-[#a5e4e4] hover:text-black text-white"
                : "bg-[#95b0b0] hover:bg-[#a5e4e4] text-black"
              }`}
            style={{ backgroundColor: "#95b0b0" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`btn btn-primary px-4 py-2 rounded-md font-medium ${
                isDarkMode ? "bg-[#408E4BFF] hover:bg-[#15FF00FF] hover:text-gray-800 text-white"
                : "bg-[#00FFFFFF] text-black hover:bg-[#0066FFFF] hover:text-white"
              }`}
          >
            Save Changes
          </button>
          <button
            onClick={handleDelete}
            className={`btn btn-danger px-4 py-2 rounded-md text-white font-medium" ${
              isDarkMode ? "bg-[#AB0000FF] hover:bg-[#FF0000FF] hover:text-gray-800 text-white"
                : "bg-[#875656FF] hover:bg-[#FF0000FF] text-white"
              }`}
          >
            Delete Task
          </button>
        </div>
      </div>

      {/* Show Suggest Modal */}
      {SuggestModal && (
        <div className="bg-white rounded-lg shadow-xl p-8 w-11/12 md:w-2/3 lg:w-1/2 transform transition-all scale-95 max-h-full overflow-y-auto">
          <div className="space-y-6 mb-6">
            {feedback?.keyIssues.map((issue, index) => {
              // Check if the issue title is empty, if it is, return null for that iteration
              //if (!issue.title.trim()) return null;

              // Return the JSX for non-empty issues
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

export default TaskDetails;
