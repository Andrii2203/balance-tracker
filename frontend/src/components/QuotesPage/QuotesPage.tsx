import React, { useEffect } from "react";
import { useQuotes } from "../../hooks/useRealtimeTable/useQuotes";
import "./QuotesPage.css";

const QuotesPage: React.FC = () => {
  const { data: quotes, loading, error } = useQuotes();

  useEffect(() => {
    console.log("💬 QUOTES DATA:", quotes);
    console.log("💬 LOADING:", loading);
    console.log("💬 ERROR:", error);
  }, [quotes, loading, error]);

  if (loading) return <div className="quotes-container"><p>Loading quotes...</p></div>;
  
  if (error) return <div className="quotes-container"><p style={{ color: "red" }}>Error: {error}</p></div>;

  return (
    <div className="quotes-container">
      <h2>💬 Quotes</h2>
      
      {quotes.length === 0 ? (
        <p>No quotes available yet</p>
      ) : (
        <ul className="quotes-list">
          {quotes.map((quote) => (
            <li key={quote.id} className="quote-item">
              <p className="quote-text">"{quote.text}"</p>
              <p className="quote-author">— {quote.author}</p>
              {quote.created_at && (
                <p className="quote-date">
                  {new Date(quote.created_at).toLocaleDateString('uk-UA')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QuotesPage;