
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  username: string;
  email?: string | null;
  solanaWallet?: string | null;
  faction?: "oni" | "mud" | "ustur" | null;
  totalPoints?: number | null;
  gamesPlayed?: number | null;
  achievements?: number | null;
  credits?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  updateProfile: (profile: { faction?: "oni" | "mud" | "ustur"; email?: string; solanaWallet?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  const updateProfile = async (profile: { faction?: "oni" | "mud" | "ustur"; email?: string; solanaWallet?: string }) => {
    try {
      console.log('AuthContext: Updating profile with data:', profile);
      
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
        credentials: "include",
      });

      console.log('AuthContext: Profile update response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('AuthContext: Profile updated successfully:', userData);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Server responded with status ${response.status}`;
        console.error('AuthContext: Profile update failed:', errorMessage);
        
        // If it's an authentication error, clear the session
        if (response.status === 401) {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("user");
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("AuthContext: Update profile error:", error);
      throw error;
    }
  };

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats: {user: {...}} and {...}
        const userData = data.user || data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuthStatus,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
