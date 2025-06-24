import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DataViewer from "./components/DataViewer/DataViewer";
import BottomNav, { NavItem } from "./components/BottomNav/BottomNav";
import NewsList from "./components/NewsList/NewsList";
import { title } from "process";

function App() {
  const navItems: NavItem[] = [
    { label: "Home", icon: '🏠', to: "/" },
    { label: "Charts", icon: '📊', to: "/charts" },
    { label: "News", icon: '📰', to: "/news" },
    { label: "Quotes", icon: '💬', to: "/quotes" },
    { label: "Chat", icon: '🗣️', to: "/chat" },
  ]

  const newsData = [
    {id: 1, title: 'Я купив курс', date: new Date("2025-06-23"),  summary:'Я вивів 1165 дол з Онфін та заплатив ці гроші за курс який дасть мені краще бачення ринку, щоб я міг точніше входити в ринок та отримувати більше прибутків'}
  ]
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/charts" element={<DataViewer sheetName="Arkusz1" />} />
          <Route path="/news" element={<NewsList news={newsData}/>} />
          <Route path="/quotes" element={<div>Quotes Page</div>} />
          <Route path="/chat" element={<div>Chat Page</div>} />
        </Routes>
        <BottomNav items={navItems} />
      </div>
    </Router>
  );
}

export default App;
