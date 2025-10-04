import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import HomePage from "./components/HomePage/HomePage";
import DataViewer from "./components/DataViewer/DataViewer";
import NewsList from "./components/NewsList/NewsList";
import { newsData } from "./data/newsData";
// import WelcomePage from './components/WelcomePage/WelcomePage';
import ChatPage from './components/ChatPage/ChatPage';

const AppRoutes: React.FC<{setHideUI: (val: boolean)=>void}> = ({setHideUI}) => {
  const [userLang, setUserLang] = useState<string | null>(() => localStorage.getItem('userLang'));
  return (
    <Routes>
      {/* <Route path="/" element={<Navigate to="/home" replace />} /> */}
      {/* <Route path="/home" element={userLang ? <HomePage setHideUI={setHideUI}/> : <Navigate to="/welcome" replace />} /> */}
      {/* <Route path="/welcome" element={<WelcomePage setUserLang={setUserLang} />} /> */}

      <Route path="/charts" element={<DataViewer />} />
      <Route path="/news" element={<NewsList news={newsData}/>} />
      <Route path="/quotes" element={<div>Quotes Page</div>} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  )
}

export default AppRoutes;