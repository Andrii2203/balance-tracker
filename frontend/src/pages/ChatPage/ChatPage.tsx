import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChatLogic } from "./useChatLogic";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from 'react-router-dom';
import { useNews } from "../../hooks/useRealtimeTable/useNews";
import { useQuotes } from "../../hooks/useRealtimeTable/useQuotes";
import { AdminConfig, AdminTabType, useAdminPanel } from "../../hooks/useAdminPanel/useAdminPanel";
import TabSwiperPopup from "../../components/TabSwiper/TabSwiper";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Newspaper,
  MessageSquareQuote,
  Pencil,
  Trash2,
  Circle,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { toast, Toaster } from "sonner";
import "./ChatPage.css";
import "./ChatPage.admin.css";

const ADMIN_CONFIG: Record<"news" | "quotes", AdminConfig> = {
  news: {
    fields: [
      { name: "title", type: "text", placeholder: "Title" },
      { name: "summary", type: "text", placeholder: "Summary" },
      { name: "date", type: "date", placeholder: "" },
    ],
    render: (item) => (
      <>
        <div className="news-title">{item.title}</div>
        <div className="news-summary">{item.summary}</div>
        <div className="message-time">{item.date}</div>
      </>
    ),
  },
  quotes: {
    fields: [
      { name: "author", type: "text", placeholder: "Author" },
      { name: "text", type: "text", placeholder: "Quote" },
    ],
    render: (item) => (
      <>
        <div className="quote-text">"{item.text}"</div>
        <div className="quote-author">— {item.author}</div>
        <div className="message-time">{new Date(item.created_at).toLocaleDateString('uk-UA')}</div>
      </>
    ),
  },
};

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { messages, newMessage, setNewMessage, sendMessage, resendMessage, online } = useChatLogic();
  const { user, role, isApproved } = useUser();
  const isAdmin = role === "admin";
  const navigate = useNavigate();

  const news = useNews();
  const quotes = useQuotes();

  useEffect(() => {
    if (news.error) toast.error(`News Error: ${news.error}`);
  }, [news.error]);

  useEffect(() => {
    if (quotes.error) toast.error(`Quotes Error: ${quotes.error}`);
  }, [quotes.error]);

  const [{ adminTab, form, editingId }, { setAdminTab, setForm, handleSubmit, handleEdit, handleDelete, resetForm }] =
    useAdminPanel(
      ADMIN_CONFIG,
      (tab) => tab === "news" ? news : tab === "quotes" ? quotes : null
    );

  const handleBack = () => navigate(-1);

  useEffect(() => {
    const div = document.getElementById("chat-container");
    if (div) div.scrollTop = div.scrollHeight;
  }, [messages, adminTab, news.data, quotes.data]);

  const renderAdminForm = () => {
    if (!adminTab) return null;
    const config = ADMIN_CONFIG[adminTab];

    return (
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-container">
          {config.fields.map((field) => (
            <input
              key={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={form[field.name] || ""}
              onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
              className="form-input"
            />
          ))}
          <div className="form-button-group">
            <button type="submit" className="button-submit">
              {editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="button-cancel">
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
    );
  };

  const renderAdminContent = () => {
    if (!adminTab) return null;
    const ds = adminTab === "news" ? news : adminTab === "quotes" ? quotes : null;
    if (!ds) return null;

    const config = ADMIN_CONFIG[adminTab];

    return (
      <div className="admin-content-wrapper">
        {ds.data.map((item: any) => (
          <div key={item.id} className="message-item-wrapper">
            <div className="message message-sent">{config.render(item)}</div>
            <div className="message-action-buttons">
              <button onClick={() => handleEdit(item)} className="button-edit">
                <Pencil size={14} style={{ marginRight: 4 }} /> Edit
              </button>
              <button onClick={() => handleDelete(item.id)} className="button-delete">
                <Trash2 size={14} style={{ marginRight: 4 }} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <Toaster position="top-center" />
      {isAdmin && <TabSwiperPopup activeTab={adminTab} onTabChange={setAdminTab} isAdmin={isAdmin} />}

      <div className="unified-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            {adminTab === "news" ? <Newspaper size={20} /> : adminTab === "quotes" ? <MessageSquareQuote size={20} /> : <MessageCircle size={20} />}
            {adminTab === "news" ? t('news') : adminTab === "quotes" ? t('quotes') : t('chat')}
            {!adminTab && (
              <Circle size={10} fill={online ? "#4CAF50" : "#F44336"} color={online ? "#4CAF50" : "#F44336"} />
            )}
          </div>
        </h2>
      </div>



      <div id="chat-container" className={`${adminTab ? "chat-container-admin" : ""}`}>
        {!isApproved && !adminTab ? (
          <div className="chat-blocked-message">
            <p>{t('chatRestricted') || 'Chat is available after administrator approval.'}</p>
          </div>
        ) : adminTab ? (
          renderAdminContent()
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.user_id === user?.id;
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const isSameAsPrev = prevMsg?.user_id === msg.user_id;

            return (
              <div
                key={i}
                className={`message-wrapper ${isOwn ? 'own' : 'other'} ${isSameAsPrev ? 'same-sender' : 'different-sender'}`}
              >
                {!isOwn && !isSameAsPrev && (
                  <div className="sender-name">
                    {msg.profiles?.email?.split('@')[0] || 'Unknown'}
                  </div>
                )}
                <div className={`message ${msg.pending ? "message-pending" : isOwn ? "message-sent" : "message-received"}`}>
                  <div className="message-content">
                    {msg.message}
                    {msg.pending && (
                      <button
                        className="resend-btn"
                        title="Resend"
                        onClick={() => resendMessage(i)}
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                  </div>
                  <div className="message-time">
                    {new Date(msg.created_at || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {adminTab && renderAdminForm()}
      {!adminTab && (
        <div className="chat-input-wrapper">
          <div className="message-input-container">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('writeMessage')}
              className="message-input"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} className="send-button">
              <Send size={24} />
            </button>
          </div>
        </div>
      )}


      {adminTab && (
        <button
          onClick={() => {
            setAdminTab(null);
            resetForm();
          }}
          className="back-to-chat-button"
        >
          <ArrowLeft size={20} />
        </button>
      )}
    </div>
  );
};

export default ChatPage;

















