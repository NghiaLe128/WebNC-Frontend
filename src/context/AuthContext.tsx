import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the AuthContext value
interface AuthContextType {
  userId: string | null;
  userName: string | null;
  token: string | null;
  login: (userDataId: string, userDataName: string, userToken: string) => void;
  logout: () => void;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create the context with default value of `null` (will be set later by the provider)
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to access the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Define the type for the provider's props
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component with proper typing
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Login function with necessary user details for authentication
  const login = (userDataId: string, userDataName: string, userToken: string) => {
    setUserId(userDataId);
    setUserName(userDataName);
    
    setToken(userToken);

    // Store all necessary data in localStorage
    localStorage.setItem('userId', userDataId);
    localStorage.setItem('userName', userDataName);
    
    localStorage.setItem('token', userToken);
};

  // Logout function
  const logout = () => {
    setUserId(null);
    setUserName(null);
    setToken(null);

    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        userName,
        token,
        login,
        logout,
        isTimerRunning,
        setIsTimerRunning,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
