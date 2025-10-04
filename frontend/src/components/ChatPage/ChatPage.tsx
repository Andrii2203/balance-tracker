import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

interface Message {
  id?: number;
  message: string;
  created_at?: string;
  pending?: boolean; // позначка для локальних повідомлень
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  // 🔄 Завантаження історії
  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (!navigator.onLine) {
          console.warn("⚠️ Offline mode: loading local messages");
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
          localStorage.setItem("chat_messages", JSON.stringify(data)); // кешуємо
        }
      } catch (e) {
        console.error("Error loading messages:", e);
      }
    };

    loadMessages();

    // 🟢 Realtime підписка
    const channel = supabase
      .channel("chat-messages-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => {
            const updated = [...prev, payload.new as Message];
            localStorage.setItem("chat_messages", JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    // 💡 Відстеження online/offline
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

  // 📨 Відправка повідомлення
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const messageObj: Message = {
      message: newMessage,
      created_at: new Date().toISOString(),
      pending: !online,
    };

    // setMessages((prev) => [...prev, messageObj]);
    setNewMessage("");

    if (online) {
      const { error } = await supabase.from("chat_messages").insert([
        { message: messageObj.message },
      ]);
      if (error) console.error(error);
    } else {
      console.warn("💾 Saved offline message");
      const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
      pending.push(messageObj);
      localStorage.setItem("pending_msgs", JSON.stringify(pending));
    }

    localStorage.setItem("chat_messages", JSON.stringify([...messages, messageObj]));
  };

  // 🔁 Автоматична синхронізація після відновлення інтернету
  useEffect(() => {
    if (!online) return;
    const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
    if (pending.length > 0) {
      console.log("📤 Sending pending messages...");
      pending.forEach(async (msg: Message) => {
        await supabase.from("chat_messages").insert([{ message: msg.message }]);
      });
      localStorage.removeItem("pending_msgs");
    }
  }, [online]);

  // 📜 Автоскрол вниз
  useEffect(() => {
    const div = document.getElementById("chat-container");
    if (div) div.scrollTop = div.scrollHeight;
  }, [messages]);

  return (
    <div>
      <h2>
        Chat {online ? "🟢" : "🔴 (Offline mode)"}
      </h2>

      <div
        id="chat-container"
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{new Date(msg.created_at || "").toLocaleTimeString()}:</b>{" "}
            {msg.message}{" "}
            {msg.pending && <span style={{ color: "orange" }}>⏳</span>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "8px" }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Напиши повідомлення..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatPage;

















// import React, { useEffect, useState } from "react";
// import { supabase } from "../../supabaseClient";

// interface Message {
//   id?: number;
//   message: string;
//   created_at?: string;
//   pending?: boolean; // позначка для локальних повідомлень
// }

// const ChatPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [online, setOnline] = useState<boolean>(navigator.onLine);

//   // 🔄 Завантаження історії
//   useEffect(() => {
//     const loadMessages = async () => {
//       try {
//         console.log("🔄 Завантаження повідомлень...");

//         if (!navigator.onLine) {
//           console.warn("⚠️ Offline mode: loading local messages");
//           const cached = localStorage.getItem("chat_messages");
//           const localMessages = cached ? JSON.parse(cached) : [];
//           console.log("🌐 Завантажено локальні повідомлення:", localMessages);
//           setMessages(localMessages);
//           return;
//         }

//         const { data, error } = await supabase
//           .from("chat_messages")
//           .select("*")
//           .order("created_at", { ascending: true });

//         if (error) {
//           console.error("❌ Помилка при завантаженні повідомлень:", error);
//         } else {
//           console.log("📥 Завантажено нові повідомлення з бази даних:", data);
//           // Перевіряємо на дублювання перед оновленням стану
//           setMessages((prevMessages) => {
//             const newMessages = data?.filter(
//               (newMessage: Message) =>
//                 !prevMessages.some((msg) => msg.id === newMessage.id)
//             ) || [];
//             console.log("📤 Нові повідомлення без дублювань:", newMessages);
//             const updatedMessages = [...prevMessages, ...newMessages];
//             localStorage.setItem("chat_messages", JSON.stringify(updatedMessages)); // Оновлюємо кеш
//             return updatedMessages;
//           });
//         }
//       } catch (e) {
//         console.error("❌ Помилка при завантаженні повідомлень:", e);
//       }
//     };

//     loadMessages();

//     // 🟢 Realtime підписка
//     const channel = supabase
//       .channel("chat-messages-channel")
//       .on(
//         "postgres_changes",
//         { event: "INSERT", schema: "public", table: "chat_messages" },
//         (payload) => {
//           console.log("🔔 Реальний час: отримано нове повідомлення через підписку", payload);
//           setMessages((prev) => {
//             const isDuplicate = prev.some((msg) => msg.id === payload.new.id);
//             if (isDuplicate) {
//               console.log("🔴 Дублікати не додаються, це повідомлення вже є:", payload.new);
//               return prev; // Якщо є дублікати, не додаємо
//             }
//             const updated = [...prev, payload.new as Message];
//             console.log("📤 Оновлені повідомлення після додавання нового:", updated);
//             localStorage.setItem("chat_messages", JSON.stringify(updated));
//             return updated;
//           });
//         }
//       )
//       .subscribe();

//     // 💡 Відстеження online/offline
//     const handleOnline = () => {
//       console.log("🌐 Інтернет знову доступний");
//       setOnline(true);
//     };
//     const handleOffline = () => {
//       console.log("❌ Інтернет відсутній");
//       setOnline(false);
//     };
//     window.addEventListener("online", handleOnline);
//     window.addEventListener("offline", handleOffline);

//     return () => {
//       channel.unsubscribe();
//       window.removeEventListener("online", handleOnline);
//       window.removeEventListener("offline", handleOffline);
//     };
//   }, []);

//   // 📨 Відправка повідомлення
//   const sendMessage = async () => {
//     console.log("💬 Відправка повідомлення:", newMessage);
//     if (!newMessage.trim()) return;

//     const messageObj: Message = {
//       message: newMessage,
//       created_at: new Date().toISOString(),
//       pending: !online,
//     };
//     if (messages.some((msg) => msg.message === messageObj.message && msg.created_at === messageObj.created_at)) {
//       console.warn("Це повідомлення вже є в чаті.");
//       return;
//     }

//     // Перевіряємо чи таке повідомлення вже є в чаті
//     // setMessages((prev) => {
//     //   const isDuplicate = prev.some(
//     //     (msg) => msg.message === messageObj.message && msg.created_at === messageObj.created_at
//     //   );
//     //   if (isDuplicate) {
//     //     console.warn("⚠️ Це повідомлення вже є в чаті.");
//     //     return prev;
//     //   }

//     //   console.log("📤 Додаємо нове повідомлення до чату:", messageObj);
//     //   const updatedMessages = [...prev, messageObj];
//     //   localStorage.setItem("chat_messages", JSON.stringify(updatedMessages));
//     //   return updatedMessages;
//     // });

//     setNewMessage("");

//     if (online) {
//       console.log("📤 Відправляємо повідомлення в базу даних...");
//       const { error } = await supabase.from("chat_messages").insert([
//         { message: messageObj.message },
//       ]);
//       if (error) console.error("❌ Помилка при відправці в базу даних:", error);
//       else console.log("✅ Повідомлення успішно відправлено в базу даних!");
//     } else {
//       console.warn("💾 Saved offline message");
//       const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
//       pending.push(messageObj);
//       localStorage.setItem("pending_msgs", JSON.stringify(pending));
//       console.log("📥 Повідомлення збережене офлайн:", messageObj);
//     }
//   };

//   // 🔁 Автоматична синхронізація після відновлення інтернету
//   useEffect(() => {
//     if (!online) return;

//     console.log("🌐 Інтернет знову доступний. Синхронізація офлайн повідомлень...");
//     const pending = JSON.parse(localStorage.getItem("pending_msgs") || "[]");
//     if (pending.length > 0) {
//       console.log("📤 Відправка офлайн повідомлень:", pending);
//       pending.forEach(async (msg: Message) => {
//         const { data, error } = await supabase
//           .from("chat_messages")
//           .select("id")
//           .eq("message", msg.message)
//           .eq("created_at", msg.created_at);

//         if (!data || data.length === 0) {
//           console.log("📤 Повідомлення не знайдено в базі, відправляємо...");
//           await supabase.from("chat_messages").insert([{ message: msg.message }]);
//         } else {
//           console.log("📩 Повідомлення вже є в базі даних, пропускаємо...");
//         }
//       });

//       // Видаляємо тільки ті повідомлення, які були успішно синхронізовані
//       localStorage.removeItem("pending_msgs");
//       console.log("✅ Офлайн повідомлення синхронізовано, локальні повідомлення видалені.");
//     }
//   }, [online]);

//   // 📜 Автоскрол вниз
//   useEffect(() => {
//     const div = document.getElementById("chat-container");
//     if (div) {
//       div.scrollTop = div.scrollHeight;
//       console.log("📜 Автоскрол до кінця чату");
//     }
//   }, [messages]);

//   return (
//     <div>
//       <h2>
//         Chat {online ? "🟢" : "🔴 (Offline mode)"}
//       </h2>

//       <div
//         id="chat-container"
//         style={{
//           border: "1px solid #ccc",
//           height: "300px",
//           overflowY: "auto",
//           padding: "8px",
//         }}
//       >
//         {messages.map((msg, i) => (
//           <div key={i}>
//             <b>{new Date(msg.created_at || "").toLocaleTimeString()}:</b>{" "}
//             {msg.message}{" "}
//             {msg.pending && <span style={{ color: "orange" }}>⏳</span>}
//           </div>
//         ))}
//       </div>

//       <div style={{ marginTop: "8px" }}>
//         <input
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           placeholder="Напиши повідомлення..."
//         />
//         <button onClick={sendMessage}>Send</button>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;




































// import React, { useEffect, useState } from "react";
// import { supabase } from "../../supabaseClient";

// interface Message {
//   id: number;
//   message: string;
//   created_at: string;
// }

// const ChatPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState("");

//   useEffect(() => {
//     const loadMessages = async () => {
//       const { data, error } = await supabase
//         .from("chat_messages")
//         .select("*")
//         .order("created_at", { ascending: true });
//       if (error) console.error(error);
//       else setMessages(data || []);
//     };
//     loadMessages();

//     // Підписка на нові повідомлення
//     const channel = supabase
//       .channel("chat-messages-channel")
//       .on(
//         "postgres_changes",
//         { event: "INSERT", schema: "public", table: "chat_messages" },
//         (payload) => {
//           console.log("new message received:", payload.new);
//           setMessages((prev) => [...prev, payload.new as Message]);
//         }
//       )
//       .subscribe();

//       channel.on("system", { event: "*" }, (status) => {
//         console.log("Channel status:", status);
//       });

//     return () => {
//       channel.unsubscribe();
//     };
//   }, []);

//   useEffect(() => {
//   const div = document.getElementById("chat-container");
//   if(div) div.scrollTop = div.scrollHeight;
//   }, [messages]);

//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;
//     const { error } = await supabase.from("chat_messages").insert([
//       {
//         message: newMessage,
//       },
//     ]);
//     if (error) console.error(error);
//     setNewMessage("");
//   };

//   return (
//     <div>
//       <h2>Chat</h2>
//       <div
//         id="chat-container"
//         style={{
//           border: "1px solid #ccc",
//           height: "300px",
//           overflowY: "auto",
//           padding: "8px",
//         }}
//       >
//         {messages.map((msg) => (
//           <div key={msg.id}>
//             <b>{new Date(msg.created_at).toLocaleTimeString()}:</b>{" "}
//             {msg.message}
//           </div>
//         ))}
//       </div>
//       <div style={{ marginTop: "8px" }}>
//         <input
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           placeholder="Напиши повідомлення..."
//         />
//         <button onClick={sendMessage}>Send</button>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;
