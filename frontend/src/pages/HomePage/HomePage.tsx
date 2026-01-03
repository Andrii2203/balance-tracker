import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNews } from "../../hooks/useRealtimeTable/useNews";
import { useQuotes } from "../../hooks/useRealtimeTable/useQuotes";
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
import { motion, AnimatePresence } from 'framer-motion';
import LoginPanel from "../../components/LoginPanel/LoginPanel";
import "./HomePage.css";

interface Profile {
  id: string;
  email: string;
  is_approved: boolean;
}

const NewsSection: React.FC<{ isApproved: boolean }> = ({ isApproved }) => {
  const { t } = useTranslation();
  const { data: news } = useNews({ enabled: isApproved });

  if (!isApproved) {
    return (
      <div className="access-restricted-container glass-card" style={{ marginBottom: '20px' }}>
        <p className="restricted-msg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <Newspaper size={20} /> {t('news')}
        </p>
        <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
      </div>
    );
  }

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
  const { data: quotes } = useQuotes({ enabled: isApproved });

  if (!isApproved) {
    return (
      <div className="access-restricted-container glass-card">
        <p className="restricted-msg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <MessageSquareQuote size={20} /> {t('quotes')}
        </p>
        <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) return null;
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="glass-card-item quote-card">
      <div className="quote-content">
        <p className="card-text" style={{ fontStyle: 'italic', fontSize: '1rem' }}>"{randomQuote.text}"</p>
        <div className="card-footer">— {randomQuote.author}</div>
      </div>
    </div>
  );
};

const ChartsSection: React.FC<{ isApproved: boolean }> = ({ isApproved }) => {
  const { t } = useTranslation();

  if (isApproved) return null;

  return (
    <div className="access-restricted-container glass-card" style={{ marginBottom: '20px' }}>
      <p className="restricted-msg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
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

  // Realtime profiles for Admin to approve
  const { data: profiles, update: updateProfile, loading: profilesLoading } = useRealtimeTable<Profile>(isAdmin ? "profiles" : "", { enabled: isAdmin });
  const unapprovedUsers = profiles.filter(p => !p.is_approved && p.id !== user?.id);

  React.useEffect(() => {
    if (isAdmin) {
      // General count logging for admin is fine, but avoid logging full objects if possible
      console.log("👑 ADMIN_DASHBOARD:", {
        profilesCount: profiles.length,
        unapprovedCount: unapprovedUsers.length,
      });
    }
  }, [profiles.length, unapprovedUsers.length, isAdmin]);

  const handleApprove = async (id: string) => {
    console.log("⚡ Approving user:", id);
    await updateProfile(id as any, { is_approved: true } as any);
  };

  return (
    <div className="page-container home-container">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginPanel showLanguageSwitcher={showLanguageSwitcher} />
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="home-wrapper"
          >
            {/* Header Row */}
            <header className="unified-header">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ fontSize: '1.2rem', fontWeight: 600 }}
              >
                {t('hello', { name: localStorage.getItem('user_name') || user.user_metadata?.full_name || user.email?.split('@')[0] || "User" })}
              </motion.h1>

              <div className="nav-actions" style={{ position: 'absolute', right: '15px' }}>
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

            {/* Scrollable Content */}
            <div className="page-content home-content">
              <ChartsSection isApproved={isApproved} />
              <NewsSection isApproved={isApproved} />
              <QuoteSection isApproved={isApproved} />
            </div>

            <AnimatePresence>
              {showApprovalModal && (
                <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
                  <motion.div
                    className="approval-modal glass-card"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
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
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;