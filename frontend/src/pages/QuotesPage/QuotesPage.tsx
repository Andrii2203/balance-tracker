import React, { useEffect } from "react";
import { MessageSquareQuote, ArrowLeft } from "lucide-react";
import { useQuotesQuery } from "../../hooks/queries/useQuotesQuery";
import { readCachedRecord } from "../../services/db";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./QuotesPage.css";

const QuotesPage: React.FC = () => {
  const { t } = useTranslation();
  const { isApproved } = useUser();
  const { data: quotes, isLoading } = useQuotesQuery({ enabled: isApproved });
  const [cachedQuotes, setCachedQuotes] = React.useState<any[] | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const load = async () => {
      try {
        const rec = await readCachedRecord('quotes');
        if (rec && rec.value) setCachedQuotes(rec.value);
      } catch (err) {
        try { (await import('../../utils/logger')).logger.warn('Failed to read cached quotes', err); } catch (_) { console.warn('Failed to read cached quotes', err); }
      }
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <header className="unified-header">
        <h2 className="page-title">
          <MessageSquareQuote size={20} /> {t('quotes')}
        </h2>
      </header>

      <div className="page-content">
        {(!navigator.onLine && cachedQuotes && cachedQuotes.length > 0) ? (
          <div className="quotes-list">
            {cachedQuotes.map((quote: any) => (
              <div key={quote.id} className="glass-card-item">
                <p className="card-text quote-text">"{quote.text}"</p>
                <div className="card-footer">— {quote.author}</div>
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
        ) : !quotes || quotes.length === 0 ? (
          <p>No quotes available yet</p>
        ) : (
          <div className="quotes-list">
            {quotes.map((quote) => (
              <div key={quote.id} className="glass-card-item">
                <p className="card-text quote-text">"{quote.text}"</p>
                <div className="card-footer">
                  — {quote.author}
                  {quote.created_at && (
                    <span className="quote-meta">({new Date(quote.created_at).toLocaleDateString('uk-UA')})</span>
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