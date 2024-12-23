import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context's value type
interface AuthContextType {
  loggedIn: boolean;
  checkAuth: () => Promise<void>;
}

// Create the AuthContext with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  // Function to check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:3000/protected', {
        credentials: 'include', // Include cookies for session management
      });

      if (response.ok) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setLoggedIn(false);
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ loggedIn, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
