import React, { createContext, useContext, useMemo, useState } from 'react';

const PlantAuthContext = createContext(null);

export const usePlantAuth = () => {
  const ctx = useContext(PlantAuthContext);
  if (!ctx) {
    throw new Error('usePlantAuth must be used inside PlantAuthProvider');
  }
  return ctx;
};

export const PlantAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem('plant_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      sessionStorage.removeItem('plant_user');
      sessionStorage.removeItem('plant_token');
      return null;
    }
  });

  const login = (nextUser, token) => {
    sessionStorage.setItem('plant_user', JSON.stringify(nextUser));
    sessionStorage.setItem('plant_token', token);
    setUser(nextUser);
  };

  const logout = () => {
    sessionStorage.removeItem('plant_user');
    sessionStorage.removeItem('plant_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user],
  );

  return <PlantAuthContext.Provider value={value}>{children}</PlantAuthContext.Provider>;
};
