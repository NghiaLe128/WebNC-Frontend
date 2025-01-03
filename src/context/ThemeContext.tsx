import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    return savedTheme === 'dark';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Set the theme as an attribute on the <html> element
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Set background color based on theme
    if (isDarkMode) {
      document.body.style.backgroundColor = '#1a202c'; // Dark background
    }else{
      document.body.style.backgroundColor = '#f7fafc';
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
