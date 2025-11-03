import React, { createContext, useState } from 'react';
export const AuthContext = createContext();
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('chat_user');
    return raw ? JSON.parse(raw) : null;
  });
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('chat_user', JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('chat_user');
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
