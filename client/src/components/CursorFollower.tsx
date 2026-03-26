import { useCursor } from "@/hooks/useCursor";
import { useEffect, useRef, useState } from "react";


export default function CursorFollower() {
  const [isHovering, setIsHovering] = useState(false);
  const [ripples, setRipples] = useState<
  { x: number; y: number; id: number }[]
>([]);
  const { x, y } = useCursor();

  const posRef = useRef({ x: 0, y: 0 });
  const [dots, setDots] = useState(
    Array.from({ length: 6 }, () => ({ x: 0, y: 0 }))
  );

  // 🔥 update ref (no re-render)
  useEffect(() => {
    posRef.current = { x, y };
  }, [x, y]);

  useEffect(() => {
    const speed = 0.12;
    let animationFrame: number;

    const follow = () => {
      setDots(prev => {
        const newDots = [...prev];
        const { x, y } = posRef.current;

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

      animationFrame = requestAnimationFrame(follow);
    };

    animationFrame = requestAnimationFrame(follow);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

useEffect(() => {
  const handleEnter = () => setIsHovering(true);
  const handleLeave = () => setIsHovering(false);

  const elements = document.querySelectorAll("button, a");

  const handlers: any[] = [];

  elements.forEach(el => {
    const element = el as HTMLElement;

    element.style.transition = "transform 0.2s ease";

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();

      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      element.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px)`;
    };

    const handleLeaveMagnetic = () => {
      element.style.transform = `translate(0px, 0px)`;
    };

    element.addEventListener("mouseenter", handleEnter);
    element.addEventListener("mouseleave", handleLeave);

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleLeaveMagnetic);

    handlers.push({
      element,
      handleMouseMove,
      handleLeaveMagnetic,
    });
  });

  return () => {
    handlers.forEach(({ element, handleMouseMove, handleLeaveMagnetic }) => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleLeaveMagnetic);
      
    element.style.transform = "translate(0px, 0px)"; // ✅ reset
    });

    elements.forEach(el => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    });
  };
}, []);

  useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    const newRipple = {
      x: e.clientX,
      y: e.clientY,
      id: Date.now(),
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  window.addEventListener("click", handleClick);

  return () => window.removeEventListener("click", handleClick);
}, []);

  return (
    <>
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: dot.x,
            top: dot.y,
          transform: `translate(-50%, -50%) 
  scale(${isHovering && i === 0 ? 2.2 : 1}) 
  scaleX(${isHovering && i === 0 ? 1.3 : 1}) 
  scaleY(${isHovering && i === 0 ? 0.8 : 1})`,
            pointerEvents: "none",
            zIndex: 9999,
            opacity: 1 - i * 0.15,
            boxShadow: isHovering && i === 0
  ? "0 0 80px rgba(255, 200, 100, 0.9)"
  : "0 0 20px rgba(255, 120, 220, 0.2)",
          }}
        >
          <div
            style={{
              width: `${20 - i * 2}px`,
              height: `${20 - i * 2}px`,
              borderRadius: "50%",
              background: isHovering
  ? "linear-gradient(135deg, #ffd166, #ff70a6)"
  : "linear-gradient(135deg, #ff70a6, #c77dff)",
      
              filter: "blur(16px)",
              mixBlendMode: "screen",
            }}
          />
        </div>
      ))}

      {ripples.map(r => (
  <div
    key={r.id}
    style={{
      position: "fixed",
      left: r.x,
      top: r.y,
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "rgba(255, 200, 100, 0.8)",
        animation: "ripple 0.6s ease-out",
      }}
    />
  </div>
))}
    </>
  );
}
