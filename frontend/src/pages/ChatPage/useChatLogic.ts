import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../contexts/UserContext";


export interface Message {
  id?: number;
  message: string;
  user_id?: string;
  profiles?: {
    email: string;
  };
  created_at?: string;
  pending?: boolean;
}

export const useChatLogic = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [online, setOnline] = useState<boolean>(navigator.onLine);

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
        .select("*, profiles(email)")
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
                  m.user_id === newMsg.user_id &&
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
    if (!newMessage.trim() || !user) return;

    const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";

    const messageObj: Message = {
      message: newMessage,
      user_id: user.id,
      profiles: { email: user.email || "" },
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
        .insert([{
          message: messageObj.message,
          user_id: user.id
        }]);
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
    if (!msg || !user) return;

    if (!online) {
      alert("Немає підключення до інтернету 😞");
      return;
    }

    const { error } = await supabase
      .from("chat_messages")
      .insert([{
        message: msg.message,
        user_id: user.id
      }]);

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

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    resendMessage,
    online,
  };
};
