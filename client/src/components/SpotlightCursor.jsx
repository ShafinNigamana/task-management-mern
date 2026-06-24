import { useEffect, useRef } from 'react';

export default function SpotlightCursor() {
  const containerRef = useRef(null);
  const bigRingRef = useRef(null);
  const smallDotRef = useRef(null);

  useEffect(() => {
    // Disable custom cursor on mobile/touch screens (coarse pointer devices)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    const container = containerRef.current;
    const bigRing = bigRingRef.current;
    const smallDot = smallDotRef.current;
    if (!container || !bigRing || !smallDot) return;

    let rafId;
    let targetX = 0;
    let targetY = 0;
    
    // Easing variables for smooth trailing effect
    let bigX = 0;
    let bigY = 0;
    let smallX = 0;
    let smallY = 0;
    
    let isMoving = false;

    const updatePosition = () => {
      // Easing maths (lerp)
      // Outer ring lags behind smoothly (15% interpolation speed)
      bigX += (targetX - bigX) * 0.15;
      bigY += (targetY - bigY) * 0.15;

      // Inner dot follows faster and tighter (35% interpolation speed)
      smallX += (targetX - smallX) * 0.35;
      smallY += (targetY - smallY) * 0.35;

      if (bigRing) {
        bigRing.style.transform = `translate3d(${bigX}px, ${bigY}px, 0)`;
      }
      if (smallDot) {
        smallDot.style.transform = `translate3d(${smallX}px, ${smallY}px, 0)`;
      }

      // Check distance to decide if animation frame loop can pause when idle
      const distBig = Math.abs(targetX - bigX) + Math.abs(targetY - bigY);
      const distSmall = Math.abs(targetX - smallX) + Math.abs(targetY - smallY);
      
      if (distBig > 0.05 || distSmall > 0.05) {
        rafId = requestAnimationFrame(updatePosition);
      } else {
        isMoving = false;
      }
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (container.classList.contains('cursor-hidden')) {
        container.classList.remove('cursor-hidden');
      }

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

      // Detect hover over any link, button, active input, or explicitly hoverable item
      const isHoverable = target.closest('a, button, [role="button"], .btn, .hoverable, input[type="submit"], input[type="button"], .public-header-logo-section');
      if (isHoverable) {
        if (bigRing) bigRing.classList.add('hovered');
      } else {
        if (bigRing) bigRing.classList.remove('hovered');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseover', handleMouseOver);

    // Default state: hidden until first movement
    container.classList.add('cursor-hidden');

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Server-side safety or touch screen safety
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  if (isTouchDevice) return null;

  return (
    <div ref={containerRef} className="custom-cursor-container cursor-hidden">
      <div ref={bigRingRef} className="cursor-ball-big">
        <svg height="30" width="30">
          <circle cx="15" cy="15" r="12" className="cursor-ring-svg" />
        </svg>
      </div>
      <div ref={smallDotRef} className="cursor-ball-small">
        <svg height="10" width="10">
          <circle cx="5" cy="5" r="4" className="cursor-dot-svg" />
        </svg>
      </div>
    </div>
  );
}
