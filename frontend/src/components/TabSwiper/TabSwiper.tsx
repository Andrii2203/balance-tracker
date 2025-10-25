import React from "react";
import { AdminTabType } from "../../hooks/useAdminPanel/useAdminPanel";
import "./TabSwiper.css";

interface TabSwiperPopupProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
  isAdmin: boolean;
}

const TabSwiperPopup: React.FC<TabSwiperPopupProps> = ({ activeTab, onTabChange, isAdmin }) => {
  const tabs: { id: AdminTabType; label: string }[] = [
    { id: null, label: "Chat" },
    ...(isAdmin
      ? [
          { id: "news" as AdminTabType, label: "News" },
          { id: "quotes" as AdminTabType, label: "Quotes" },
        ]
      : []),
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTab = e.target.value === "null" ? null : (e.target.value as AdminTabType);
    onTabChange(selectedTab);
  };

  return (
    <div className="tab-swiper-select-wrapper">
      <select
        className="tab-swiper-select"
        value={activeTab ?? "null"}
        onChange={handleChange}
      >
        {tabs.map((tab) => (
          <option key={tab.id ?? "chat"} value={tab.id ?? "null"} className="tab-swiper-option">
            {tab.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TabSwiperPopup;
