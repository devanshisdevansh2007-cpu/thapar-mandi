import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // 🔥 FETCH DATA
  useEffect(() => {
    fetch("/api/items", { credentials: "include" })
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []));

    fetch("/api/admin/users", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []));

    fetch("/api/reports", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        console.log("REPORTS:", data);
        setReports(Array.isArray(data) ? data : []);
      });
  }, []);

  if (user?.role !== "admin") {
    return <div className="p-6 text-red-500">Not allowed</div>;
  }

  // 🗑 DELETE ITEM
  const deleteItem = async (id: number) => {
    if (!confirm("Delete this item?")) return;

    const res = await fetch(`/api/admin/item/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    setItems(items.filter(i => i.id !== id));
  };

  // 🚫 BLOCK USER
  const blockUser = async (id: number) => {
    const res = await fetch(`/api/admin/block-user/${id}`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Block failed");
      return;
    }

    setUsers(users.map(u =>
      u.id === id ? { ...u, blocked: true } : u
    ));
  };

  // ✅ UNBLOCK USER
  const unblockUser = async (id: number) => {
    const res = await fetch(`/api/admin/unblock-user/${id}`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Unblock failed");
      return;
    }

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

      {/* ================= REPORTS ================= */}

<h2 className="text-2xl font-bold mt-8 mb-4">🚨 Reports</h2>

{reports.length === 0 && (
  <p className="text-gray-500">No reports yet</p>
)}

<div className="grid gap-4">
  {reports.map((r) => (
    <div
      key={r.id}
      className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
    >
      {/* Top row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-red-500 font-semibold">
          Report #{r.id}
        </span>
        <span className="text-xs text-gray-400">
          Item ID: {r.reported_item_id}
        </span>
      </div>

      {/* Reason */}
      <p className="text-gray-800 mb-3">
        <span className="font-semibold">Reason:</span> {r.reason}
      </p>

      {/* Meta info */}
      <div className="text-xs text-gray-500 mb-3">
        <p>👤 Reporter: {r.reporter_id}</p>
        <p>⚠️ Reported User: {r.reported_user_id}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
          🗑 Delete Item
        </button>

        <button className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600">
          🚫 Ban User
        </button>

        <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
          ✅ Resolve
        </button>
      </div>
    </div>
  ))}
</div>
      <h2 className="text-xl font-bold mt-6 mb-2">🚨 Reports</h2>

      {reports.length === 0 && <p>No reports yet</p>}

      {reports.map(r => (
        <div key={r.id} className="border p-3 mb-2 rounded">
          <p><b>Reason:</b> {r.reason}</p>
          <p><b>Item ID:</b> {r.reported_item_id}</p>
          <p><b>Reported User:</b> {r.reported_user_id}</p>
          <p><b>Reporter:</b> {r.reporter_id}</p>
        </div>
      ))}
    </div>
  );
}
