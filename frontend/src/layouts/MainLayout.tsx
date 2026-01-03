import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import BottomNav from '../components/BottomNav/BottomNav';
import { navItems } from '../data/navItems';
import './MainLayout.css';

const MainLayout: React.FC = () => {
    const { user } = useUser();
    const location = useLocation();

    // Hide BottomNav on settings page
    const shouldShowNav = user && location.pathname !== '/settings';

    return (
        <div className="main-layout">
            <main className="main-content">
                <Outlet />
            </main>
            {shouldShowNav && <BottomNav items={navItems} />}
        </div>
    );
};

export default MainLayout;
