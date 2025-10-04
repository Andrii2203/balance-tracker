import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from 'react-router-dom';
import "./ChatPage.css";

interface Message {
  id?: number;
  message: string;
  created_at?: string;
  pending?: boolean;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const navigate = useNavigate();

  // 🟢 Завантаження повідомлень (із кешу або Supabase)
  useEffect(() => {
    const loadMessages = async () => {
      if (!navigator.onLine) {
        console.warn("⚠️ Offline mode: loading from cache");
        const cached = localStorage.getItem("chat_messages");
        setMessages(cached ? JSON.parse(cached) : []);
        return;
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      else {
        setMessages(data || []);
        localStorage.setItem("chat_messages", JSON.stringify(data));
      }
    };

    loadMessages();

    // 🟠 Підписка на Realtime події
    const channel = supabase
      .channel("chat-messages-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            const alreadyExists = prev.some(
              (m) =>
                m.id === newMsg.id ||
                (m.message === newMsg.message &&
                  Math.abs(
                    new Date(m.created_at || "").getTime() -
                      new Date(newMsg.created_at || "").getTime()
                  ) < 1500)
            );
            if (alreadyExists) return prev;

            const updated = [...prev, newMsg];
            localStorage.setItem("chat_messages", JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    // 🧠 Слухаємо зміну статусу мережі
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      channel.unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ✉️ Надсилання нового повідомлення
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageObj: Message = {
      message: newMessage,
      created_at: new Date().toISOString(),
      pending: !online,
    };

    setMessages((prev) => {
      const updated = [...prev, messageObj];
      localStorage.setItem("chat_messages", JSON.stringify(updated));
      return updated;
    });
    setNewMessage("");

    if (online) {
      const { error } = await supabase
        .from("chat_messages")
        .insert([{ message: messageObj.message }]);
      if (error) console.error(error);
    } else {
      const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
      pending.push(messageObj);
      localStorage.setItem("pending_msgs", JSON.stringify(pending));
    }
  };

  // 🧭 Повторне надсилання офлайн-повідомлення вручну
  const resendMessage = async (index: number) => {
    const msg = messages[index];
    if (!msg) return;

    if (!online) {
      alert("Немає підключення до інтернету 😞");
      return;
    }

    const { error } = await supabase
      .from("chat_messages")
      .insert([{ message: msg.message }]);

    if (error) {
      console.error("Помилка при повторному надсиланні:", error);
      alert("Не вдалося надіслати 😞");
      return;
    }

    // оновлюємо статус
    const updated = [...messages];
    updated[index].pending = false;
    setMessages(updated);
    localStorage.setItem("chat_messages", JSON.stringify(updated));

    // видаляємо з pending_msgs
    const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
    const filtered = pending.filter((p: Message) => p.message !== msg.message);
    localStorage.setItem("pending_msgs", JSON.stringify(filtered));
  };

  // 📜 Автопрокрутка вниз
  useEffect(() => {
    const div = document.getElementById("chat-container");
    if (div) div.scrollTop = div.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const inputContainer = document.querySelector(".message-input-container") as HTMLElement;
    if(!inputContainer) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      inputContainer.style.bottom = `${window.innerHeight - viewportHeight}px`;
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const handleBack = () => {
    navigate(-1);
  }

  return (
    <div>
      <div className="chat-header">
        <button className="back-btn" onClick={handleBack}>
          &#8592;
        </button>
        <h2>Chat {online ? "🟢" : "🔴 (Offline mode)"}</h2>

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
    </div>
  );
};

export default ChatPage;













// import React, { useEffect, useState } from "react";
// import { supabase } from "../../supabaseClient";
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

//   // 🟢 Завантаження повідомлень + кеш
//   useEffect(() => {
//     const loadMessages = async () => {
//       try {
//         if (!navigator.onLine) {
//           console.warn("⚠️ Offline mode: loading local messages");
//           const cached = localStorage.getItem("chat_messages");
//           setMessages(cached ? JSON.parse(cached) : []);
//           return;
//         }

//         const { data, error } = await supabase
//           .from("chat_messages")
//           .select("*")
//           .order("created_at", { ascending: true });

//         if (error) console.error(error);
//         else {
//           setMessages(data || []);
//           localStorage.setItem("chat_messages", JSON.stringify(data));
//         }
//       } catch (e) {
//         console.error("Error loading messages:", e);
//       }
//     };

//     loadMessages();

//     // 🟠 Підписка на Realtime зміни
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

//       .subscribe((status) => console.log("Channel status:", status));

//     // 🧠 Слухаємо зміну мережевого статусу
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

//   // ✉️ Відправлення повідомлення
//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     const messageObj: Message = {
//       message: newMessage,
//       created_at: new Date().toISOString(),
//       pending: !online,
//     };

//     // додаємо одразу у список
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
//       console.warn("💾 Saved offline message");
//       const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
//       pending.push(messageObj);
//       localStorage.setItem("pending_msgs", JSON.stringify(pending));
//     }
//   };

//   // 🔁 Відправляємо pending повідомлення, коли знову онлайн
//   useEffect(() => {
//     if (!online) return;

//     const sendPending = async () => {
//       const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
//       if (pending.length === 0) return;

//       console.log("📤 Sending pending messages...");
//       for (const msg of pending) {
//         const { error } = await supabase
//           .from("chat_messages")
//           .insert([{ message: msg.message }]);
//         if (!error) console.log("✅ Sent pending:", msg.message);
//       }
//       localStorage.removeItem("pending_msgs");
//     };

//     sendPending();
//   }, [online]);

//   // 📜 Автопрокрутка вниз
//   useEffect(() => {
//     const div = document.getElementById("chat-container");
//     if (div) div.scrollTop = div.scrollHeight;
//   }, [messages]);

//   return (
//     <div>
//       <h2>
//         Chat {online ? "🟢" : "🔴 (Offline mode)"}
//       </h2>

//       <div id="chat-container">
//         {messages.map((msg, i) => (
//           <div key={i}>
//             <div className="message">
//               <b>{new Date(msg.created_at || "").toLocaleTimeString()}:</b>{" "}
//               {msg.message}{" "}
//               {msg.pending && <span className="status-pending">⏳</span>}
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
//         />
//         <button onClick={sendMessage} className="send-button">
//           ➤
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;
