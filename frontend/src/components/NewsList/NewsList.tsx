import React, { useEffect } from "react";
import { useNews } from "../../hooks/useRealtimeTable/useNews";
import "./NewsList.css";

const NewsList: React.FC = () => {
  const { data: news, loading, error } = useNews();

  // Логи для дебага
  useEffect(() => {
    console.log("💬 NEWS DATA:", news);
    console.log("💬 LOADING:", loading);
    console.log("💬 ERROR:", error);
  }, [news, loading, error]);

  if (loading) return <div className="news-container"><p>Loading news...</p></div>;
  
  if (error) return <div className="news-container"><p style={{ color: "red" }}>Error: {error}</p></div>;

  return (
    <div className="news-container">
      <h2>💬 News</h2>
      
      {news.length === 0 ? (
        <p>No news available yet</p>
      ) : (
        <ul className="news-list">
          {news.map((n) => (
            <li key={n.id} className="news-item">
              <p className="news-text">"{n.title}"</p>
              <p className="news-author">— {n.summary}</p>
              <p className="news-time">— {n.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NewsList;