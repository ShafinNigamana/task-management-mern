import { useEffect, useRef } from 'react';

export default function SpotlightCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let rafId;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isMoving = false;

    // Linear interpolation easing for a liquid mouse follow effect
    const updatePosition = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      cursor.style.transform = `translate3d(${currentX - 400}px, ${currentY - 400}px, 0)`;

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        rafId = requestAnimationFrame(updatePosition);
      } else {
        isMoving = false;
      }
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (cursor.style.opacity !== '1') {
        cursor.style.opacity = '1';
      }

      if (!isMoving) {
        isMoving = true;
        rafId = requestAnimationFrame(updatePosition);
      }
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="spotlight-cursor-glow"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '800px',
        height: '800px',
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.032) 0%, transparent 80%)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        willChange: 'transform',
      }}
    />
  );
}
