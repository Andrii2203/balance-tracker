import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChatLogic } from "./useChatLogic";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from 'react-router-dom';
import { useNewsQuery } from "../../hooks/queries/useNewsQuery";
import { useQuotesQuery } from "../../hooks/queries/useQuotesQuery";
import { useNewsMutation } from "../../hooks/queries/useNewsMutation";
import { useQuotesMutation } from "../../hooks/queries/useQuotesMutation";
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
  Wifi,
  WifiOff,
  MessageCircle,
  ArrowRight,
  SendHorizontal
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

  const news = useNewsQuery({ enabled: true });
  const quotes = useQuotesQuery({ enabled: true });
  const newsMutation = useNewsMutation();
  const quotesMutation = useQuotesMutation();

  useEffect(() => {
    if (news.isError) toast.error(`News Error: ${news.error}`);
  }, [news.isError, news.error]);

  useEffect(() => {
    if (quotes.isError) toast.error(`Quotes Error: ${quotes.error}`);
  }, [quotes.isError, quotes.error]);

  const [{ adminTab, form, editingId }, { setAdminTab, setForm, handleSubmit, handleEdit, handleDelete, resetForm }] =
    useAdminPanel(
      ADMIN_CONFIG,
      (tab) => tab === "news" ? newsMutation : tab === "quotes" ? quotesMutation : null
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
        {ds.isLoading ? (
          <p>{t('loading')}...</p>
        ) : (ds.data || []).map((item: any) => (
          <div key={item.id} className="message-item-wrapper">
            <div className="message message-sent">{config.render(item)}</div>
            <div className="message-action-buttons">
              <button onClick={() => handleEdit(item)} className="button-edit">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => handleDelete(item.id)} className="button-delete">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chat-page-root">
      <Toaster position="top-center" />
      {isAdmin && <TabSwiperPopup activeTab={adminTab} onTabChange={setAdminTab} isAdmin={isAdmin} />}

      <div className="unified-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="page-title">
          <div className="title-row">
            {adminTab === "news" ? <Newspaper size={20} /> : adminTab === "quotes" ? <MessageSquareQuote size={20} /> : <MessageCircle size={20} />}
            {adminTab === "news" ? t('news') : adminTab === "quotes" ? t('quotes') : t('chat')}
            {!adminTab && (
              <span className={`status-indicator ${online ? 'online' : 'offline'}`}>
                {online ? <Wifi size={16} /> : <WifiOff size={16} />}
              </span>
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
                className={`message-wrapper ${isOwn ? 'own' : 'other'} ${isSameAsPrev ? 'same-sender' : 'different-sender'} ${isOwn && msg.pending ? 'pending-shift' : ''}`}
              >
                {!isOwn && !isSameAsPrev && (
                  <div className="sender-name">
                    {msg.profiles?.email?.split('@')[0] || 'Unknown'}
                  </div>
                )}
                <div className={`message-row ${isOwn ? 'own' : 'other'} ${msg.pending ? 'pending-shift' : ''}`}>
                  <div className={`message ${isOwn ? "message-sent" : "message-received"} ${msg.pending ? 'message-pending' : ''}`}>
                    <div className="message-content">{msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.created_at || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {msg.pending && (
                    <button
                      className="resend-outside-btn"
                      title={t('resend') || 'Resend'}
                      onClick={() => resendMessage(i)}
                    >
                      <RefreshCw size={18} />
                    </button>
                  )}
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
              <SendHorizontal size={24} />
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

















