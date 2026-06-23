import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function Interactive3DTilt({ children, className = '', maxTilt = 10 }) {
  const x = useMotionValue(0.5); // normalized 0-1 range
  const y = useMotionValue(0.5);

  // Smooth the rotations using spring physics
  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), {
    stiffness: 120,
    damping: 25,
    mass: 0.5
  });

  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), {
    stiffness: 120,
    damping: 25,
    mass: 0.5
  });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    x.set(mouseX / rect.width);
    y.set(mouseY / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
