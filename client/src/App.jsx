import React, { useState } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import api from "./services/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!api.token);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}

export default App;
