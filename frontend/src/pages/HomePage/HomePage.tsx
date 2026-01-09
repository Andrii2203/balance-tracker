
import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewsQuery } from "../../hooks/queries/useNewsQuery";
import { useQuotesQuery } from "../../hooks/queries/useQuotesQuery";
import { useRealtimeTable } from "../../hooks/useRealtimeTable/useRealtimeTable";
import {
  Settings,
  Newspaper,
  MessageSquareQuote,
  BarChart3,
  UserCheck,
  Check,
  X
} from 'lucide-react';
import { useUser } from "../../contexts/UserContext";
import LoginPanel from "../../components/LoginPanel/LoginPanel";
import "./HomePage.css";
// App version - update this when deploying new versions
export const APP_VERSION = '2.1.0';
export const APP_BUILD_DATE = new Date().toISOString().split('T')[0];

interface Profile {
  id: string;
  email: string;
  is_approved: boolean;
}

const NewsSection: React.FC<{ isApproved: boolean }> = ({ isApproved }) => {
  const { t } = useTranslation();
  const { data: news, isLoading } = useNewsQuery({ enabled: isApproved });
  const [cachedNews, setCachedNews] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const rec = await import('../../services/db').then(m => m.readCachedRecord('news'));
        if (rec && rec.value) setCachedNews(rec.value);
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  if (!navigator.onLine && cachedNews && cachedNews.length > 0) {
    const latest = [...cachedNews]
      .sort((a: any, b: any) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime())
      .slice(0, 3);

    return (
      <div className="news-grid">
        {latest.map((item: any) => (
          <div key={item.id} className="glass-card-item">
            <div className="card-title">{item.title}</div>
            <div className="card-text">{item.summary}</div>
            <div className="card-footer">{item.date}</div>
          </div>
        ))}
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="access-restricted-container glass-card mb-20">
        <p className="restricted-msg">
          <Newspaper size={20} /> {t('news')}
        </p>
        <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
      </div>
    );
  }

  if (isLoading) return <div className="card-text">{t('loading')}...</div>;
  if (!news || news.length === 0) return null;

  const latestNews = [...news]
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
    .slice(0, 3);

  return (
    <div className="news-grid">
      {latestNews.map((item: any) => (
        <div key={item.id} className="glass-card-item">
          <div className="card-title">{item.title}</div>
          <div className="card-text">{item.summary}</div>
          <div className="card-footer">{item.date}</div>
        </div>
      ))}
    </div>
  );
};

const QuoteSection: React.FC<{ isApproved: boolean }> = ({ isApproved }) => {
  const { t } = useTranslation();
  const { data: quotes, isLoading } = useQuotesQuery({ enabled: isApproved });
  const [cachedQuotes, setCachedQuotes] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const rec = await import('../../services/db').then(m => m.readCachedRecord('quotes'));
        if (rec && rec.value) setCachedQuotes(rec.value);
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  if (!navigator.onLine && cachedQuotes && cachedQuotes.length > 0) {
    const randomQuote = cachedQuotes[Math.floor(Math.random() * cachedQuotes.length)];
    return (
      <div className="glass-card-item quote-card">
        <div className="quote-content">
          <p className="card-text quote-text-small">"{randomQuote.text}"</p>
          <div className="card-footer">— {randomQuote.author}</div>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="access-restricted-container glass-card">
        <p className="restricted-msg">
          <MessageSquareQuote size={20} /> {t('quotes')}
        </p>
        <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
      </div>
    );
  }

  if (isLoading) return <div className="card-text">{t('loading')}...</div>;
  if (!quotes || quotes.length === 0) return null;
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="glass-card-item quote-card">
      <div className="quote-content">
        <p className="card-text quote-text-small">"{randomQuote.text}"</p>
        <div className="card-footer">— {randomQuote.author}</div>
      </div>
    </div>
  );
};

const ChartsSection: React.FC<{ isApproved: boolean }> = ({ isApproved }) => {
  const { t } = useTranslation();

  if (isApproved) return null;

  return (
    <div className="access-restricted-container glass-card mb-20">
      <p className="restricted-msg">
        <BarChart3 size={20} /> {t('charts')}
      </p>
      <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isApproved, role } = useUser();
  const location = useLocation();
  const showLanguageSwitcher = location.state?.showLanguageSwitcher || false;
  const isAdmin = role === 'admin';
  const navigate = useNavigate();

  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const { data: profiles, update: updateProfile } = useRealtimeTable<Profile>(isAdmin ? "profiles" : "", { enabled: isAdmin });
  const unapprovedUsers = profiles.filter(p => !p.is_approved && p.id !== user?.id);

  React.useEffect(() => {
    if (isAdmin) {
      logger.info("👑 ADMIN_DASHBOARD:", {
        profilesCount: profiles.length,
        unapprovedCount: unapprovedUsers.length,
      });
    }
  }, [profiles.length, unapprovedUsers.length, isAdmin]);

  const handleApprove = async (id: string) => {
    logger.info("⚡ Approving user:", id);
    await updateProfile(id as any, { is_approved: true } as any);
  };

  return (
    <div className="page-container home-container">
      {!user ? (
        <LoginPanel showLanguageSwitcher={showLanguageSwitcher} />
      ) : (
        <div className="home-wrapper">
          <header className="unified-header">
            <h1 className="greeting-title">
              {t('hello', { name: localStorage.getItem('user_name') || user.user_metadata?.full_name || user.email?.split('@')[0] || "User" })}
            </h1>

            <div className="nav-actions">
              <div className="app-version-badge" title={`Build: ${APP_BUILD_DATE}`}>
                v{APP_VERSION}
              </div>
              {isAdmin && (
                <button
                  className="nav-icon-btn approval-btn"
                  onClick={() => setShowApprovalModal(true)}
                >
                  <UserCheck size={24} />
                  {unapprovedUsers.length > 0 && (
                    <span className="notification-badge">{unapprovedUsers.length}</span>
                  )}
                </button>
              )}
              <button className="nav-icon-btn" onClick={() => navigate('/settings')}>
                <Settings size={24} />
              </button>
            </div>
          </header>

          <div className="page-content home-content">
            <ChartsSection isApproved={isApproved} />
            <NewsSection isApproved={isApproved} />
            <QuoteSection isApproved={isApproved} />
          </div>

          {showApprovalModal && (
            <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
              <div
                className="approval-modal glass-card"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Pending Approvals</h3>
                  <button className="close-btn" onClick={() => setShowApprovalModal(false)}><X size={20} /></button>
                </div>
                <div className="users-list">
                  {unapprovedUsers.length === 0 ? (
                    <p className="empty-msg">No pending requests</p>
                  ) : (
                    unapprovedUsers.map(u => (
                      <div key={u.id} className="user-item">
                        <div className="user-info">
                          <span className="user-email">{u.email}</span>
                        </div>
                        <button className="approve-action-btn" onClick={() => handleApprove(u.id)}>
                          <Check size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
