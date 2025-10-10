import React, { useEffect } from "react";
import { useChatLogic } from "./useChatLogic";
import { useNavigate } from 'react-router-dom';
import "./ChatPage.css";

const ChatPage: React.FC = () => {
  const {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    resendMessage,
    online,
  } = useChatLogic();

  const navigate = useNavigate();
  const handleBack = () => { navigate(-1) }

  // 📜 Автопрокрутка вниз
  useEffect(() => {
    const div = document.getElementById("chat-container");
    if (div) div.scrollTop = div.scrollHeight;
  }, [messages]);

  return (
    <div>
      <div className="chat-header">
        <button className="back-btn" onClick={handleBack}>
          ➤
        </button>
        <h2 className="chat-header-h2">Chat {online ? "🟢" : "🔴 (Offline mode)"}</h2>
        <div className="glassContainer">
          <svg style={{ display: 'none' }}>
            <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.00001 0.02" numOctaves="2" seed="40" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="0.2" result="blur" />
              <feDisplacementMap in="SourceGraphic" in2="blur" scale="50" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
        </div>
      </div>

      <div id="chat-container">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={`message ${
                msg.pending ? "message-pending" : "message-sent"
              }`}
            >
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
        ))}
      </div>

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
      <svg style={{ display: 'none' }}>
        <filter id="container-glass-input" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="2" seed="92" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
          <feDisplacementMap in="SourceGraphic" in2="blur" scale="99" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
    </div>
  );
};

export default ChatPage;