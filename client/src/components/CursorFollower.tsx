import { useCursor } from "@/hooks/useCursor";
import { useEffect, useState } from "react";

export default function CursorFollower() {
  const { x, y } = useCursor();

  const [dots, setDots] = useState(
    Array.from({ length: 6 }, () => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    const speed = 0.15;

    const follow = () => {
      setDots(prev => {
        const newDots = [...prev];
        newDots[0] = {
          x: prev[0].x + (x - prev[0].x) * speed,
          y: prev[0].y + (y - prev[0].y) * speed,
        };

        for (let i = 1; i < newDots.length; i++) {
          newDots[i] = {
            x: prev[i].x + (newDots[i - 1].x - prev[i].x) * speed,
            y: prev[i].y + (newDots[i - 1].y - prev[i].y) * speed,
          };
        }

        return newDots;
      });

      requestAnimationFrame(follow);
    };

    follow();
  }, [x, y]);

  return (
    <>
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: dot.x,
            top: dot.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            fontSize: `${20 - i * 2}px`,
            opacity: 1 - i * 0.15,
            zIndex: 9999,
          }}
        >
          ✨
        </div>
      ))}
    </>
  );
}
