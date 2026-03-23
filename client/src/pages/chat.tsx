import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [text, setText] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [otherUser, setOtherUser] = useState("User");
  const { user } = useAuth();

  // 🔥 FETCH BLOCK STATUS (NEW)
  const checkBlocked = async (otherUserId: number) => {
    const res = await fetch(`/api/is-blocked/${otherUserId}`, {
      credentials: "include",
    });
    const data = await res.json();
    setIsBlocked(data.blocked);
  };

  const fetchMessages = async () => {
    const res = await fetch(`/api/chat/${chatId}/messages`, {
      credentials: "include",
    });

    if (res.status === 403) {
      setIsBlocked(true);
      return;
    }

    const data = await res.json();
  // 🔥 get other user name from chat list API
const chatRes = await fetch("/api/chat", {
  credentials: "include",
});
const chats = await chatRes.json();

const currentChat = chats.find((c: any) => String(c.id) === String(chatId));
if (currentChat) {
  setOtherUser(currentChat.other_user);
  setIsOnline(currentChat.is_online); // ✅ ADD THIS
}
    setMessages(data.messages || data);
    setProduct(data.product || null);

    // 🔥 IMPORTANT: once product loaded → check block
    if (data.product?.seller_id) {
      checkBlocked(data.product.seller_id);
    }
  };

  const formatTime = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateLabel = (date: any) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  };

  const sendMessage = async () => {
    if (!text.trim() || isBlocked) return;

    const res = await fetch("/api/message/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        text,
      }),
      credentials: "include",
    });

    if (res.status === 403) {
      setIsBlocked(true);
      return;
    }

    setText("");
    fetchMessages();
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    const el = document.getElementById("chat-container");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const [isOnline, setIsOnline] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-4">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold">
           {otherUser?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {otherUser}
            </span>

            <span className="text-xs text-gray-500">
  {isOnline ? "🟢 Online" : "⚫ Offline"}
</span>
          </div>
        </div>

        {/* 🔥 BLOCK BUTTON */}
        {isBlocked ? (
          <button
            onClick={async () => {
              await fetch(`/api/unblock/${product?.seller_id}`, {
                method: "DELETE",
                credentials: "include",
              });
              setIsBlocked(false);
              fetchMessages();
            }}
            className="text-xs bg-green-500 text-white px-3 py-1 rounded"
          >
            Unblock
          </button>
        ) : (
          <button
            onClick={async () => {
              await fetch(`/api/block/${product?.seller_id}`, {
                method: "POST",
                credentials: "include",
              });
              setIsBlocked(true);
            }}
            className="text-xs bg-red-500 text-white px-3 py-1 rounded"
          >
            Block
          </button>
        )}
      </div>

      {/* PRODUCT */}
      {product && (
        <div className="flex items-center gap-3 border rounded-lg p-3 mb-3 bg-white shadow-sm">
          <img
            src={product.image}
            alt="product"
            className="w-12 h-12 object-cover rounded"
          />

          <div className="flex-1">
            <p className="text-sm font-semibold">{product.title}</p>
            <p className="text-xs text-gray-500">₹{product.price}</p>
          </div>

          <Link href={`/item/${product.id}`}>
            <span className="text-xs text-blue-500 cursor-pointer hover:underline">
              View
            </span>
          </Link>
        </div>
      )}

      {/* MESSAGES */}
      <div
        id="chat-container"
        className="border rounded-lg p-4 h-[400px] overflow-y-auto mb-4 flex flex-col gap-2"
      >
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === user?.id;

          const currentDate = formatDateLabel(msg.created_at);
          const prevDate =
            index > 0
              ? formatDateLabel(messages[index - 1].created_at)
              : null;

          const showDate = currentDate !== prevDate;

          return (
            <div key={msg.id + "-wrapper"}>
              {showDate && (
                <div className="text-center text-xs text-gray-500 my-2">
                  ─── {currentDate} ───
                </div>
              )}

              <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative max-w-xs px-4 py-2 rounded-2xl text-sm shadow
                  ${
                    isMine
                      ? "bg-orange-500 text-white rounded-br-none"
                      : "bg-gray-200 text-black rounded-bl-none"
                  }`}
                >
                  {msg.message}

                  <div className="text-[10px] mt-1 text-right opacity-70">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      {isBlocked ? (
        <p className="text-center text-red-500">
          You blocked this user
        </p>
      ) : (
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
      )}
    </div>
  );
} 
