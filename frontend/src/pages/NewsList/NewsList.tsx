import React, { useEffect } from "react";
import { Newspaper, ArrowLeft } from "lucide-react";
import { useNewsQuery } from "../../hooks/queries/useNewsQuery";
import { readCachedRecord } from "../../services/db";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./NewsList.css";

const NewsList: React.FC = () => {
  const { t } = useTranslation();
  const { isApproved } = useUser();
  const { data: news, isLoading } = useNewsQuery({ enabled: isApproved });
  const [cachedNews, setCachedNews] = React.useState<any[] | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const load = async () => {
      try {
        const rec = await readCachedRecord('news');
        if (rec && rec.value) setCachedNews(rec.value);
      } catch (err) {
        // eslint-disable-next-line no-console
        // keep a console fallback but also persist to logger when available
        try { (await import('../../utils/logger')).logger.warn('Failed to read cached news', err); } catch (_) { console.warn('Failed to read cached news', err); }
      }
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <header className="unified-header">
        <h2 className="page-title"><Newspaper size={20} /> {t('news')}</h2>
      </header>

      <div className="page-content">
        {(!navigator.onLine && cachedNews && cachedNews.length > 0) ? (
          <div className="news-list">
            {cachedNews.map((n: any) => (
              <div key={n.id} className="glass-card-item">
                <div className="card-title">{n.title}</div>
                <div className="card-text">{n.summary}</div>
                <div className="card-footer">{n.date}</div>
              </div>
            ))}
          </div>
        ) : !isApproved ? (
          <div className="access-restricted-container glass-card">
            <p className="restricted-msg">{t('accessRestricted') || "Access Restricted"}</p>
            <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
          </div>
        ) : isLoading ? (
          <p>{t('loading')}...</p>
        ) : !news || news.length === 0 ? (
          <p>No news available yet</p>
        ) : (
          <div className="news-list">
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