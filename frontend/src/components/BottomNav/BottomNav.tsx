import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

export interface NavItem {
    label: string;
    icon: React.ReactNode;
    to: string;
}

interface BottomNavProps {
    items: NavItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
    return (
        <nav className="bottom-nav">
        {items.map((item, index) => (
            <NavLink
                key={index}
                to={item.to}
                className={({ isActive }) =>
                    isActive ? 'nav-item active' : 'nav-item'
                }
            >
                {item.icon}
                <span className="nav-label">{item.label}</span>
            </NavLink>
        ))}
        </nav>
    );
};

export default BottomNav;
