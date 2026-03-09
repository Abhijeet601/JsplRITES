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
    const raw = localStorage.getItem('plant_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = (nextUser, token) => {
    localStorage.setItem('plant_user', JSON.stringify(nextUser));
    localStorage.setItem('plant_token', token);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('plant_user');
    localStorage.removeItem('plant_token');
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
