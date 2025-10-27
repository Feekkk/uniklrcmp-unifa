import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
}

export const AnimatedSection = ({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up',
  duration = 0.6
}: AnimatedSectionProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const directionVariants = {
    up: { y: 60, opacity: 0 },
    down: { y: -60, opacity: 0 },
    left: { x: 60, opacity: 0 },
    right: { x: -60, opacity: 0 },
  };

  const animateVariants: Variants = {
    hidden: directionVariants[direction],
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={animateVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0,
  hover = true
}: AnimatedCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 40, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut",
      }}
      whileHover={hover ? {
        y: -8,
        transition: { duration: 0.2 }
      } : {}}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export const ParallaxSection = ({ 
  children, 
  className = '',
  speed = 0.5
}: ParallaxSectionProps) => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0,
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        y: inView ? 0 : 0,
      }}
      animate={{
        y: inView ? [0, -50 * speed, 0] : 0,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};
