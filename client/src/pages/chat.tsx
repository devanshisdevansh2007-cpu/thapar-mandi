import { useEffect, useState } from "react";
import { useParams } from "wouter";

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const fetchMessages = async () => {
    const res = await fetch(`/api/chat/${chatId}`);
    const data = await res.json();
    setMessages(data);
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

    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Chat</h2>

      <div className="border rounded-lg p-4 h-[400px] overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            {msg.message}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
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
