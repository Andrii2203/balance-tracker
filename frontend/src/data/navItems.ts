import { Home, BarChart3, Newspaper, MessageCircle, MessageSquare } from 'lucide-react';
import { NavItem } from "../components/BottomNav/BottomNav";

export const navItems: NavItem[] = [
    { label: "Home", icon: Home, to: "/" },
    { label: "Charts", icon: BarChart3, to: "/charts" },
    { label: "News", icon: Newspaper, to: "/news" },
    { label: "Quotes", icon: MessageCircle, to: "/quotes" },
    { label: "Chat", icon: MessageSquare, to: "/chat" },
];