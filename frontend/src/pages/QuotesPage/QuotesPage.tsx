import React, { useEffect } from "react";
import { MessageSquareQuote, ArrowLeft } from "lucide-react";
import { useQuotes } from "../../hooks/useRealtimeTable/useQuotes";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./QuotesPage.css";

const QuotesPage: React.FC = () => {
  const { t } = useTranslation();
  const { isApproved } = useUser();
  const { data: quotes, loading, error } = useQuotes({ enabled: isApproved });
  const navigate = useNavigate();

  if (loading) return <div className="quotes-container"><p>Loading quotes...</p></div>;
  if (error) return <div className="quotes-container"><p style={{ color: "red" }}>Error: {error}</p></div>;

  return (
    <div className="page-container">
      <header className="unified-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <MessageSquareQuote size={20} /> {t('quotes')}
        </h2>
      </header>

      <div className="page-content">
        {!isApproved ? (
          <div className="access-restricted-container glass-card">
            <p className="restricted-msg">{t('accessRestricted') || "Access Restricted"}</p>
            <p className="restricted-sub">{t('waitApproval') || "Ask Admin for access."}</p>
          </div>
        ) : quotes.length === 0 ? (
          <p>No quotes available yet</p>
        ) : (
          <div className="quotes-list" style={{ display: 'flex', flexDirection: 'column' }}>
            {quotes.map((quote) => (
              <div key={quote.id} className="glass-card-item">
                <p className="card-text" style={{ fontStyle: 'italic', fontSize: '1.05rem' }}>"{quote.text}"</p>
                <div className="card-footer">
                  — {quote.author}
                  {quote.created_at && (
                    <span style={{ marginLeft: '10px', opacity: 0.7 }}>
                      ({new Date(quote.created_at).toLocaleDateString('uk-UA')})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotesPage;