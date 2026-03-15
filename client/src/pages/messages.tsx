import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type Chat = {
  id: number;
  item_id: number;
  buyer_id: number;
  seller_id: number;
};

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chat/user/me");
      if (!res.ok) return;

      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  if (loading) return <p className="p-4">Loading chats...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Messages</h2>

      {chats.length === 0 && (
        <p className="text-muted-foreground text-center">
          No conversations yet
        </p>
      )}

      {chats.map((chat) => (
        <div
          key={chat.id}
          className="border rounded-lg p-4 mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          onClick={() => navigate(`/messages/${chat.id}`)}
        >
          <div className="font-semibold">Chat #{chat.id}</div>
          <div className="text-sm text-muted-foreground">
            Click to open conversation
          </div>
        </div>
      ))}
    </div>
  );
}
