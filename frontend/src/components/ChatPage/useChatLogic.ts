import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";


interface Message {
  id?: number;
  message: string;
  created_at?: string;
  pending?: boolean;
}

export const useChatLogic = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [scrollY, setScrollY] = useState(0);

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
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    resendMessage,
    online,
    scrollY,
  };
};
