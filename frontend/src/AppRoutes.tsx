import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from "./components/HomePage/HomePage";
import DataViewer from "./components/DataViewer/DataViewer";
import NewsList from "./components/NewsList/NewsList";
import { newsData } from "./data/newsData";

const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/charts" element={<DataViewer sheetName="Arkusz1" />} />
        <Route path="/news" element={<NewsList news={newsData}/>} />
        <Route path="/quotes" element={<div>Quotes Page</div>} />
        <Route path="/chat" element={<div>Chat Page</div>} />
    </Routes>
)

export default AppRoutes;