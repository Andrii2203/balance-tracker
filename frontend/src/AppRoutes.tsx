import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import HomePage from "./pages/HomePage/HomePage";
import DataViewer from "./pages/DataViewer/DataViewer";
import NewsList from "./pages/NewsList/NewsList";
import WelcomePage from './pages/WelcomePage/WelcomePage';
import ChatPage from './pages/ChatPage/ChatPage';
import QuotesPage from './pages/QuotesPage/QuotesPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';

const AppRoutes: React.FC = () => {
  const [userLang, setUserLang] = useState<string | null>(() => localStorage.getItem('userLang'));

  return (
    <Routes>
      {/* Auth Routes (No Navigation) */}
      <Route element={<AuthLayout />}>
        <Route path="/welcome" element={<WelcomePage setUserLang={setUserLang} />} />
      </Route>

      {/* Main Routes (With Navigation) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={userLang ? <HomePage /> : <Navigate to="/welcome" replace />} />
        <Route path="/charts" element={<DataViewer />} />
        <Route path="/news" element={<NewsList />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Chat Route (No Navigation, handled internally) */}
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
};

export default AppRoutes;