import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import AppRoutes from "./AppRoutes";
import './App.css';

function App() {
  React.useEffect(() => {
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme-color');
    if (savedTheme) {
      document.documentElement.style.setProperty('--primary-color', savedTheme);
    }
  }, []);

  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
}

export default App;
