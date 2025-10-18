import React from "react";
import './NewsList.css';

interface NewsItem {
    id: number;
    date: Date;
    title: string;
    summary: string;
}

interface NewsListProps {
    news: NewsItem[];
}

const NewsList: React.FC<NewsListProps> = ({ news }) => {
    return (
        <div className="new-list-container">
            {news.length === 0 ? (
                <p>No news available</p>
            ) : (
                <ul>
                    {news.map(item => (
                        <li key={item.id}>
                            <h3>{item.title}</h3>
                            <span>{item.date.toLocaleDateString('uk-UA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                            <p>{item.summary}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default NewsList;