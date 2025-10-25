import React, { useEffect } from "react";
import { useChatLogic } from "./useChatLogic";
import { useNavigate } from 'react-router-dom';
import { useNews } from "../../hooks/useRealtimeTable/useNews";
import { useQuotes } from "../../hooks/useRealtimeTable/useQuotes";
import { AdminConfig, AdminTabType, useAdminPanel } from "../../hooks/useAdminPanel/useAdminPanel";
import TabSwiperPopup from "../TabSwiper/TabSwiper";
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
  const { messages, newMessage, setNewMessage, sendMessage, resendMessage, online } = useChatLogic();
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("role") === "admin";

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
                ✏ Edit
              </button>
              <button onClick={() => handleDelete(item.id)} className="button-delete">
                🗑 Delete
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

      <div className="chat-header">
        <button className="back-btn" onClick={handleBack}>
          ➤
        </button>
        <h2 className="chat-header-h2">
          {adminTab === "news" ? "📰 News" : adminTab === "quotes" ? "💬 Quotes" : "Chat"}{" "}
          {!adminTab && (online ? "🟢" : "🔴")}
        </h2>
        <div className="glassContainer">
          <svg style={{ display: "none" }}>
            <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.00001 0.02" numOctaves="2" seed="40" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="0.2" result="blur" />
              <feDisplacementMap in="SourceGraphic" in2="blur" scale="50" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
        </div>
      </div>

      

      <div id="chat-container" className={adminTab ? "chat-container-admin" : ""}>
        {adminTab ? (
          renderAdminContent()
        ) : (
          messages.map((msg, i) => (
            <div key={i}>
              <div className={`message ${msg.pending ? "message-pending" : "message-sent"}`}>
                <div className="message-content">
                  {msg.message}
                  {msg.pending && (
                    <button
                      className="resend-btn"
                      title="Повторно надіслати"
                      onClick={() => resendMessage(i)}
                    >
                      ↻
                    </button>
                  )}
                </div>
                <div className="message-time">
                  {new Date(msg.created_at || "").toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {adminTab && renderAdminForm()}
      {!adminTab && (
        <>
          <div className="message-input-container">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напиши повідомлення..."
              className="message-input"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} className="send-button">
              ➤
            </button>
          </div>
          <div className="glassContainerInput">
            <svg style={{ display: "none" }}>
              <filter id="container-glass-input" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="2" seed="92" result="noise" />
                <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
                <feDisplacementMap in="SourceGraphic" in2="blur" scale="99" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </svg>
          </div>
        </>
      )}


      {adminTab && (
        <button
          onClick={() => {
            setAdminTab(null);
            resetForm();
          }}
          className="back-to-chat-button"
        >
          ➤
        </button>
      )}
    </div>
  );
};

export default ChatPage;


















// import React, { useEffect } from "react";
// import { useChatLogic } from "./useChatLogic";
// import { useNavigate } from 'react-router-dom';
// import "./ChatPage.css";
// // import { AdminPanel } from "../AdminPanel/AdminPanel";

// const ChatPage: React.FC = () => {
//   const {
//     messages,
//     newMessage,
//     setNewMessage,
//     sendMessage,
//     resendMessage,
//     online,
//   } = useChatLogic();

//   const navigate = useNavigate();
//   const handleBack = () => { navigate(-1) }

//   // 📜 Автопрокрутка вниз
//   useEffect(() => {
//     const div = document.getElementById("chat-container");
//     if (div) div.scrollTop = div.scrollHeight;
//   }, [messages]);

//   return (
//     <div>
//       <div className="chat-header">
//         <button className="back-btn" onClick={handleBack}>
//           ➤
//         </button>
//         <h2 className="chat-header-h2">Chat {online ? "🟢" : "🔴 (Offline mode)"}</h2>
//         {/* <div className="glassContainer">
//           <svg style={{ display: 'none' }}>
//             <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
//               <feTurbulence type="fractalNoise" baseFrequency="0.00001 0.02" numOctaves="2" seed="40" result="noise" />
//               <feGaussianBlur in="noise" stdDeviation="0.2" result="blur" />
//               <feDisplacementMap in="SourceGraphic" in2="blur" scale="50" xChannelSelector="R" yChannelSelector="G" />
//             </filter>
//           </svg>
//         </div> */}
//       </div>

//       <div id="chat-container">
//         {messages.map((msg, i) => (
//           <div key={i}>
//             <div
//               className={`message ${
//                 msg.pending ? "message-pending" : "message-sent"
//               }`}
//             >
//               <div className="message-content">
//                 {msg.message}
//                 {msg.pending && (
//                   <button
//                     className="resend-btn"
//                     title="Повторно надіслати"
//                     onClick={() => resendMessage(i)}
//                   >
//                     ↻
//                   </button>
//                 )}
//               </div>
//               <div className="message-time">
//                 {new Date(msg.created_at || "").toLocaleTimeString()}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//     <div className="message-input-container">
//       <input
//         value={newMessage}
//         onChange={(e) => setNewMessage(e.target.value)}
//         placeholder="Напиши повідомлення..."
//         className="message-input"
//         onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//       />
//       <button onClick={sendMessage} className="send-button">
//         ➤
//       </button>
//     </div>
//     {/* <div className="glassContainerInput">
//       <svg style={{ display: 'none' }}>
//         <filter id="container-glass-input" x="0%" y="0%" width="100%" height="100%">
//           <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="2" seed="92" result="noise" />
//           <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
//           <feDisplacementMap in="SourceGraphic" in2="blur" scale="99" xChannelSelector="R" yChannelSelector="G" />
//         </filter>
//       </svg>
//     </div> */}
//     {/* {localStorage.getItem("role") === "admin" && <AdminPanel />} */}
//   </div>
//   );
// };

// export default ChatPage;