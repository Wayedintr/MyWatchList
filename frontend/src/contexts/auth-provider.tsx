import React, { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi, register as registerApi, logout as logoutApi, me as meApi } from "@/lib/api";
import { LoginRequest, RegisterRequest, User } from "@shared/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (loginRequest: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (registerRequest: RegisterRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await meApi(); // Use the centralized `meApi` function
        setUser(userData.user ? userData.user : null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (loginRequest: LoginRequest) => {
    try {
      const { user } = await loginApi(loginRequest);
      setUser(user ? user : null);
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const register = async (registerRequest: RegisterRequest) => {
    try {
      const { user } = await registerApi(registerRequest);
      setUser(user ? user : null);
    } catch (err) {
      console.error("Register failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
