import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [text, setText] = useState("");
const { user } = useAuth();
  const fetchMessages = async () => {
    const res = await fetch(`/api/chat/${chatId}`);
    const data = await res.json();

// handle both cases (safe)
setMessages(data.messages || data);
setProduct(data.product || null);
  };

  const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
  const formatDateLabel = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
};
  const sendMessage = async () => {
    if (!text.trim()) return;

    await fetch("/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        message: text,
      }),
    });

    setText("");
    fetchMessages();
  };

  useEffect(() => {
  fetchMessages();

  // mark messages as read
  fetch(`/api/chat/${chatId}/read`, {
    method: "POST",
  });

  const interval = setInterval(fetchMessages, 2000);

  return () => clearInterval(interval);
}, [chatId]);
useEffect(() => {
  const el = document.getElementById("chat-container");
  if (el) el.scrollTop = el.scrollHeight;
}, [messages]);
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Chat</h2>
     {product && (
  <div className="flex items-center gap-3 border rounded-lg p-3 mb-3 bg-white dark:bg-gray-800 shadow-sm">
    
    {/* Image */}
    <img
      src={product.image}
      alt="product"
      className="w-12 h-12 object-cover rounded"
    />

    {/* Info */}
    <div className="flex-1">
      <p className="text-sm font-semibold">{product.title}</p>
      <p className="text-xs text-gray-500">₹{product.price}</p>
    </div>

    {/* View Button */}
    <Link href={`/item/${product.id}`}>
      <span className="text-xs text-blue-500 cursor-pointer hover:underline">
        View
      </span>
    </Link>

  </div>
)}
   <div
  id="chat-container"
  className="border rounded-lg p-4 h-[400px] overflow-y-auto mb-4 flex flex-col gap-2"
>
  {messages.map((msg, index) => {
  const isMine = msg.sender_id === user?.id;

  const currentDate = formatDateLabel(msg.created_at);
  const prevDate =
    index > 0 ? formatDateLabel(messages[index - 1].created_at) : null;

  const showDate = currentDate !== prevDate;

  return (
    <div key={msg.id + "-wrapper"}>
      {/* Date Separator */}
      {showDate && (
        <div className="text-center text-xs text-gray-500 my-2">
          ─── {currentDate} ───
        </div>
      )}

      {/* Message */}
      <div
       
        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`
            max-w-[70%] px-4 py-2 pb-5 rounded-2xl text-sm relative
            ${isMine
              ? "bg-primary text-primary-foreground"
              : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"}
            shadow
          `}
        >
          <p>{msg.message}</p>

          <span className="text-[10px] opacity-70 absolute bottom-1 right-2">
            {formatTime(msg.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
})}
</div>

      <div className="flex gap-2">
        <input
  value={text}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") sendMessage();
  }}
  className="flex-1 border rounded px-3 py-2"
  placeholder="Type a message..."
/>

        <button
          onClick={sendMessage}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
