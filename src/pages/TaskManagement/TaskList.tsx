import React, { useState, useEffect } from "react";
import axios from "axios";
import { Task } from "../../types/type";
import TaskCard from "./TaskCard";
import NewTask from "./NewTask";
import TaskDetails from "./TaskDetails";
import Loading from "../../components/loading";
import { useTheme } from "../../context/ThemeContext";
import { useLocation } from "react-router-dom";

const TaskList: React.FC = () => {
  const userId = localStorage.getItem("userId");
  const [accessToken] = useState(localStorage.getItem('token'));

  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();

  const location = useLocation();
  const Set_task = location.state?.schedule;

  const tasksPerPage = 4;

  // Fetch tasks from the API
  useEffect(() => {
    setLoading(true);

    // Simulate a delay of 5 seconds (for loading)
    const timer = setTimeout(() => {
      // After 5 seconds, stop loading
      setLoading(false);
    }, 1000);

    const fetchTasks = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/task/getOptionTasks/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Include Bearer token
            },
          }
        );

        const fetchedTasks = response.data.data.map((task: any) => ({
          id: task._id,
          title: task.name,
          description: task.description,
          startDate: task.startDate,
          dueDate: task.dueDate,
          priority: task.priority.toLowerCase(),
          status: task.status.toLowerCase(),
          estimateTime: task.estimatedTime,
        }));
        setTasks(fetchedTasks);

        // Check if Set_task exists in the fetched tasks and set it as the default task
        if (Set_task) {
          const matchingTask = fetchedTasks.find((t: { title: any; }) => t.title === Set_task.title);
          if (matchingTask) {
            setSelectedTask(matchingTask);
            setIsModalOpen(true);
          }
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();

    return () => clearTimeout(timer);
  }, [search, priorityFilter, statusFilter, sortBy, userId]);

  useEffect(() => {
    const updateExpiredTasks = async () => {
      try {
        await axios.put(
          `http://localhost:4000/task/update-expired-tasks/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log("Expired tasks updated successfully");
      } catch (taskError: any) {
        console.error("Error updating expired tasks:", taskError.response?.data || taskError.message);
      }
    };

    updateExpiredTasks();
  }, [userId, accessToken]);

  // Filters tasks by priority and status
  const filteredTasks = tasks.filter((task) => {
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  // Sort tasks based on the selected criteria
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === "dueDate" && a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.title.localeCompare(b.title);
  });

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);

  const getDisplayedPages = () => {
    const maxPagesToShow = 3; // Number of pages to display at a time
    let startPage = Math.max(currentPage - 1, 1);
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((prevTask) =>
        prevTask.id === updatedTask.id ? updatedTask : prevTask
      )
    );
    setIsModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleNewTaskModalToggle = () => {
    setIsNewTaskModalOpen(!isNewTaskModalOpen);
  };

  const handleAddTask = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setIsNewTaskModalOpen(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, priorityFilter, statusFilter, sortBy]);
  
  return (
    <div
      className={`p-6 relative min-h-screen ${isDarkMode ? "bg-white-100 text-black"
        : "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800"
        }`}

    >
      <div className="max-w-5xl mx-auto">
        {/* Title Section */}
        <div className="mb-10 text-center">
          <h1
            className={`text-4xl font-extrabold leading-tight ${isDarkMode ? "bg-gradient-to-br from-white via-green-300 to-blue-600 text-transparent bg-clip-text"
              : "text-gray-800"
              }`}>
            Task Management
          </h1>
          <p
            className={`mt-2 text-lg ${isDarkMode
              ? "bg-gradient-to-br from-white via-red-300 to-red-600 text-transparent bg-clip-text"
              : "text-gray-600"
              }`}
          >
            Manage your tasks efficiently and stay on top of your projects
          </p>
        </div>

        {!accessToken ? (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-300 p-6">
            <div className="text-center bg-white p-6 rounded-xl shadow-lg max-w-sm w-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <p className="text-xl text-red-600 font-semibold mb-4">
                You must log in to access this page.
              </p>
              <button
                onClick={() => window.location.href = '/auth'} // Redirect to the login page
                className={`py-3 px-10 rounded-full text-lg font-semibold transition duration-300 ease-in-out transform ${isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-800 hover:scale-105' : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'}`}
              >
                Log In
              </button>
            </div>
          </div>

        ) : (
          <>
            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full md:w-3/4 p-4 border border-gray-300 rounded-full shadow-md focus:ring-4 focus:ring-blue-300 focus:outline-none transition"
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Filters */}
              <div className="flex gap-4">
                <select
                  className="p-3 border border-gray-300 rounded-md"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  className="p-3 border border-gray-300 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">Todo</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>

                <select
                  className="p-3 border border-gray-300 rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="title">Sort by Title</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="dueDate">Sort by Due Date</option>
                </select>
              </div>
            </div>

            {/* Loading Spinner */}
            {loading ? (
              <Loading />
            ) : (
              <>
                {/* Button placed below the search and filters */}
                <div className="mb-8 flex justify-end">
                  <button
                    onClick={handleNewTaskModalToggle}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition"
                  >
                    {isNewTaskModalOpen ? "Cancel" : "New Task"}
                  </button>
                </div>

                {/* Task Cards */}
                <div className="flex flex-col gap-4">
                  {currentTasks.length === 0 ? (
                    <p className="text-center text-lg text-gray-600">No tasks available.</p>
                  ) : (
                    currentTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {/* Pagination */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md disabled:opacity-50"
              >
                Previous
              </button>
              {getDisplayedPages().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-md ${currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-700"
                    } hover:bg-blue-500 transition`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md disabled:opacity-50"
              >
                Next
              </button>
            </div>

          </>
        )}
      </div>


      {isNewTaskModalOpen && (
        <NewTask
          Tasks={tasks}
          onAddTask={handleAddTask}
          onClose={handleNewTaskModalToggle}
        />
      )}

      {isModalOpen && selectedTask && (
        <TaskDetails
          Tasks={tasks}
          task={selectedTask}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default TaskList;
