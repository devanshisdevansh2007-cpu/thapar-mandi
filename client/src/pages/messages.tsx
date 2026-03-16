import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type Chat = {
  id: number;
  item_title: string;
  other_user: string;
  last_message: string;
  unread_count: number;
};
export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const fetchChats = async () => {
  try {
    const res = await fetch("/api/chat/user/me");

    if (!res.ok) {
      setLoading(false);
      return;
    }

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

  const interval = setInterval(fetchChats, 5000); // refresh every 5s
  return () => clearInterval(interval);
    
}, []);

  if (loading) {
  return (
   <div className="max-w-2xl mx-auto p-4 space-y-4">

      {[1,2,3,4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card/40"
        >

          {/* avatar skeleton */}
          <div className="w-12 h-12 rounded-full shimmer"></div>

          {/* text skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded shimmer"></div>
            <div className="h-3 w-1/2 rounded shimmer"></div>
          </div>

        </div>
      ))}

    </div>
  );
}

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
    className="border border-border rounded-xl p-4 mb-3 cursor-pointer hover:bg-card/40 transition"
    onClick={() => navigate(`/messages/${chat.id}`)}
  >
    <div className="flex items-center justify-between">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-semibold text-primary">
          {chat.other_user
            ? chat.other_user.split(" ").map(n => n[0]).join("").slice(0,2)
            : "U"}
        </div>

        {/* Chat Info */}
        <div>
          <p className="font-medium">{chat.other_user}</p>

          <p className="text-sm text-gray-500 truncate">
            {chat.last_message || "Start conversation"}
          </p>

          <p className="text-xs text-muted-foreground">
            Regarding: {chat.item_title}
          </p>
        </div>

      </div>

      {/* RIGHT SIDE → Notification Dot */}
      {chat.unread_count > 0 && (
        <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
      )}

    </div>
  </div>
))}
    </div>
  );
}
