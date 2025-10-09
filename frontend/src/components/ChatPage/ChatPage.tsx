import React from "react";
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
    scrollY,
  } = useChatLogic();

  const navigate = useNavigate();
  const handleBack = () => { navigate(-1) }
  
  const magnifierHeight = 60;
  const contentTopOffset = 0;

  let opacity = 0;
  let transform = `translateY(${contentTopOffset}px) scale(2)`;

  if (scrollY >= contentTopOffset) {
    const visibleY = scrollY - contentTopOffset;
    opacity = 1;
    transform = `translateY(${-visibleY}px) scale(1)`;
  }

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
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
              <feDisplacementMap in="SourceGraphic" in2="blur" scale="77" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="btn-glass" primitiveUnits="objectBoundingBox">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur"></feGaussianBlur>
              <feDisplacementMap id="disp" in="blur" in2="map" scale="1" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
        </div>

        {/* <div
          className="magnified-content"
          id="magnified"
          style={{
            position: 'relative',
            marginTop: '70px',
            transformOrigin: 'top left',
            transform,
            width: '100%',
            opacity,
            fontSize: '1rem',
            lineHeight: '1',
            textAlign: 'center',
          }}
        >
          {messages.map((msg, i) => (
            <div key={i} className="message-magnified-content">
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
          ))}
        </div> */}
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
      <div className="glassContainerInput">
        <svg style={{ display: 'none' }}>
          <filter id="container-glass-input" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
            <feDisplacementMap in="SourceGraphic" in2="blur" scale="77" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* <filter id="btn-glass" primitiveUnits="objectBoundingBox">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur"></feGaussianBlur>
            <feDisplacementMap id="disp" in="blur" in2="map" scale="1" xChannelSelector="R" yChannelSelector="G" />
          </filter> */}
        </svg>
      </div>
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
    </div>
  );
};

export default ChatPage;










// import React, { useEffect, useRef, useState } from "react";
// import { supabase } from "../../supabaseClient";
// import { useNavigate } from 'react-router-dom';
// import "./ChatPage.css";

// interface Message {
//   id?: number;
//   message: string;
//   created_at?: string;
//   pending?: boolean;
// }

// const ChatPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [online, setOnline] = useState<boolean>(navigator.onLine);
//   const [scrollY, setScrollY] = useState(0);
//   const navigate = useNavigate();

//   // 🟢 Завантаження повідомлень (із кешу або Supabase)
//   useEffect(() => {
//     const loadMessages = async () => {
//       if (!navigator.onLine) {
//         console.warn("⚠️ Offline mode: loading from cache");
//         const cached = localStorage.getItem("chat_messages");
//         setMessages(cached ? JSON.parse(cached) : []);
//         return;
//       }

//       const { data, error } = await supabase
//         .from("chat_messages")
//         .select("*")
//         .order("created_at", { ascending: true });

//       if (error) console.error(error);
//       else {
//         setMessages(data || []);
//         localStorage.setItem("chat_messages", JSON.stringify(data));
//       }
//     };

//     loadMessages();

//     // 🟠 Підписка на Realtime події
//     const channel = supabase
//       .channel("chat-messages-channel")
//       .on(
//         "postgres_changes",
//         { event: "INSERT", schema: "public", table: "chat_messages" },
//         (payload) => {
//           const newMsg = payload.new as Message;
//           setMessages((prev) => {
//             const alreadyExists = prev.some(
//               (m) =>
//                 m.id === newMsg.id ||
//                 (m.message === newMsg.message &&
//                   Math.abs(
//                     new Date(m.created_at || "").getTime() -
//                       new Date(newMsg.created_at || "").getTime()
//                   ) < 1500)
//             );
//             if (alreadyExists) return prev;

//             const updated = [...prev, newMsg];
//             localStorage.setItem("chat_messages", JSON.stringify(updated));
//             return updated;
//           });
//         }
//       )
//       .subscribe();

