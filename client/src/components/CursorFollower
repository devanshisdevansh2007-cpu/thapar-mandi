import { useCursor } from "@/hooks/useCursor";
import { useEffect, useState } from "react";

export default function CursorFollower() {
  const { x, y } = useCursor();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const speed = 0.1;

    const follow = () => {
      setPos(prev => ({
        x: prev.x + (x - prev.x) * speed,
        y: prev.y + (y - prev.y) * speed,
      }));
      requestAnimationFrame(follow);
    };

    follow();
  }, [x, y]);

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        fontSize: "24px",
        zIndex: 9999,
      }}
    >
      🐥
    </div>
  );
}
