import React, { useEffect } from "react";
import { Newspaper, ArrowLeft } from "lucide-react";
import { useNews } from "../../hooks/useRealtimeTable/useNews";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./NewsList.css";

const NewsList: React.FC = () => {
  const { t } = useTranslation();
  const { isApproved } = useUser();
  const { data: news, loading, error } = useNews({ enabled: isApproved });
  const navigate = useNavigate();

  if (loading) return <div className="news-container"><p>Loading news...</p></div>;
  if (error) return <div className="news-container"><p style={{ color: "red" }}>Error: {error}</p></div>;

  return (
    <div className="page-container">
      <header className="unified-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Newspaper size={20} /> {t('news')}
        </h2>
      </header>

      <div className="page-content">
        {!isApproved ? (
          <div className="access-restricted-container glass-card">
            <p className="restricted-msg">{t('accessRestricted') || "Access Restricted"}</p>
            <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
          </div>
        ) : news.length === 0 ? (
          <p>No news available yet</p>
        ) : (
          <div className="news-list" style={{ display: 'flex', flexDirection: 'column' }}>
            {news.map((n) => (
              <div key={n.id} className="glass-card-item">
                <div className="card-title">{n.title}</div>
                <div className="card-text">{n.summary}</div>
                <div className="card-footer">{n.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsList;