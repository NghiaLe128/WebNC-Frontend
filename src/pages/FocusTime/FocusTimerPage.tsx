import React, { useState, useEffect } from "react";
import "../../styles/FocusTimer.css";
import moment from "moment-timezone";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { Event } from "../../types/events";
import { FaPlay, FaRedo, FaStop } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/loading";



function FocusTimer() {
  const { isDarkMode } = useTheme();
    const [accessToken] = useState(localStorage.getItem('token'));

  const [Tasks, setTasks] = useState<Event[]>([]); // Array of tasks
  const [Cur_Task, setCur_Task] = useState<Event | null>(null);
  const [task, setTask] = useState<string>(""); // Selected task title
  const [session, setSession] = useState<number>(1); // Number of Session
  const [curSession, setCurSession] = useState<number>(1); // Current session
  const [duration, setDuration] = useState<number>(25); // Work duration in minutes
  const [breakDuration, setBreakDuration] = useState<number>(5); // Break duration in minutes
  const [timeLeft, setTimeLeft] = useState<number>(0); // Countdown in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState(false);  // If the timer is paused
  const [isBreak, setIsBreak] = useState<boolean>(false); // Toggle work/break

  //Handle AI suggest task
  const [error, setError] = useState<String>("");
  const [loading, setLoading] = useState(true);
  const [feedback, setfeedback] = useState(String);
  const [Feedback, setFeedback] = useState<{
    keyIssues: { task: string; time: string }[];
  } | null>(null);
  
  const parseFeedback = (rawText: string) => {
    // Regex to match tasks with time in minutes or hours
    const taskRegex = /-\s\*\*(.+?):\*\*\s([\d]+)\s(hour|hours|minute|minutes)\s\((.+?)\)/g;
    const parsedTasks: { task: string; time: string }[] = [];
    let match;
  
    while ((match = taskRegex.exec(rawText)) !== null) {
      const [, task, time, unit, priority] = match; // Extract task, time, unit (hours/minutes), and priority
      console.log("Task:", task);
      console.log("Time:", time, unit);
      console.log("Priority:", priority);
  
      parsedTasks.push({
        task, // Task name
        time: `${time} ${unit} (${priority})`, // Format time with unit and priority
      });
    }
  
    return parsedTasks;
  };

  const fetchSuggestAI = async () => {
    try {
      const token = localStorage.getItem("token"); // Get the Bearer token
      const response = await axios.post(
        `http://localhost:4000/task/suggest-focus-time/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add the Authorization header
          },
        }
      );
      const parsedFeedback = parseFeedback(response.data.suggestion); // Parse the feedback into structured data
      console.log(response.data.suggestion);
      setFeedback({
        keyIssues: parsedFeedback,
      });
    } catch (err) {
      console.error("Error fetching AI feedback:", err);
      setError("Unable to fetch AI feedback. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const { setIsTimerRunning } = useAuth();

  const userId = localStorage.getItem("userId");
  const location = useLocation();
  const Set_task = location.state?.schedule;
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token"); // Retrieve the token from localStorage
        const response = await axios.get(
          `http://localhost:4000/task/getOptionTasks/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the Bearer token in the header
            },
          }
        );
        const fetchedEvents: Event[] = response.data.data
        .filter((task: any) => task.status === "In Progress")
        .map((task: any) => {
          const startDate = moment.utc(task.startDate).local().toDate();
          const endDate = moment.utc(task.dueDate).local().toDate();
  
          if (task.allDay) {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
          }
  
          return {
            id: task._id,
            title: task.name,
            desc: task.description,
            priority: task.priority,
            estimatedTime: task.estimatedTime,
            status: task.status,
            start: startDate,
            end: endDate,
            allDay: task.allDay || false,
          };
        });
        setTasks(fetchedEvents);

        // Check if Set_task exists in the fetched tasks and set it as the default task
        if (Set_task) {
          const matchingTask = fetchedEvents.find((t) => t.title === Set_task.title);
          if (matchingTask) {
            setTask(matchingTask.title);
            setCur_Task(Set_task);
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
    fetchSuggestAI();
  }, [userId, Set_task]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    //Check if the task deadline is met before the timer ends, end the timer immediately and notify the user.
    const currentTime = Date.now();
    const endTime = Cur_Task?.end ? new Date(Cur_Task.end).getTime() : undefined;
    if (endTime !== undefined) {
      const remainingTime = endTime - currentTime;
      if (remainingTime <= 0) {
        setIsRunning(false);
        setTimeLeft(0);
        setIsBreak(false);
        setIsTimerRunning(false);

        Swal.fire({
          icon: "warning",
          title: "TIME OUT!",
          html: "The task deadline has arrived.",
          confirmButtonText: "OK",
        });
        UpdateTask("Expired");
        setTask("");
        setCur_Task(null);
        return () => clearInterval(timer);
      }
    }

    if (isRunning && timeLeft > 0 && !isPaused) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      const nextPhase = isBreak ? "work session" : "break";
      if (!isBreak && curSession < session) {
        Swal.fire({
          icon: "success", // Use "success" instead of "check-circle"
          title: `Session ${curSession} Completed!`,
          html: `Starting <b>${nextPhase}</b>.`,
          confirmButtonText: "Got it!",
        });

        // Switch to break session
        setTimeLeft(breakDuration * 60);
        setIsBreak(true);
        setIsRunning(true); // Restart timer
      } else if (curSession < session) {
        setCurSession(curSession + 1);
        Swal.fire({
          icon: "success", // More suitable icon for break ending
          title: "Break Time is Over!",
          html: `Starting session <b>${curSession + 1}</b>.`,
          confirmButtonText: "Let's go!",
        });

        // Switch to work session
        setTimeLeft(duration * 60);
        setIsBreak(false);
        setIsRunning(true); // Restart timer
      } else {
        setIsRunning(false);
        setTimeLeft(0);
        setIsBreak(false);
        setIsTimerRunning(false);
        Swal.fire({
          icon: "success", // Celebration icon for task completion
          title: "All Sessions Completed!",
          html: `All sessions are done. Task <b>${task}</b> is now completed!`,
          showCancelButton: true,
          confirmButtonText: "Mark as Completed",
          cancelButtonText: "Close",
        }).then((result) => {
          if (result.isConfirmed) {
            // Logic for marking the task as completed
            UpdateTask("Completed");
            setTask("");
            setCur_Task(null);
          }
        });
      }
    } else {
      // Pause timer temporarily
      timer = setInterval(() => {
        setTimeLeft((prev) => prev);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft, isBreak, duration, breakDuration]);

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

  const startTimer = () => {
    const finalTask = task; // Use newTask if provided, else selected task
    if (!finalTask) {
      Swal.fire({
        icon: "error", // More suitable icon for break ending
        title: "NO TASK!",
        html: "Please select a task!",
        confirmButtonText: "OK",
      });
      return;
    }
    setCurSession(1);
    setTask(finalTask);
    setTimeLeft(duration * 60); // Convert minutes to seconds
    setIsRunning(true);
    setIsBreak(false);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    if (isPaused) {
      // Resuming the timer
      setIsPaused(false);
    } else {
      // Pausing the timer
      setIsPaused(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setIsBreak(false);
    setIsTimerRunning(false);
    setIsPaused(false)
  };

  // Cleanup when the session ends
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      //setIsRunning(false);
      //setIsTimerRunning(false); // Notify that the timer has stopped
    }
  }, [timeLeft, isRunning]);

  const UpdateTask = async (newStatus: "Completed" | "Todo" | "In Progress" | "Expired") => {
    if (!Cur_Task) {
      console.error("Cur_Task is null or undefined.");
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "No task selected to update.",
      });
      return;
    }
    const newEndDate = new Date(Date.now() - 1000); // Subtract 1000 ms (1 second)

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:4000/task/updateTasks/${Cur_Task.id}`,
        {
          status: newStatus,
          startDate: Cur_Task.start,
          dueDate: newEndDate.toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the Bearer token in the header
          },
        }
      );

      // Optionally, update the local event's status and dates
      const updatedEvent = Tasks.find((e) => e.id === Cur_Task.id);
      if (updatedEvent) {
        updatedEvent.status = newStatus;
      }
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";

      if (error.response) {
        console.error("Update error:", error.response.data);
        const errorData = error.response.data;
        errorMessage = errorData.message || errorMessage;
      } else {
        console.error("Update error:", error.message);
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: errorMessage,
      });
    }
  };

  return (
    <div
      className={`focus-timer-container ${isDarkMode
        ? "bg-gray-900 text-white"
        : "bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300"
        } rounded-2xl shadow-xl p-10 mx-auto max-w-4xl mt-12`}
    >
      <h1
        className={`text-5xl font-extrabold text-center pb-6 ${isDarkMode ? "text-white" : "text-gray-800"
          }`}
      >
        ⏱️{" "}
        <span
          className={`bg-clip-text text-transparent bg-gradient-to-r ${isDarkMode
            ? "from-purple-700 via-blue-500 to-green-400"
            : "from-red-500 via-yellow-400 to-blue-600"
            }`}
        >
          FOCUS TIMER
        </span>
      </h1>
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

          <div className="task-controls space-y-8">
            {/* AI Suggest Section */}
            <div
              className={`${
                isDarkMode ? 'bg-gray-800 text-gray-100' 
                : 'bg-white'
              } shadow-lg rounded-lg p-8 hover:shadow-xl transition-shadow`}
            >
              {/* Loading State */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loading />
                </div>
              ) : (
                <div>
                  <h3 className={`${
                    isDarkMode ? 'text-white' 
                    : 'text-grey-800'
                    }`} 
                  >
                    Tasks suggested by AI
                  </h3>
                  {Feedback?.keyIssues.map((issue, index) => (
                    <div key={index}>
                      <p>
                        <strong>{issue.task}</strong>: {issue.time}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              
            </div>

            <table className="w-full">
              <tbody>
                {/* Select Task Row */}
                <tr>
                  <td className={`text-xl font-semibold ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>Select Task</td>
                  <td>
                    <select
                      value={task}
                      onChange={(e) => {
                        const selectedTask = Tasks.find((t) => t.title === e.target.value);

                        if (selectedTask && selectedTask.status === "In Progress") {
                          setTask(e.target.value);
                          setCur_Task(selectedTask);
                        } else {
                          Swal.fire({
                            icon: "error",
                            title: "Task status is invalid!",
                            html: "Please change the task status to <b>In Progress</b> first!",
                            confirmButtonText: "OK",
                          });
                        }
                      }}
                      disabled={isRunning}
                      className={`w-full px-6 py-3 text-lg rounded-lg border-2 ${isDarkMode
                        ? "bg-gray-800 text-gray-300 border-gray-600"
                        : "bg-white text-gray-900 border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-blue-600`}
                    >
                      <option value="">Select an Existing Task</option>
                      {Tasks.map((t) => (
                        <option key={t.id} value={t.title}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>

                {/* Number of Sessions Row */}
                <tr>
                  <td className={`text-xl font-semibold ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>Number of Sessions</td>
                  <td>
                    <input
                      type="number"
                      placeholder="Number of Sessions"
                      value={session}
                      onInput={(e) => {
                        const value = e.currentTarget.value;
                        if (/^\d+$/.test(value)) {
                          setSession(Number(value));
                        } else {
                          e.currentTarget.value = session.toString();
                        }
                      }}
                      min="1"
                      step="1"
                      disabled={isRunning}
                      className={`w-full px-6 py-3 text-lg rounded-lg border-2 ${isDarkMode
                        ? "bg-gray-800 text-gray-300 border-gray-600"
                        : "bg-white text-gray-900 border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-blue-600`}
                    />
                  </td>
                </tr>

                {/* Session Duration Row */}
                <tr>
                  <td className={`text-xl font-semibold ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>Session Duration (minutes)</td>
                  <td>
                    <input
                      type="number"
                      placeholder="Work Duration"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="1"
                      disabled={isRunning}
                      className={`w-full px-6 py-3 text-lg rounded-lg border-2 ${isDarkMode
                        ? "bg-gray-800 text-gray-300 border-gray-600"
                        : "bg-white text-gray-900 border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-blue-600`}
                    />
                  </td>
                </tr>

                {/* Break Duration Row */}
                <tr>
                  <td className={`text-xl font-semibold ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>Break Duration (minutes)</td>
                  <td>
                    <input
                      type="number"
                      placeholder="Break Duration"
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(Number(e.target.value))}
                      min="1"
                      disabled={isRunning}
                      className={`w-full px-6 py-3 text-lg rounded-lg border-2 ${isDarkMode
                        ? "bg-gray-800 text-gray-300 border-gray-600"
                        : "bg-white text-gray-900 border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-blue-600`}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Control Buttons */}
            <div className="control-buttons flex justify-center space-x-8 mt-8">
              <button
                className={`flex items-center justify-center px-8 py-3 text-xl rounded-lg transition duration-300 ${isDarkMode
                  ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900"
                  : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800"
                  }`}
                onClick={startTimer}
                disabled={isRunning}
              >
                <FaPlay className="mr-2 text-xl" /> Start
              </button>
              <button
                className={`flex items-center justify-center px-8 py-3 text-xl rounded-lg transition duration-300  ${isPaused ? `${isDarkMode
                    ? "bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900"
                    : "bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800"
                    }`
                    : `${isDarkMode
                      ? "bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900"
                      : "bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800"
                    }`
                  }`}
                onClick={stopTimer}
                disabled={!isRunning}
              >
                <FaStop className="mr-2 text-xl" /> {isPaused ? "Continue" : "Stop"}
              </button>
            </div>


            {/* Reset Button */}
            <div className="text-center mt-4">
              <button
                className={`px-8 py-3 text-xl rounded-lg transition duration-300 ${isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-[#000000FF] text-white hover:bg-[#433534FF]"
                  }`} onClick={resetTimer}
              >
                <FaRedo className="mr-2 inline text-lg" /> Reset
              </button>
            </div>
          </div>

          {/* Task Information */}
          <div
            className={`task-info mt-12 text-center ${isDarkMode ? "text-emerald-800" : "text-slate-900"
              }`}
          >
            <h2 className={`text-2xl font-semibold ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>
              {task || "No task selected"}
            </h2>
            <h3 className={`text-lg mt-2 ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>
              {Cur_Task?.start
                ? `From ${new Date(Cur_Task.start).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })} ${new Date(Cur_Task.start).toLocaleTimeString("en-US", {
                  hour12: false,
                })}`
                : ""}
            </h3>

            <h3 className={`text-lg mt-2 ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>
              {Cur_Task?.end
                ? `To ${new Date(Cur_Task.end).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })} ${new Date(Cur_Task.end).toLocaleTimeString("en-US", {
                  hour12: false,
                })}`
                : ""}
            </h3>

            <h4 className={`text-xl font-semibold mt-4 ${isDarkMode ? "text-emerald-800" : "text-slate-900"}`}>
              {isBreak ? "Break Time" : "Work Time"} -{" "}
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </h4>

            {isRunning && (
              <div className="timer-bar mt-6">
                <div
                  className={`timer-progress rounded-full ${isDarkMode
                    ? "bg-gradient-to-r from-green-500 to-blue-600"
                    : "bg-gradient-to-r from-green-400 to-blue-500"
                    }`}
                  style={{
                    width: `${((isBreak ? breakDuration : duration) * 60 - timeLeft) /
                      ((isBreak ? breakDuration : duration) * 60) *
                      100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>

  );
}

export default FocusTimer;