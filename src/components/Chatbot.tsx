import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { FaRegWindowClose } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { UserInfo } from "../types/type";

export default function Chatbot() {
  const { isDarkMode } = useTheme();
  const userId = localStorage.getItem("userId");
  const [accessToken] = useState(localStorage.getItem('token'));

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hello! May I help you?" }]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [userDetails, setUserDetails] = useState<UserInfo>({
    userId: userId || "",
    userName: "",
    userEmail: "",
    userPassword: "",
    avatar: "",
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const userMessage = { sender: "user", text: inputValue.trim() };
      setMessages([...messages, userMessage]);

      setIsTyping(true);

      try {
        const token = localStorage.getItem("token");

        // Gửi câu hỏi đến API backend với userId trong URL
        const response = await axios.post(
          `http://localhost:4000/task/chatbot-ask/${userId}`,
          { question: inputValue.trim() },
          {
            headers: {
              Authorization: `Bearer ${token}`, // Thêm Bearer Token
            },
          }
        );

        // Kiểm tra xem phản hồi có chứa câu trả lời không
        if (response.data.message) {
          const botMessage = { sender: "bot", text: response.data.message };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          // Nếu không có câu trả lời, hiển thị một thông báo mặc định
          const botMessage = { sender: "bot", text: "Sorry, I couldn't understand your question." };
          setMessages((prev) => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const botMessage = { sender: "bot", text: "There was an error while processing your question." };
        setMessages((prev) => [...prev, botMessage]);
      } finally {
        setIsTyping(false);
      }

      // Xóa nội dung input sau khi gửi
      setInputValue("");
    }
  };

  const handleRefresh = () => {
    // Reset trạng thái tin nhắn và nhập liệu
    setMessages([{ sender: "bot", text: "Hello! May I help you?" }]);
    setInputValue("");
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // Cập nhật sự kiện khi nhấn Shift + Enter hoặc Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Enter" && e.shiftKey) {
      setInputValue(inputValue + "\n"); // Cho phép xuống dòng khi nhấn Shift + Enter
      e.preventDefault(); // Ngừng việc gửi tin nhắn khi nhấn Shift + Enter
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!accessToken || !userId) {
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:4000/user/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setUserDetails({
          userId: userId || "",
          userName: response.data.data.username,
          userEmail: response.data.data.email,
          userPassword: userDetails.userPassword,
          avatar: response.data.data.avatar || "",
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchUserData();
  }, []); // Run only once on component mount

  return (
    <div className="fixed bottom-4 right-8 z-50">
      <button
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-purple-500'} text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}
        aria-label="Chatbot"
      >
        💬
      </button>

      {isChatOpen && (
        <div
          className={`absolute bottom-20 right-0 w-96 h-[28rem] ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-black'} border rounded-2xl shadow-lg flex flex-col animate-slideUp`}
        >
          <div
            className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white font-bold flex justify-between items-center rounded-t-2xl`}
          >
            <span>Consulting Chatbot</span>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="text-white text-lg font-bold hover:text-gray-300"
              >
                🔄
              </button>
              <button
                onClick={toggleChat}
                className="text-white text-lg font-bold hover:text-gray-300"
              >
                <FaRegWindowClose size={20} />
              </button>
            </div>
          </div>
          {!accessToken ? (
            <div className={`flex flex-col items-center justify-center h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-blue-100 to-blue-300'} p-6`}>
              <div className={`text-center p-4 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 max-w-xs w-full ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-200'}`}>
                <p className={`text-lg font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'} mb-3`}>
                  You must log in to access to chat with AI.
                </p>
                <button
                  onClick={() => window.location.href = '/auth'}
                  className={`w-full py-2 rounded-md text-base font-medium shadow-sm transition-transform duration-300 hover:scale-105 ${isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Log In
                </button>
              </div>
            </div>

          ) : (
            <>
              <div
                className={`flex-1 p-4 overflow-y-auto space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                  >
                    {msg.sender === 'bot' && (
                      <img
                        src="/bot.avif"
                        alt="Bot"
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    )}
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-xl shadow ${msg.sender === 'bot'
                        ? isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-black'
                        : isDarkMode
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-500 text-white'
                        }`}
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} // Cho phép xuống dòng trong tin nhắn
                    >
                      {msg.text}
                    </div>
                    {msg.sender === 'user' && (
                      <img
                        src={userDetails.avatar || "/user.png"}
                        alt="User"
                        className="w-10 h-10 rounded-full ml-3"
                      />
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start items-center space-x-2">
                    <img
                      src="/bot.avif"
                      alt="Bot"
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div
                      className={`px-4 py-2 rounded-xl shadow flex items-center space-x-1 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'}`}
                    >
                      <span
                        className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0s', animationDuration: '0.6s' }}
                      ></span>
                      <span
                        className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s', animationDuration: '0.6s' }}
                      ></span>
                      <span
                        className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s', animationDuration: '0.6s' }}
                      ></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-300 bg-white">
                <div className="flex items-center space-x-2">
                  <textarea
                    className={`flex-1 p-3 border ${isDarkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-black border-gray-300'} rounded-xl focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-500' : 'focus:ring-blue-500'}`}
                    placeholder="Enter your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown} // Đảm bảo đúng loại sự kiện
                  />
                  <button
                    onClick={handleSendMessage}
                    className={`px-4 py-2 rounded-xl hover:scale-105 transition-transform duration-300 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'}`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>

  );
}
