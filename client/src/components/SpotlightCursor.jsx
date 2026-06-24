import { useEffect, useRef } from 'react';

export default function SpotlightCursor() {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    // Disable on mobile/touch screens (coarse pointer devices)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    const container = containerRef.current;
    const cursor = cursorRef.current;
    if (!container || !cursor) return;

    const amount = 20;
    const sineDots = Math.floor(amount * 0.3);
    const width = 26;
    const idleTimeout = 150;

    let targetX = 0;
    let targetY = 0;
    let lastFrame = 0;
    let isMoving = false;
    let hasMoved = false;
    let idle = false;
    let timeoutID;
    let isHovering = false;

    // Build dots tracking data
    const dots = Array.from({ length: amount }, (_, i) => {
      const scale = 1 - 0.045 * i;
      return {
        index: i,
        scale,
        x: 0,
        y: 0,
        lockX: 0,
        lockY: 0,
        angleX: Math.PI * 2 * Math.random(),
        angleY: Math.PI * 2 * Math.random(),
        anglespeed: 0.05,
        range: width / 2 - (width / 2) * scale + 2,
        element: null
      };
    });

    // Dynamically insert spans
    dots.forEach((dot) => {
      const span = document.createElement('span');
      span.className = 'cursor-ball-span';
      cursor.appendChild(span);
      dot.element = span;
    });

    const startIdleTimer = () => {
      timeoutID = setTimeout(() => {
        idle = true;
        dots.forEach((dot) => {
          dot.lockX = dot.x;
          dot.lockY = dot.y;
        });
      }, idleTimeout);
      idle = false;
    };

    const resetIdleTimer = () => {
      clearTimeout(timeoutID);
      startIdleTimer();
    };

    let rafId;

    const updatePosition = (timestamp) => {
      if (!lastFrame) lastFrame = timestamp;
      const delta = timestamp - lastFrame;
      lastFrame = timestamp;

      let x = targetX;
      let y = targetY;

      dots.forEach((dot, index) => {
        let nextDot = dots[index + 1] || dots[0];
        
        if (!idle || index <= sineDots) {
          dot.x = x;
          dot.y = y;
          const dx = (nextDot.x - dot.x) * 0.35;
          const dy = (nextDot.y - dot.y) * 0.35;
          x += dx;
          y += dy;
        } else {
          dot.angleX += dot.anglespeed;
          dot.angleY += dot.anglespeed;
          dot.y = dot.lockY + Math.sin(dot.angleY) * dot.range;
          dot.x = dot.lockX + Math.sin(dot.angleX) * dot.range;
        }

        if (dot.element) {
          const hoverScale = isHovering ? 1.8 : 1.0;
          dot.element.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) scale(${dot.scale * hoverScale})`;
        }
      });

      rafId = requestAnimationFrame(updatePosition);
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasMoved) {
        hasMoved = true;
        // Hide the default browser cursor
        document.documentElement.classList.add('custom-cursor-active');
      }

      if (container.classList.contains('cursor-hidden')) {
        container.classList.remove('cursor-hidden');
      }

      resetIdleTimer();

      if (!isMoving) {
        isMoving = true;
        rafId = requestAnimationFrame(updatePosition);
      }
    };

    const handleMouseLeave = () => {
      if (container) container.classList.add('cursor-hidden');
    };

    const handleMouseEnter = () => {
      if (container) container.classList.remove('cursor-hidden');
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const hoverable = target.closest('a, button, [role="button"], .btn, .hoverable, input[type="submit"], input[type="button"], .public-header-logo-section');
      if (hoverable) {
        isHovering = true;
      } else {
        isHovering = false;
      }
    };

    const handleTouchStart = () => {
      if (container) container.classList.add('cursor-hidden');
      document.documentElement.classList.remove('custom-cursor-active');
      hasMoved = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    container.classList.add('cursor-hidden');
    startIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('touchstart', handleTouchStart);
      document.documentElement.classList.remove('custom-cursor-active');
      clearTimeout(timeoutID);
      if (rafId) cancelAnimationFrame(rafId);
      if (cursor) {
        cursor.innerHTML = '';
      }
    };
  }, []);

  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  if (isTouchDevice) return null;

  return (
    <>
      {/* SVG filter definition for gooey cellular effect */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'none' }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div ref={containerRef} className="custom-cursor-container cursor-hidden">
        <div ref={cursorRef} className="cursor-gooey-trail" />
      </div>
    </>
  );
}
