import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Event } from "../../types/events";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  Views,
} from "react-big-calendar";
import moment from "moment-timezone";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import axios from "axios";
import { FaCheckCircle, FaClipboardList, FaEdit, FaExclamationTriangle, FaRegClock, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { IoClose } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext";

moment.locale("en-GB");
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

const allViews = Object.keys(Views)
  .filter((k) => k !== "WORK_WEEK")
  .map((k) => Views[k as keyof typeof Views]);


export default function Schedule() {
  const [accessToken] = useState(localStorage.getItem('token'));

  const [showModal, setShowModal] = useState(false);
  const [modalEvent, setModalEvent] = useState<Event | null>(null);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showMoreEvents, setShowMoreEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [loading] = useState(false);
  const [analyze_loading, setAnalyzeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [FeedbackModal, setFeedbackModal] = useState(false);
  const [Feedback, setFeedback] = useState<{
    keyIssues: { title: string; content: string }[];
  } | null>(null);

  const { isDarkMode } = useTheme();
  const userId = localStorage.getItem("userId");

  // Handle feedback parsing and update state
  function parseFeedback(rawText: string) {
    const lines = rawText.split('\n'); // Split the text by newline
    let keyIssues: { title: string; content: string }[] = [];
    let currentTitle = "";
    let currentContent: string[] = [];
    let insideList = false; // To track if inside a numbered or bullet list

    // Iterate through each line
    lines.forEach(line => {
      // Check if the line starts with "**" to capture titles
      const titleMatch = line.match(/^\*\*([^*]+)\*\*/); // Match bold title

      if (titleMatch) {
        // If we already have content for a previous title, save it
        if (currentContent.length > 0) {
          keyIssues.push({
            title: `**${currentTitle.trim()}**`, // Bold title
            content: currentContent.join('\n').trim(),
          });
        }

        // Set the new title and reset the content array
        currentTitle = titleMatch[1];
        currentContent = [];
        insideList = false; // Reset list tracking
      } else if (line.match(/^\d+\./) || line.match(/^\* /)) {
        // Check if the line is part of a numbered list or bullet list
        if (!insideList) {
          insideList = true;
        }
        currentContent.push(line.trim()); // Add the list item content
      } else if (line.trim() !== "") {
        // Add any other regular content
        currentContent.push(line.trim());
      }
    });

    // Push the last title and content if there was any content
    if (currentContent.length > 0) {
      keyIssues.push({
        title: `**${currentTitle.trim()}**`, // Bold title
        content: currentContent.join('\n').trim(),
      });
    }
    return { keyIssues };
  }


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
        const fetchedEvents = response.data.data.map((task: any) => {
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
        setCalendarEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [userId]);

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

  const handleShowMore = (events: Event[]) => {
    setShowMoreEvents(events); // Store the events to show in the "Show More" modal
    setShowMoreModal(true);    // Show the "Show More" modal
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleEventDrop = async ({ event, start, end }: { event: Event; start: Date | string; end: Date | string }) => {
    // Update event's start and end dates in the local state
    const updatedEvents = calendarEvents.map((e) =>
      e.id === event.id ? { ...e, start: new Date(start), end: new Date(end) } : e
    );
    setCalendarEvents(updatedEvents);

    // Determine the new status based on the event's new date
    const newStartDate = moment(start);
    const newEndDate = moment(end);
    let newStatus = event.status;

    // Case 1: "Todo" -> "Expired" if moved to a past date
    if (event.status === "Todo" && newStartDate.isBefore(moment())) {
      newStatus = "Expired";
    }

    // Case 2: "In Progress" -> "Expired" if moved to a past date
    if (event.status === "In Progress" && newEndDate.isBefore(moment())) {
      newStatus = "Expired";
    }

    // Case 3: "Completed" -> "Expired" if moved to a past date
    if (event.status === "Completed" && newStartDate.isBefore(moment())) {
      newStatus = "Expired";
    }

    // Case 4: "Expired" -> stays "Expired"
    if (event.status === "Expired") {
      if (newStartDate.isAfter(moment()) || newEndDate.isAfter(moment())) {
        newStatus = "Todo"; // If moved to a future date, reset to "Todo"
      } else {
        newStatus = "Expired"; // Otherwise, remain "Expired"
      }
    }

    // Send the updated start, end dates and status to the backend
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:4000/task/updateTasks/${event.id}`,
        {
          status: newStatus,
          startDate: newStartDate.toISOString(),
          dueDate: newEndDate.toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the Bearer token in the header
          },
        }
      );

      // Optionally, update the local event's status and dates
      const updatedEvent = updatedEvents.find((e) => e.id === event.id);
      if (updatedEvent) {
        Swal.fire({
          icon: "success",
          title: "Update Task Successful!",
          text: "You can check task now.",
          timer: 2000,
          showConfirmButton: false,
        });
        updatedEvent.status = newStatus;
        updatedEvent.start = new Date(start);
        updatedEvent.end = new Date(end);
      }
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";

      if (error.response) {
        console.error("Sign up error:", error.response.data);
        const errorData = error.response.data;
        errorMessage = errorData.message || errorMessage;
      } else {
        console.error("Sign up error:", error.message);
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Sign Up Failed",
        text: errorMessage,
      });
    }
  };


  const handleEventDoubleClick = (event: object, e: React.SyntheticEvent<HTMLElement>) => {
    const typedEvent = event as Event; // Cast the event to your custom Event type
    setModalEvent(typedEvent);         // Set the event details in the modal
    setShowModal(true);                // Show the modal
  };

  const handleEditEvent = (event: Event) => {
    
    navigate("/tasks", { state: { schedule: event } });
  };

  const handleDeleteTask = (taskId: string) => {
    setCalendarEvents((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const navigate = useNavigate();
  const handleFocusTime = (event: Event) => {

    if (event.status === "In Progress") {
      navigate("/timer", { state: { schedule: event } });
    } else {
      Swal.fire({
        icon: "warning", // More suitable icon for break ending
        title: "Task status is invalid!",
        html: "Please change the task status to <b>In Progress</b> first!",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDeleteEvent = (event: Event) => {
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
          const response = await axios.delete(`http://localhost:4000/task/deleteTasks/${event.id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Include Bearer token
            },
          });
          if (response.status === 200) {
            // Task deleted successfully
            Swal.fire({
              title: "Deleted!",
              text: "The task has been deleted.",
              icon: "success",
              confirmButtonText: "OK",
            }).then(() => {
              handleDeleteTask(event.id); // Update state or UI after deletion
              setShowModal(false); // Close the modal or dialog
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

  const handleAnalyze = async () => {
    setAnalyzeLoading(true);
    setError(null);
    setFeedback(null);

    console.log(error)
    try {
      const response = await axios.post(
        `http://localhost:4000/task/analyze-schedule`,
        { calendarEvents },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Include Bearer token
          },
        }
      );

      const parsedFeedback = parseFeedback(response.data.feedback); // Parse the feedback into structured data
      setFeedback(parsedFeedback);
      setFeedbackModal(true);
    } catch (error) {
      console.error('Error analyzing schedule:', error);
      setError('Failed to analyze schedule. Please try again later.');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen py-10 ${isDarkMode ? "bg-gradient-to-r from-gray-600 to-gray-100"
          : "bg-gradient-to-r from-indigo-100 to-purple-100"
        }`}
    >
      <h1 className="text-5xl font-extrabold text-center mb-12 text-gray-800">
        📅{" "}
        <span
          className={`bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 ${isDarkMode ? "text-transparent bg-gradient-to-r from-red-600 to-red-800"
              : "text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"
            }`}
        >
          Task Calendar
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

          <div className="flex items-center justify-between px-5 mb-6">
            <div className="relative z-50 flex items-center space-x-3">
              <label htmlFor="date-picker"
                className={`text-lg font-semibold ${isDarkMode ? "text-white"
                    : "text-gray-700"
                  }`}
              >
                Select Month and Year:
              </label>
              <DatePicker
                id="date-picker"
                selected={currentDate}
                onChange={handleDateChange}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                className="p-3 border-2 border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg"
              />
              <button
                onClick={handleAnalyze}
                disabled={analyze_loading}
                className={` ${isDarkMode ? "bg-[#00FF2FFF] text-[#000000FF]"
                    : "bg-[#007BFF] text-[#FFFFFFFF]"
                  }`}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: analyze_loading ? 'not-allowed' : 'pointer',
                }
                }>
                {analyze_loading ? 'Analyzing...' : 'Analyze Schedule'}
              </button>
            </div>

          </div>

          {loading ? (
            <div className="text-center text-gray-700">Loading events...</div>
          ) : (
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
              <DndProvider backend={HTML5Backend}>
                <DragAndDropCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  step={30}
                  views={allViews}
                  date={currentDate}
                  popup={false}
                  onNavigate={handleNavigate}
                  onEventDrop={({ event, start, end }) =>
                    handleEventDrop({
                      event: event as Event,
                      start,
                      end,
                    })
                  }
                  onShowMore={(events) => handleShowMore(events as Event[])} // Update this to show more events
                  onDoubleClickEvent={handleEventDoubleClick}  // Double-click handler
                  style={{ height: 600, borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}
                />
              </DndProvider>
            </div>
          )}

          {/* Show More Events Modal */}
          {showMoreModal && showMoreEvents.length > 0 && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
              onClick={() => setShowModal(false)}
            >
              <div
                className={`rounded-xl shadow-2xl p-6 w-11/12 md:w-1/2 lg:w-1/3 transform transition-all scale-95 max-h-full overflow-y-auto ${isDarkMode ? "bg-[#000000FF]"
                    : "bg-[#FFFFFFFF]"
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <h2
                    className={`}text-2xl font-bold mb-4 ${isDarkMode ? "text-gray-800"
                        : "bg-gradient-to-br from-black via-red-300 to-red-600 text-transparent bg-clip-text"
                      }`}
                  >
                    All Events
                  </h2>

                  <p className="text-sm text-gray-600">Here are all the events scheduled.</p>
                </div>

                <ul className="space-y-4">
                  {showMoreEvents.map((event, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition"
                    >
                      <span className="font-semibold text-gray-700 text-lg">{event.title}</span>
                      <span className="text-xs text-gray-500">
                        {moment(event.start).format("hh:mm A")} -{" "}
                        {moment(event.end).format("hh:mm A")}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className="mt-6 w-full py-2 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow hover:opacity-90 transition"
                  onClick={() => setShowMoreModal(false)}
                >
                  Close
                </button>
              </div>
            </div>

          )}

          {showModal && modalEvent && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
              onClick={() => setShowModal(false)}
            >
              <div
                className="bg-white rounded-lg shadow-2xl p-8 w-11/12 md:w-2/3 lg:w-1/2 transform transition-all scale-95 max-h-full overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Icon */}
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
                  onClick={() => setShowModal(false)}
                >
                  <IoClose size={30} />
                </button>

                <div className="text-center mb-8">
                  <h2
                    className={`text-3xl font-extrabold mb-4 ${isDarkMode ? "bg-gradient-to-br from-blue via-red-300 to-blue-600 text-transparent bg-clip-text"
                        : "text-gray-800"
                      }`}
                  >
                    Event Details
                  </h2>
                  <p className="text-lg text-gray-600">Here are the details of your event.</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold text-gray-800">Title:</p>
                    <p className="text-lg text-gray-600">{modalEvent.title}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold text-gray-800">Description:</p>
                    <p className="text-lg text-gray-600">{modalEvent.desc}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold text-gray-800">Time:</p>
                    <p className="text-lg text-gray-600">
                      {moment(modalEvent.start).format("hh:mm A")} - {moment(modalEvent.end).format("hh:mm A")}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold text-gray-800">Status:</p>
                    <p className="text-lg text-gray-600">{modalEvent.status}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold text-gray-800">Priority:</p>
                    <p className="text-lg text-gray-600">{modalEvent.priority}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold text-gray-800">Estimated Time:</p>
                    <p className="text-lg text-gray-600">{modalEvent.estimatedTime}</p>
                  </div>
                </div>

                <div className="flex justify-between space-x-6 mb-6">
                  {/* Edit Button */}
                  <button
                    className="flex items-center justify-center w-full py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg transition transform hover:scale-105"
                    onClick={() => handleEditEvent(modalEvent)}
                  >
                    <FaEdit className="mr-2" size={20} /> Edit Event
                  </button>

                  {/* Delete Button */}
                  <button
                    className="flex items-center justify-center w-full py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg transition transform hover:scale-105"
                    onClick={() => handleDeleteEvent(modalEvent)}
                  >
                    <FaTrash className="mr-2" size={20} /> Delete Event
                  </button>
                </div>

                {/* Focus Time Button */}
                <div className="mb-6">
                  <button
                    className="flex items-center justify-center w-full py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 hover:shadow-lg transition transform hover:scale-105"
                    onClick={() => handleFocusTime(modalEvent)}
                  >
                    <FaRegClock className="mr-2" size={20} /> Focus Time
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Show Feedback Modal */}
          {FeedbackModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
              onClick={() => setFeedbackModal(false)}
            >
              <div
                className={`rounded-lg shadow-xl p-8 w-11/12 md:w-2/3 lg:w-1/2 transform transition-all scale-95 max-h-full overflow-y-auto ${isDarkMode ? "bg-[#A28D9FFF]"
                    : "bg-white"
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-8">
                  <h2
                    className={`text-3xl font-extrabold text-gray-800 mb-4 ${isDarkMode ? "bg-gradient-to-br from-red via-green-300 to-blue-600 text-transparent bg-clip-text"
                        : "text-gray-800"
                      }`}
                  >
                    AI Feedback
                  </h2>
                  <p
                    className={`text-lg ${isDarkMode ? "text-white"
                        : "text-gray-600"
                      }`}
                  >
                    Here are the feedback about your schedules.
                  </p>
                </div>

                <div className="space-y-6 mb-6">
                  {Feedback?.keyIssues.map((issue, index) => {


                    // Check if the issue title is empty, if it is return null for that iteration
                    if (!issue.title.trim()) return null;

                    // Check for specific titles and apply the custom box styling
                    if (issue.title.trim() === '**Warnings:**' || issue.title.trim() === '**Problems:**') {
                      return (
                        <div key={index} className="bg-yellow-50 p-4 rounded-lg shadow-md">
                          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                            <FaExclamationTriangle className="text-yellow-500 mr-2" />
                            <span className="text-yellow-500 mr-2">
                              {issue.title.replace(/\*\*/g, '')}
                            </span>
                          </h3>

                          {/* Iterate over each line of the content */}
                          {issue.content.split('\n').map((line, lineIndex) => {
                            // Clean the line by removing asterisks, stars, etc.
                            const cleanLine = line
                              .replace(/\*\*/g, '')  // Remove bold markers (**)
                              .replace(/\*/g, '')    // Remove italic markers (*)
                              .replace(/^\*\*\*\*/g, '') // Remove four asterisks (****)
                              .trim(); // Remove any extra leading/trailing whitespace

                            const isBullet = cleanLine.startsWith('•');
                            const isNumbered = /^\d+\./.test(cleanLine);

                            return (
                              <p key={lineIndex} style={{ margin: '0.5rem 0' }}>
                                {/* Handle bullets */}
                                {isBullet && <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>•</span>}

                                {/* Handle numbered list */}
                                {!isNumbered && cleanLine && (
                                  <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
                                    {lineIndex + 1}.
                                  </span>
                                )}

                                {/* Display clean content */}
                                <span>{cleanLine}</span>
                              </p>
                            );
                          })}
                        </div>
                      );
                    } else if (issue.title.trim() === '**Prioritization Recommendations:**' || issue.title.trim() === '**Recommendations:**') {
                      return (
                        <div key={index} className="bg-blue-50 p-4 rounded-lg shadow-md">
                          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                            <FaClipboardList className="text-blue-500 mr-2" />
                            <span className="text-blue-500 mr-2">
                              {issue.title.replace(/\*\*/g, '')}
                            </span>
                          </h3>
                          {/* Iterate over each line of the content */}
                          {issue.content.split('\n').map((line, lineIndex) => {
                            // Clean the line by removing asterisks, stars, etc.
                            const cleanLine = line
                              .replace(/\*\*/g, '')  // Remove bold markers (**)
                              .replace(/\*/g, '')    // Remove italic markers (*)
                              .replace(/^\*\*\*\*/g, '') // Remove four asterisks (****)
                              .trim(); // Remove any extra leading/trailing whitespace

                            const isBullet = cleanLine.startsWith('•');
                            const isNumbered = /^\d+\./.test(cleanLine);

                            return (
                              <p key={lineIndex} style={{ margin: '0.5rem 0' }}>
                                {/* Handle bullets */}
                                {isBullet && <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>•</span>}

                                {/* Handle numbered list */}
                                {!isNumbered && cleanLine && (
                                  <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
                                    {lineIndex + 1}.
                                  </span>
                                )}

                                {/* Display clean content */}
                                <span>{cleanLine}</span>
                              </p>
                            );
                          })}
                        </div>
                      );
                    } else if (issue.title.trim() === '**Simple Steps to Fix:**') {
                      return (
                        <div key={index} className="bg-green-50 p-4 rounded-lg shadow-md">
                          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                            <FaCheckCircle className="text-green-500 mr-2" />
                            <span className="text-green-500 mr-2">
                              {issue.title.replace(/\*\*/g, '')}
                            </span>
                          </h3>
                          {/* Iterate over each line of the content */}
                          {issue.content.split('\n').map((line, lineIndex) => {
                            // Clean the line by removing asterisks, stars, etc.
                            const cleanLine = line
                              .replace(/\*\*/g, '')  // Remove bold markers (**)
                              .replace(/\*/g, '')    // Remove italic markers (*)
                              .replace(/^\*\*\*\*/g, '') // Remove four asterisks (****)
                              .trim(); // Remove any extra leading/trailing whitespace

                            const isBullet = cleanLine.startsWith('•');
                            const isNumbered = /^\d+\./.test(cleanLine);

                            return (
                              <p key={lineIndex} style={{ margin: '0.5rem 0' }}>
                                {/* Handle bullets */}
                                {isBullet && <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>•</span>}

                                {/* Handle numbered list */}
                                {!isNumbered && cleanLine && (
                                  <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
                                    {lineIndex + 1}.
                                  </span>
                                )}

                                {/* Display clean content */}
                                <span>{cleanLine}</span>
                              </p>
                            );
                          })}
                        </div>
                      );
                    } return (
                      <div key={index}>
                        {/* Render the title with or without bold markers */}
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>
                          {issue.title.replace(/\*\*/g, '')}
                        </h3>

                        <div style={{ paddingLeft: '1.5rem', lineHeight: '1.5' }}>
                          {/* Check if the title is empty to avoid numbering content */}
                          {issue.title.trim() !== "****" && (
                            issue.content.split('\n').map((line, lineIndex) => {
                              // Clean the line by removing asterisks, stars, etc.
                              const cleanLine = line
                                .replace(/\*\*/g, '')  // Remove bold markers (**)
                                .replace(/\*/g, '')    // Remove italic markers (*)
                                .replace(/^\*\*\*\*/g, '') // Remove four asterisks (****)
                                .trim(); // Remove any extra leading/trailing whitespace

                              const isBullet = cleanLine.startsWith('•');
                              const isNumbered = /^\d+\./.test(cleanLine);

                              return (
                                <p key={lineIndex} style={{ margin: '0.5rem 0' }}>
                                  {/* Handle bullets */}
                                  {isBullet && <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>•</span>}

                                  {/* Handle numbered list but only if it doesn't already have numbering */}
                                  {!isNumbered && cleanLine && (
                                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
                                      {lineIndex + 1}.
                                    </span>
                                  )}

                                  {/* Display clean content */}
                                  <span>{cleanLine}</span>
                                </p>
                              );
                            })
                          )}

                          {/* If the title is empty, display the content without numbering */}
                          {issue.title.trim() === "****" && (
                            issue.content.split('\n').map((line, lineIndex) => {
                              // Clean the line by removing asterisks, stars, etc.
                              const cleanLine = line
                                .replace(/\*\*/g, '')  // Remove bold markers (**)
                                .replace(/\*/g, '')    // Remove italic markers (*)
                                .replace(/^\*\*\*\*/g, '') // Remove four asterisks (****)
                                .trim(); // Remove any extra leading/trailing whitespace

                              return (
                                <span key={lineIndex}>{cleanLine}</span> // Render the cleaned line
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Close Button*/}
                <button
                  className={`w-full py-3 rounded-lg shadow-lg hover:bg-gray-300 transition ${isDarkMode ? "bg-[#B56B64FF] text-white hover:bg-[#F66C5FFF]"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  onClick={() => setFeedbackModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}