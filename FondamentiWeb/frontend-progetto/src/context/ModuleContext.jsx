import React, { createContext, useState, useContext } from 'react';

const ModuleContext = createContext();

export function ModuleProvider({ children }) {
  const [activeModules, setActiveModules] = useState({
    calendar: true,
    habits: false,
    timer: true
  });

  const toggleModule = (moduleName) => {
    setActiveModules((prevModules) => ({
      ...prevModules,
      [moduleName]: !prevModules[moduleName]
    }));
  };

  return (
    <ModuleContext.Provider value={{ activeModules, toggleModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  return useContext(ModuleContext);
}