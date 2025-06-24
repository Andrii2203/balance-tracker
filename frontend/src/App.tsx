import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DataViewer from "./components/DataViewer/DataViewer";
import BottomNav, { NavItem } from "./components/BottomNav/BottomNav";
import { FaChartBar, FaHome, FaUser } from 'react-icons/fa';

function App() {
  const navItems: NavItem[] = [
    { label: "Home", icon: '🏠', to: "/" },
    { label: "Charts", icon: '📊', to: "/charts" },
    { label: "News", icon: '📰', to: "/news" },
    { label: "Quotes", icon: '💬', to: "/quotes" },
    { label: "Chat", icon: '🗣️', to: "/chat" },
  ]
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/charts" element={<DataViewer sheetName="Arkusz1" />} />
          <Route path="/news" element={<div>News Page</div>} />
          <Route path="/quotes" element={<div>Quotes Page</div>} />
          <Route path="/chat" element={<div>Chat Page</div>} />
        </Routes>
        <BottomNav items={navItems} />
      </div>
    </Router>
  );
}

export default App;
