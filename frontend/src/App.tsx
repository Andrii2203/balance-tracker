import React, { useState } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import AppRoutes from "./AppRoutes";
import BottomNav from "./components/BottomNav/BottomNav";
import { navItems } from "./data/navItems";
import './App.css'

const AppContent = () => {
  const { username } = useUser();
  const [hideUI, setHideUI] = useState<boolean>(false);

  return (
    <div className="app-content-container">
      <div className="app-content-container-app-routes">
        <AppRoutes setHideUI={setHideUI} />
      </div>
      
      {username && !hideUI && (
        <BottomNav items={navItems} />
      )}
    </div>
  )
}

function App() {

  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;