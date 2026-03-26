import { useEffect, useState } from "react";

export function useCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const moveTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({ x: touch.clientX, y: touch.clientY });
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", moveTouch);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", moveTouch);
    };
  }, []);

  return position;
}
