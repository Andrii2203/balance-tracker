import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import './BottomNav.css';

export interface NavItem {
    label: string;
    icon: LucideIcon;
    to: string;
}

interface BottomNavProps {
    items: NavItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
    return (
        <nav className="bottom-nav">
            {items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                    <NavLink
                        key={index}
                        to={item.to}
                        className={({ isActive }) =>
                            isActive ? 'nav-item active' : 'nav-item'
                        }
                    >
                        <IconComponent size={24} strokeWidth={2} />
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default BottomNav;
