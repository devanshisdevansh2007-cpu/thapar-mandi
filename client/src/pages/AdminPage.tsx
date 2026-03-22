import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // 🔥 FETCH DATA (SAFE)
  useEffect(() => {
    fetch("/api/items", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data);
        else setItems([]);
      });

    fetch("/api/admin/users", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setUsers([]);
      });
  }, []);

  if (user?.role !== "admin") {
    return <div className="p-6 text-red-500">Not allowed</div>;
  }

  // 🗑 DELETE ITEM
  const deleteItem = async (id: number) => {
    if (!confirm("Delete this item?")) return;

    await fetch(`/api/admin/item/${id}`, {
      method: "DELETE",
    });

    setItems(items.filter(i => i.id !== id));
  };

  // 🚫 BLOCK USER
  const blockUser = async (id: number) => {
    await fetch(`/api/admin/block-user/${id}`, {
      method: "POST",
    });

    setUsers(users.map(u =>
      u.id === id ? { ...u, blocked: true } : u
    ));
  };

  // ✅ UNBLOCK USER (🔥 NEW)
  const unblockUser = async (id: number) => {
    await fetch(`/api/admin/unblock-user/${id}`, {
      method: "POST",
    });

    setUsers(users.map(u =>
      u.id === id ? { ...u, blocked: false } : u
    ));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* ================= ITEMS ================= */}
      <h2 className="text-xl font-bold mb-2">Items</h2>

      {items.map(item => (
        <div key={item.id} className="border p-3 mb-2 rounded">
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm text-gray-500">
            Seller: {item.seller?.name || "Unknown"}
          </p>

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => deleteItem(item.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              🗑 Delete
            </button>

            <button
              onClick={() => blockUser(item.sellerId)}
              className="bg-orange-500 text-white px-3 py-1 rounded"
            >
              🚫 Block Seller
            </button>
          </div>
        </div>
      ))}

      {/* ================= USERS ================= */}
      <h2 className="text-xl font-bold mt-6 mb-2">Users</h2>

      {users.map(u => (
        <div key={u.id} className="border p-3 mb-2 rounded">
          <p className="font-semibold">{u.name}</p>
          <p className="text-sm text-gray-500">{u.email}</p>

          <div className="mt-2">
            {u.blocked ? (
              <button
                onClick={() => unblockUser(u.id)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                ✅ Unblock
              </button>
            ) : (
              <button
                onClick={() => blockUser(u.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                🚫 Block
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
