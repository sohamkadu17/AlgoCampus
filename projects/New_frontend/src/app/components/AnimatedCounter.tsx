import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  decimals = 2,
  duration = 1.5,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [spring]);

  const formatted = displayValue.toFixed(decimals);

  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  );
}

// Compact version for inline use
export function CountUp({ 
  end, 
  start = 0, 
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: { 
  end: number; 
  start?: number; 
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentCount = start + (end - start) * easeOutQuad(progress);
      
      setCount(currentCount);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, start, duration]);

  return (
    <span ref={nodeRef} className={className}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
}
