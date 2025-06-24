import React, { createContext, useContext, useEffect, useState } from "react";

type Role = "admin" | "user" | null;

interface UserContextType {
  username: string | null;
  role: Role;
  login: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    const savedRole = localStorage.getItem("role") as Role;
    if (savedName && savedRole) {
      setUsername(savedName);
      setRole(savedRole);
    }
  }, []);

  
  const login = (name: string) => {
      const trimmed = name.trim().toLowerCase();
      
      const adminSecrets: Record<string, string> = {
        "superlative": "Andrii",
      }

    const isAdmin = trimmed in adminSecrets;
    const displayName = isAdmin ? adminSecrets[trimmed] : name;

    const newRole: Role = isAdmin ? "admin" : "user";
    setUsername(displayName);
    setRole(newRole);
    localStorage.setItem("username", displayName);
    localStorage.setItem("role", newRole);
  };

  return (
    <UserContext.Provider value={{ username, role, login }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
