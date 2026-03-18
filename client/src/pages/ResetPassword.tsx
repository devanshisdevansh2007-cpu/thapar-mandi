import { useState } from "react";
import { useParams } from "wouter";

export default function ResetPassword() {
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const res = await fetch(`/auth/reset-password/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newPassword: password }),
    });

    const data = await res.json();
    setMessage("Password updated successfully");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-xl font-semibold">Reset Password</h1>

      <input
        type="password"
        placeholder="New password"
        className="border p-2 rounded w-64"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleReset}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Reset Password
      </button>

      {message && <p className="text-green-500">{message}</p>}
    </div>
  );
}
