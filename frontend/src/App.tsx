import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import BottomNav from "./components/BottomNav/BottomNav";
import { UserProvider } from "./contexts/UserContext";
import AppRoutes from "./AppRoutes";
import { navItems } from "./data/navItems";

function App() {

  return (
    <UserProvider>
      <Router>
        <div className="app-container">
          <AppRoutes />
          <BottomNav items={navItems} />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