//     // 🧠 Слухаємо зміну статусу мережі
//     const handleOnline = () => setOnline(true);
//     const handleOffline = () => setOnline(false);
//     window.addEventListener("online", handleOnline);
//     window.addEventListener("offline", handleOffline);

//     return () => {
//       channel.unsubscribe();
//       window.removeEventListener("online", handleOnline);
//       window.removeEventListener("offline", handleOffline);
//     };
//   }, []);

//   // ✉️ Надсилання нового повідомлення
//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     const messageObj: Message = {
//       message: newMessage,
//       created_at: new Date().toISOString(),
//       pending: !online,
//     };

//     setMessages((prev) => {
//       const updated = [...prev, messageObj];
//       localStorage.setItem("chat_messages", JSON.stringify(updated));
//       return updated;
//     });
//     setNewMessage("");

//     if (online) {
//       const { error } = await supabase
//         .from("chat_messages")
//         .insert([{ message: messageObj.message }]);
//       if (error) console.error(error);
//     } else {
//       const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
//       pending.push(messageObj);
//       localStorage.setItem("pending_msgs", JSON.stringify(pending));
//     }
//   };

//   // 🧭 Повторне надсилання офлайн-повідомлення вручну
//   const resendMessage = async (index: number) => {
//     const msg = messages[index];
//     if (!msg) return;

//     if (!online) {
//       alert("Немає підключення до інтернету 😞");
//       return;
//     }

//     const { error } = await supabase
//       .from("chat_messages")
//       .insert([{ message: msg.message }]);

//     if (error) {
//       console.error("Помилка при повторному надсиланні:", error);
//       alert("Не вдалося надіслати 😞");
//       return;
//     }

//     // оновлюємо статус
//     const updated = [...messages];
//     updated[index].pending = false;
//     setMessages(updated);
//     localStorage.setItem("chat_messages", JSON.stringify(updated));

//     // видаляємо з pending_msgs
//     const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
//     const filtered = pending.filter((p: Message) => p.message !== msg.message);
//     localStorage.setItem("pending_msgs", JSON.stringify(filtered));
//   };

//   // 📜 Автопрокрутка вниз
//   useEffect(() => {
//     const div = document.getElementById("chat-container");
//     if (div) div.scrollTop = div.scrollHeight;
//   }, [messages]);

//   useEffect(() => {
//     const handleScroll = () => {
//       setScrollY(window.scrollY);
//     };
//     window.addEventListener('scroll', handleScroll);

//     // Cleanup
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   const magnifierHeight = 60;
//   const contentTopOffset = 0;

//   let opacity = 0;
//   let transform = `translateY(${contentTopOffset}px) scale(2)`;

//   if (scrollY >= contentTopOffset) {
//     const visibleY = scrollY - contentTopOffset;
//     opacity = 1;
//     transform = `translateY(${-visibleY}px) scale(1)`;
//   }


//   const handleBack = () => {
//     navigate(-1);
//   }



//   return (
//     <div>
//       <div className="chat-header">
//         <button className="back-btn" onClick={handleBack}>
//           ➤
//         </button>
//         <h2 className="chat-header-h2">Chat {online ? "🟢" : "🔴 (Offline mode)"}</h2>
//         <div
//           className="magnified-content"
//           id="magnified"
//           style={{
//             position: 'relative',
//             marginTop: '70px',
//             transformOrigin: 'top left',
//             transform,
//             width: '100%',
//             opacity,
//             fontSize: '1rem',
//             lineHeight: '1',
//             textAlign: 'center',
//           }}
//         >
//           {messages.map((msg, i) => (
//             <div key={i} className="message-magnified-content">
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
//           ))}
//         </div>
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

//       <div className="message-input-container">
//         <input
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           placeholder="Напиши повідомлення..."
//           className="message-input"
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//         />
//         <button onClick={sendMessage} className="send-button">
//           ➤
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;
