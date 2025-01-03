import { useState, useEffect } from "react";
import axios from "axios";
import { FaChartPie, FaTasks, FaClock, FaSyncAlt, FaExchangeAlt, FaTrophy, FaExclamationTriangle, FaCheckCircle, FaStar } from "react-icons/fa";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Loading from "../../components/loading";
import moment from "moment";
import { useTheme } from "../../context/ThemeContext";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
);

const AnalyticsPage = () => {
    const { isDarkMode } = useTheme();
    const userId = localStorage.getItem("userId");
    const [accessToken] = useState(localStorage.getItem('token'));

    const [dashboardData, setDashboardData] = useState({
        totalTimeSpent: 0,
        totalEstimatedTime: 0,
        estimatedTimePercentage: 0,
        taskCount: 0,
    });

    const [loading, setLoading] = useState(true);
    const [loadingDaily, setLoadingDaily] = useState(true);
    const [error, setError] = useState<String>("");

    const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1); // Default to current month
    const [selectedYear, setSelectedYear] = useState(moment().year()); // Default to current year
    const [selectedWeek, setSelectedWeek] = useState<number>(1); // Default to week 1

    const [weekStartDates, setWeekStartDates] = useState<string[]>([]);

    const [showModal, setShowModal] = useState(false); // State to control modal visibility
    const [dailyData, setDailyData] = useState({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Time Spent (hours)',
                data: [0, 0, 0, 0, 0, 0, 0], // Default empty data
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderRadius: 5,
            },
        ],
    });

    const [taskStatusData, setTaskStatusData] = useState({
        labels: ['Todo', 'In Progress', 'Completed', 'Expired'],
        datasets: [
            {
                data: [0, 0, 0, 0],
                backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'],
                hoverOffset: 10,
            },
        ],
    });

    const [Feedback, setFeedback] = useState<{
        keyIssues: { title: string; content: string }[];
    } | null>(null);

    // Handle feedback parsing and update state
    function parseFeedback(rawText: string) {
        const lines = rawText.split('\n'); // Split the text by newline
        let keyIssues: { title: string; content: string }[] = [];
        let currentTitle = "";
        let currentContent: string[] = [];
        let insideList = false;

        // Iterate through each line
        lines.forEach(line => {
            // Check if the line starts with "**" to capture titles
            const titleMatch = line.match(/^\*\*([^*]+)\*\*/);

            if (titleMatch) {
                // If we already have content for a previous title, save it
                if (currentContent.length > 0) {
                    keyIssues.push({
                        title: currentTitle.trim(),
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
                title: currentTitle.trim(),
                content: currentContent.join('\n').trim(),
            });
        }

        return { keyIssues };
    }


    const getStartOfWeek = (week: any, year: any) => {
        return moment().year(year).week(week).startOf('week').format('YYYY-MM-DD');
    };

    const fetchData = async (startDate: any) => {
        setLoadingDaily(true);
        console.log(error)
        try {
            const token = localStorage.getItem("token"); // Get the Bearer token
            const response = await axios.get(
                `http://localhost:4000/task/daily-time-spent/${userId}?startDate=${startDate}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Add the Authorization header
                    },
                }
            );
            // Assuming the API response has an array of time spent data for each day of the week
            const timeSpent = response.data;

            // Update the daily data with the fetched time spent data
            setDailyData({
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Time Spent (hours)',
                        data: timeSpent.datasets[0].data,
                        backgroundColor: 'rgba(79, 70, 229, 0.8)',
                        borderRadius: 5,
                    },
                ],
            });
        } catch (error) {
            console.error("Error fetching daily time spent data", error);
        } finally {
            setLoadingDaily(false);
        }
    };

    const fetchTaskStatusData = async () => {
        try {
            const token = localStorage.getItem("token"); // Get the Bearer token
            const response = await axios.get(
                `http://localhost:4000/task/task-status/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Add the Authorization header
                    },
                }
            );

            setTaskStatusData({
                labels: ['Todo', 'In Progress', 'Completed', 'Expired'],
                datasets: [
                    {
                        data: response.data.datasets[0].data,
                        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'],
                        hoverOffset: 10,
                    },
                ],
            });

        } catch (error) {
            console.error('Error fetching task status data:', error);
        }
    };

    const fetchAiFeedback = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token"); // Get the Bearer token
            const response = await axios.post(
                `http://localhost:4000/task/ai-feedback/${userId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Add the Authorization header
                    },
                }
            );
            const parsedFeedback = parseFeedback(response.data.feedback); // Parse the feedback into structured data
            setFeedback(parsedFeedback);
        } catch (err) {
            console.error("Error fetching AI feedback:", err);
            setError("Unable to fetch AI feedback. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        setError("")

        fetchAiFeedback();
    };

    const handleDateChange = () => {
        const selectedStartDate = weekStartDates[selectedWeek - 1]; // Get the start date of the selected week
        fetchData(selectedStartDate); // Fetch data using the selected start date
        setShowModal(false); // Close modal after selection
    };

    const getWeeksStartDates = (year: number, month: number) => {
        const startOfMonth = moment(`${year}-${month}-01`);
        const endOfMonth = startOfMonth.clone().endOf('month');

        let weekStartDates = [];
        let currentWeekStart = startOfMonth.clone().startOf('week');  // Start of the first week

        // Loop through the weeks of the selected month
        while (currentWeekStart.isBefore(endOfMonth)) {
            weekStartDates.push(currentWeekStart.format('YYYY-MM-DD'));  // Store the start date of each week
            currentWeekStart.add(1, 'week');  // Move to the next week
        }

        return weekStartDates;
    };

    useEffect(() => {
        if (selectedYear && selectedMonth) {
            const weeks = getWeeksStartDates(selectedYear, selectedMonth);
            setWeekStartDates(weeks);

            // Calculate the current week of the selected month
            const currentDate = moment(); // Current date
            const startOfMonth = moment(`${selectedYear}-${selectedMonth}-01`); // First day of the selected month
            const currentWeekNumber = currentDate.isBetween(startOfMonth, startOfMonth.clone().endOf('month'), null, '[]')
                ? currentDate.week() - startOfMonth.week() + 1
                : 1; // If current date is in the selected month, calculate the week, otherwise default to 1

            setSelectedWeek(currentWeekNumber); // Set the selected week to the current week
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        const defaultStartDate = getStartOfWeek(moment().week(), moment().year());

        // Fetch the data with the default start date
        fetchData(defaultStartDate);

        fetchTaskStatusData();

        fetchAiFeedback();
    }, [userId]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Pass the userId in the URL
                const token = localStorage.getItem("token"); // Get the Bearer token from local storage
                const response = await axios.get(
                    `http://localhost:4000/task/dashboard/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`, // Include the Authorization header
                        },
                    }
                );
                setDashboardData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, [userId]);

    const getIconAndBgColor = (title: string) => {
        // Nếu là chế độ tối, thay đổi màu nền cho các phần
        if (isDarkMode) {
            if (title.includes('Areas of Excellence')) {
                return { icon: <FaTrophy className="text-yellow-400" />, bgColor: 'bg-yellow-800' };
            } else if (title.includes('Tasks Needing Attention')) {
                return { icon: <FaExclamationTriangle className="text-red-500" />, bgColor: 'bg-red-800' };
            } else if (title.includes('Motivational Feedback')) {
                return { icon: <FaCheckCircle className="text-green-500" />, bgColor: 'bg-green-800' };
            }
            return { icon: <FaStar className="text-gray-500" />, bgColor: 'bg-gray-800' }; // default icon for dark mode
        }

        // Nếu không phải chế độ tối (chế độ sáng)
        if (title.includes('Areas of Excellence')) {
            return { icon: <FaTrophy className="text-yellow-400" />, bgColor: 'bg-yellow-50' };
        } else if (title.includes('Tasks Needing Attention')) {
            return { icon: <FaExclamationTriangle className="text-red-500" />, bgColor: 'bg-red-50' };
        } else if (title.includes('Motivational Feedback')) {
            return { icon: <FaCheckCircle className="text-green-500" />, bgColor: 'bg-green-50' };
        }
        return { icon: <FaStar className="text-gray-500" />, bgColor: 'bg-gray-50' }; // default icon
    };

    return (
        <div
            className={`min-h-screen p-8 ${isDarkMode
                ? "bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200"
                : "bg-gradient-to-b from-gray-100 to-gray-200 text-gray-800"
                }`}
        >
            {/* Header */}
            <div className="mb-8 text-center">
                <h1
                    className={`text-5xl font-extrabold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}
                >
                    Analytics Dashboard
                </h1>
                <p
                    className={`text-lg mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                    Track your focus sessions and monitor your progress.
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
                    {/* Metrics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div
                            className={`rounded-lg p-6 flex items-center transition-shadow ${isDarkMode
                                ? "bg-gray-800 shadow-lg hover:shadow-gray-700"
                                : "bg-white shadow-lg hover:shadow-xl"
                                }`}
                        >
                            <FaClock
                                className={`text-4xl mr-4 ${isDarkMode ? "text-indigo-300" : "text-indigo-500"
                                    }`}
                            />
                            <div>
                                <h2
                                    className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                                        }`}
                                >
                                    Total Time Spent
                                </h2>
                                <p
                                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                                        }`}
                                    title="Total time spent / Total estimated time"
                                >
                                    {dashboardData.totalTimeSpent}h / {dashboardData.totalEstimatedTime}h
                                </p>
                            </div>
                        </div>

                        <div
                            className={`rounded-lg p-6 flex items-center transition-shadow ${isDarkMode
                                ? "bg-gray-800 shadow-lg hover:shadow-gray-700"
                                : "bg-white shadow-lg hover:shadow-xl"
                                }`}
                            title="Estimated time percentage"
                        >
                            <FaChartPie
                                className={`text-4xl mr-4 ${isDarkMode ? "text-green-300" : "text-green-500"
                                    }`}
                            />
                            <div>
                                <h2
                                    className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                                        }`}
                                >
                                    Estimated Time
                                </h2>
                                <p
                                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                                        }`}
                                >
                                    {dashboardData.estimatedTimePercentage}%
                                </p>
                            </div>
                        </div>

                        <div
                            className={`rounded-lg p-6 flex items-center transition-shadow ${isDarkMode
                                ? "bg-gray-800 shadow-lg hover:shadow-gray-700"
                                : "bg-white shadow-lg hover:shadow-xl"
                                }`}
                            title="Total number of tasks"
                        >
                            <FaTasks
                                className={`text-4xl mr-4 ${isDarkMode ? "text-yellow-300" : "text-yellow-500"
                                    }`}
                            />
                            <div>
                                <h2
                                    className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                                        }`}
                                >
                                    Task Breakdown
                                </h2>
                                <p
                                    className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"
                                        }`}
                                >
                                    {dashboardData.taskCount} Tasks
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div
                            className={`rounded-lg p-8 transition-shadow ${isDarkMode
                                ? "bg-gray-800 shadow-lg hover:shadow-gray-700"
                                : "bg-white shadow-lg hover:shadow-xl"
                                }`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3
                                    className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
                                        }`}
                                >
                                    Daily Time Spent
                                </h3>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className={`flex items-center py-2 px-4 rounded-md transition ${isDarkMode
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                        }`}
                                >
                                    <FaExchangeAlt className="mr-2 text-white" />
                                    Change Date
                                </button>
                            </div>
                            {loadingDaily ? (
                                <Loading />
                            ) : (
                                <Bar
                                    data={dailyData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    title: (tooltipItem) => {
                                                        const dayOfWeek = dailyData.labels[tooltipItem[0].dataIndex];
                                                        const startDate = moment(weekStartDates[selectedWeek - 1]);
                                                        const date = startDate
                                                            .add(tooltipItem[0].dataIndex, "days")
                                                            .format("MMM D, YYYY");
                                                        return `${dayOfWeek} - ${date}`;
                                                    },
                                                    label: (tooltipItem) =>
                                                        `Time Spent: ${tooltipItem.raw} hours`,
                                                },
                                            },
                                        },
                                        scales: {
                                            x: {
                                                title: {
                                                    display: true,
                                                    text: "Days of the Week",
                                                    color: isDarkMode ? "white" : "black",
                                                },
                                            },
                                            y: {
                                                title: {
                                                    display: true,
                                                    text: "Hours",
                                                    color: isDarkMode ? "white" : "black",
                                                },
                                            },
                                        },
                                    }}
                                />
                            )}
                        </div>

                        <div
                            className={`rounded-lg p-8 transition-shadow ${isDarkMode
                                ? "bg-gray-800 shadow-lg hover:shadow-gray-700"
                                : "bg-white shadow-lg hover:shadow-xl"
                                }`}
                        >
                            <h3
                                className={`text-2xl font-bold mb-12 ${isDarkMode ? "text-gray-100" : "text-gray-800"
                                    }`}
                            >
                                Task Status Breakdown
                            </h3>
                            <div className="flex justify-center">
                                <Doughnut
                                    data={taskStatusData}
                                    options={{
                                        maintainAspectRatio: false,
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: "bottom",
                                                labels: {
                                                    font: {
                                                        size: 14,
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                    width={200}
                                    height={200}
                                />
                            </div>
                        </div>
                    </div>

                    {/* AI Feedback Section */}
                    <div
                        className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
                            } shadow-lg rounded-lg p-8 hover:shadow-xl transition-shadow`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">
                                AI Feedback
                            </h3>
                            <button
                                onClick={handleRefresh}
                                className={`flex items-center ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
                                    } text-white py-2 px-6 rounded-md transition transform duration-300 ease-in-out`}
                            >
                                <FaSyncAlt className="mr-2" />
                                Refresh
                            </button>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loading />
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Feedback?.keyIssues.map((issue, index) => {
                                    const { icon, bgColor } = getIconAndBgColor(issue.title);

                                    // Adjust background color for dark mode
                                    const adjustedBgColor = bgColor;

                                    // Remove numbers and the period from the start of the title
                                    const cleanedTitle = issue.title.replace(/^\d+\.\s*/, '');

                                    return (
                                        <div
                                            key={index}
                                            className={`space-y-6 ${adjustedBgColor} p-6 rounded-lg shadow-md hover:bg-opacity-80 transition-all`}
                                        >
                                            <div className="flex items-center mb-4">
                                                {/* Icon for each section */}
                                                <div className="mr-4 text-2xl">{icon}</div>
                                                <h3 className="text-2xl font-semibold">
                                                    {cleanedTitle}
                                                </h3>
                                            </div>

                                            {/* Render content for each section */}
                                            <div
                                                style={{
                                                    paddingLeft: '1.5rem',
                                                    lineHeight: '1.6',
                                                }}
                                            >
                                                {issue.content.split('\n').map((line, lineIndex) => {
                                                    const cleanLine = line
                                                        .replace(/\*\*/g, '')
                                                        .replace(/\*/g, '')
                                                        .trim(); // Clean up line
                                                    const isBullet = cleanLine.startsWith('•');
                                                    const isNumbered = /^\d+\./.test(cleanLine); // Check if the line starts with a number
                                                    let lineWithoutNumber = cleanLine;

                                                    // If the line starts with a number, remove the number
                                                    if (isNumbered) {
                                                        lineWithoutNumber = cleanLine.replace(
                                                            /^\d+\.\s*/,
                                                            ''
                                                        ); // Remove any number
                                                    }

                                                    return (
                                                        <p key={lineIndex} className="mb-3">
                                                            {/* Don't number the first line of each section */}
                                                            {lineIndex !== 0 &&
                                                                !isBullet && (
                                                                    <span
                                                                        className={`font-bold ${isDarkMode
                                                                            ? 'text-blue-400'
                                                                            : 'text-blue-500'
                                                                            } mr-2`}
                                                                    >
                                                                        {lineIndex}. {/* Start numbering from 1 for the rest of the lines */}
                                                                    </span>
                                                                )}

                                                            {/* Render bullet points */}
                                                            {isBullet && (
                                                                <span
                                                                    className={`font-bold ${isDarkMode
                                                                        ? 'text-blue-400'
                                                                        : 'text-blue-500'
                                                                        } mr-2`}
                                                                >
                                                                    •
                                                                </span>
                                                            )}

                                                            {/* Render cleaned content without the number */}
                                                            <span>{lineWithoutNumber}</span>
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Modal for Date Selection */}
                    {showModal && (
                        <div
                            className={`fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-500'}`}
                        >
                            <div
                                className={`p-8 rounded-lg shadow-lg w-96 ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
                            >
                                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                    Select Month, Year, and Week
                                </h2>

                                {/* Year Selection */}
                                <div className="mb-4">
                                    <label className={`text-gray-800 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => {
                                            const year = Number(e.target.value);
                                            setSelectedYear(year);
                                            setWeekStartDates(getWeeksStartDates(year, selectedMonth)); // Update weeks when year changes
                                        }}
                                        className={`w-full p-2 border rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                                    >
                                        {[2023, 2024, 2025].map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Month Selection */}
                                <div className="mb-4">
                                    <label className={`text-gray-800 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Month</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => {
                                            const month = Number(e.target.value);
                                            setSelectedMonth(month);
                                            setWeekStartDates(getWeeksStartDates(selectedYear, month)); // Update weeks when month changes
                                        }}
                                        className={`w-full p-2 border rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                                        disabled={!selectedYear} // Disable month selection if year is not selected
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i} value={i + 1}>
                                                {moment().month(i).format('MMMM')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Week Selection */}
                                <div className="mb-4">
                                    <label className={`text-gray-800 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Week</label>
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                        className={`w-full p-2 border rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                                        disabled={!selectedMonth} // Disable week selection if month is not selected
                                    >
                                        {weekStartDates.map((startDate, index) => (
                                            <option key={startDate} value={index + 1}>
                                                Week {index + 1} - {moment(startDate).format('MMM D, YYYY')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleDateChange}
                                        className={`bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                                    >
                                        Save
                                    </button>
                                </div>

                                {/* Close Modal */}
                                <div
                                    onClick={() => setShowModal(false)}
                                    className={`absolute top-2 right-2 cursor-pointer ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                >
                                    X
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
