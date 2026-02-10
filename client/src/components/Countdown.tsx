import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown() {
  const [targetDate, setTargetDate] = useState<number>(new Date("2026-02-16T00:00:00").getTime());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  // Fetch event date from backend
  useEffect(() => {
    const fetchEventDate = async () => {
      try {
        const response = await api.get('/api/event/settings');
        const eventDate = new Date(response.data.eventDate).getTime();
        setTargetDate(eventDate);
      } catch (error) {
        console.error('Failed to fetch event date:', error);
        // Use default date if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchEventDate();
  }, []);

  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsLive(true);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
        setIsLive(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-6">
        <div className="text-[#FFD700] text-sm">Loading...</div>
      </div>
    );
  }

  if (isLive) {
    const width = typeof window !== 'undefined' && window.innerWidth < 480 ? 220 :
                  typeof window !== 'undefined' && window.innerWidth < 640 ? 260 : 
                  typeof window !== 'undefined' && window.innerWidth < 768 ? 320 : 450;
    const height = typeof window !== 'undefined' && window.innerWidth < 480 ? 90 :
                   typeof window !== 'undefined' && window.innerWidth < 640 ? 110 : 
                   typeof window !== 'undefined' && window.innerWidth < 768 ? 140 : 200;
    const borderRadius = height / 2; // 50% border radius (pill shape)
    const totalSegments = 80;
    const segmentLength = width < 200 ? 4 : width < 280 ? 6 : 10;
    const segmentWidth = 2;
    const padding = 10;

    return (
      <div className="flex justify-center items-center mt-6 px-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Rounded rectangle with animated segments */}
          <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 blur-2xl"
              style={{
                borderRadius: `${borderRadius}px`,
                background: 'radial-gradient(ellipse, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0.2) 50%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <svg
              height={height}
              width={width}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {/* Animated segments around rounded rectangle */}
              {Array.from({ length: totalSegments }).map((_, index) => {
                // Calculate perimeter of rounded rectangle
                const straightWidth = width - 2 * borderRadius;
                const straightHeight = height - 2 * borderRadius;
                const perimeter = 2 * straightWidth + 2 * straightHeight + 2 * Math.PI * borderRadius;
                const segmentPosition = (index / totalSegments) * perimeter;
                
                let x = 0, y = 0, angle = 0;
                
                // Top straight edge
                if (segmentPosition < straightWidth) {
                  x = borderRadius + segmentPosition;
                  y = padding;
                  angle = -90;
                }
                // Top-right arc
                else if (segmentPosition < straightWidth + Math.PI * borderRadius / 2) {
                  const arcProgress = (segmentPosition - straightWidth) / (Math.PI * borderRadius / 2);
                  const arcAngle = arcProgress * 90;
                  x = width - borderRadius + (borderRadius - padding) * Math.cos((90 - arcAngle) * Math.PI / 180);
                  y = borderRadius - (borderRadius - padding) * Math.sin((90 - arcAngle) * Math.PI / 180);
                  angle = -90 + arcAngle;
                }
                // Right straight edge
                else if (segmentPosition < straightWidth + Math.PI * borderRadius / 2 + straightHeight) {
                  x = width - padding;
                  y = borderRadius + (segmentPosition - straightWidth - Math.PI * borderRadius / 2);
                  angle = 0;
                }
                // Bottom-right arc
                else if (segmentPosition < straightWidth + Math.PI * borderRadius + straightHeight) {
                  const arcProgress = (segmentPosition - straightWidth - Math.PI * borderRadius / 2 - straightHeight) / (Math.PI * borderRadius / 2);
                  const arcAngle = arcProgress * 90;
                  x = width - borderRadius + (borderRadius - padding) * Math.cos(arcAngle * Math.PI / 180);
                  y = height - borderRadius + (borderRadius - padding) * Math.sin(arcAngle * Math.PI / 180);
                  angle = arcAngle;
                }
                // Bottom straight edge
                else if (segmentPosition < 2 * straightWidth + Math.PI * borderRadius + straightHeight) {
                  x = width - borderRadius - (segmentPosition - straightWidth - Math.PI * borderRadius - straightHeight);
                  y = height - padding;
                  angle = 90;
                }
                // Bottom-left arc
                else if (segmentPosition < 2 * straightWidth + 3 * Math.PI * borderRadius / 2 + straightHeight) {
                  const arcProgress = (segmentPosition - 2 * straightWidth - Math.PI * borderRadius - straightHeight) / (Math.PI * borderRadius / 2);
                  const arcAngle = arcProgress * 90;
                  x = borderRadius - (borderRadius - padding) * Math.cos((90 - arcAngle) * Math.PI / 180);
                  y = height - borderRadius + (borderRadius - padding) * Math.sin((90 - arcAngle) * Math.PI / 180);
                  angle = 90 + arcAngle;
                }
                // Left straight edge
                else if (segmentPosition < 2 * straightWidth + 3 * Math.PI * borderRadius / 2 + 2 * straightHeight) {
                  x = padding;
                  y = height - borderRadius - (segmentPosition - 2 * straightWidth - 3 * Math.PI * borderRadius / 2 - straightHeight);
                  angle = 180;
                }
                // Top-left arc
                else {
                  const arcProgress = (segmentPosition - 2 * straightWidth - 3 * Math.PI * borderRadius / 2 - 2 * straightHeight) / (Math.PI * borderRadius / 2);
                  const arcAngle = arcProgress * 90;
                  x = borderRadius + (borderRadius - padding) * Math.cos((180 + arcAngle) * Math.PI / 180);
                  y = borderRadius + (borderRadius - padding) * Math.sin((180 + arcAngle) * Math.PI / 180);
                  angle = 180 + arcAngle;
                }

                const startX = x;
                const startY = y;
                const endX = x + segmentLength * Math.cos(angle * Math.PI / 180);
                const endY = y + segmentLength * Math.sin(angle * Math.PI / 180);
                
                return (
                  <motion.line
                    key={`segment-${index}`}
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#FFD700"
                    strokeWidth={segmentWidth}
                    strokeLinecap="round"
                    initial={{ opacity: 0.2 }}
                    animate={{ 
                      opacity: [0.2, 1, 0.2],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                      delay: (index / totalSegments) * 2,
                    }}
                  />
                );
              })}
            </svg>
            
            {/* Center content */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                top: 0,
                left: 0,
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              <motion.span 
                className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black font-display text-center"
                style={{
                  background: 'linear-gradient(to right, #FFD700, #FFF, #FFD700)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                animate={{
                  backgroundPosition: ['0% center', '200% center'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                LIVE NOW
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-nowrap justify-center items-center gap-2 sm:gap-3 md:gap-6 lg:gap-8 mt-6 px-2 overflow-x-auto">
      <CircularTimer value={timeLeft.days} max={30} label="DAYS" segments={30} />
      <CircularTimer value={timeLeft.hours} max={24} label="HOURS" segments={24} />
      <CircularTimer value={timeLeft.minutes} max={60} label="MINS" segments={60} />
      <CircularTimer value={timeLeft.seconds} max={60} label="SECS" segments={60} />
    </div>
  );
}

function CircularTimer({ value, max, label, segments }: { value: number; max: number; label: string; segments: number }) {
  // Responsive size
  const size = typeof window !== 'undefined' && window.innerWidth < 640 ? 80 : 
               typeof window !== 'undefined' && window.innerWidth < 768 ? 100 : 140;
  const center = size / 2;
  const radius = size / 2 - 10;
  const segmentLength = size < 100 ? 5 : 8; // Shorter lines on mobile
  const segmentWidth = 2;
  
  // Calculate how many segments should be filled
  const filledSegments = Math.floor((value / max) * segments);

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      {/* Circular Progress */}
      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        <svg
          height={size}
          width={size}
          className="transform -rotate-90"
        >
          {/* Segments */}
          {Array.from({ length: segments }).map((_, index) => {
            const angle = (index * 360) / segments;
            const isFilled = index < filledSegments;
            
            // Calculate line position (on the border, pointing inward)
            const startX = center + radius * Math.cos((angle * Math.PI) / 180);
            const startY = center + radius * Math.sin((angle * Math.PI) / 180);
            const endX = center + (radius - segmentLength) * Math.cos((angle * Math.PI) / 180);
            const endY = center + (radius - segmentLength) * Math.sin((angle * Math.PI) / 180);
            
            return (
              <line
                key={`segment-${index}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={isFilled ? "#FFD700" : "rgba(255, 255, 255, 0.15)"}
                strokeWidth={segmentWidth}
                strokeLinecap="round"
                style={{
                  transition: 'stroke 0.3s ease',
                }}
              />
            );
          })}
        </svg>
        
        {/* Center value */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            top: 0,
            left: 0,
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display text-white drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      {/* Label */}
      <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-[#FFD700] font-bold font-display whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
