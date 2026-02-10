import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [eventDate, setEventDate] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDate();
  }, []);

  const fetchEventDate = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/event/settings`);
      if (response.data.eventDate) {
        setEventDate(new Date(response.data.eventDate));
      }
    } catch (error) {
      console.error('Error fetching event date:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventDate || loading) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = eventDate.getTime() - now;

      if (distance < 0) {
        setIsLive(true);
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDate, loading]);

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 215, 0, 0.1)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '1rem',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <p style={{ color: '#888', margin: 0 }}>Loading event countdown...</p>
      </div>
    );
  }

  if (isLive) {
    const width = 450;
    const height = 200;
    const borderRadius = height / 2;
    const totalSegments = 80;
    const segmentLength = 10;
    const segmentWidth = 2;
    const padding = 10;

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
        <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
          {/* Pulsing glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: `${borderRadius}px`,
              background: 'radial-gradient(ellipse, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0.2) 50%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />

          <svg
            height={height}
            width={width}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {Array.from({ length: totalSegments }).map((_, index) => {
              const straightWidth = width - 2 * borderRadius;
              const straightHeight = height - 2 * borderRadius;
              const perimeter = 2 * straightWidth + 2 * straightHeight + 2 * Math.PI * borderRadius;
              const segmentPosition = (index / totalSegments) * perimeter;
              
              let x = 0, y = 0, angle = 0;
              
              if (segmentPosition < straightWidth) {
                x = borderRadius + segmentPosition;
                y = padding;
                angle = -90;
              } else if (segmentPosition < straightWidth + Math.PI * borderRadius / 2) {
                const arcProgress = (segmentPosition - straightWidth) / (Math.PI * borderRadius / 2);
                const arcAngle = arcProgress * 90;
                x = width - borderRadius + (borderRadius - padding) * Math.cos((90 - arcAngle) * Math.PI / 180);
                y = borderRadius - (borderRadius - padding) * Math.sin((90 - arcAngle) * Math.PI / 180);
                angle = -90 + arcAngle;
              } else if (segmentPosition < straightWidth + Math.PI * borderRadius / 2 + straightHeight) {
                x = width - padding;
                y = borderRadius + (segmentPosition - straightWidth - Math.PI * borderRadius / 2);
                angle = 0;
              } else if (segmentPosition < straightWidth + Math.PI * borderRadius + straightHeight) {
                const arcProgress = (segmentPosition - straightWidth - Math.PI * borderRadius / 2 - straightHeight) / (Math.PI * borderRadius / 2);
                const arcAngle = arcProgress * 90;
                x = width - borderRadius + (borderRadius - padding) * Math.cos(arcAngle * Math.PI / 180);
                y = height - borderRadius + (borderRadius - padding) * Math.sin(arcAngle * Math.PI / 180);
                angle = arcAngle;
              } else if (segmentPosition < 2 * straightWidth + Math.PI * borderRadius + straightHeight) {
                x = width - borderRadius - (segmentPosition - straightWidth - Math.PI * borderRadius - straightHeight);
                y = height - padding;
                angle = 90;
              } else if (segmentPosition < 2 * straightWidth + 3 * Math.PI * borderRadius / 2 + straightHeight) {
                const arcProgress = (segmentPosition - 2 * straightWidth - Math.PI * borderRadius - straightHeight) / (Math.PI * borderRadius / 2);
                const arcAngle = arcProgress * 90;
                x = borderRadius - (borderRadius - padding) * Math.cos((90 - arcAngle) * Math.PI / 180);
                y = height - borderRadius + (borderRadius - padding) * Math.sin((90 - arcAngle) * Math.PI / 180);
                angle = 90 + arcAngle;
              } else if (segmentPosition < 2 * straightWidth + 3 * Math.PI * borderRadius / 2 + 2 * straightHeight) {
                x = padding;
                y = height - borderRadius - (segmentPosition - 2 * straightWidth - 3 * Math.PI * borderRadius / 2 - straightHeight);
                angle = 180;
              } else {
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
                <line
                  key={`segment-${index}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#FFD700"
                  strokeWidth={segmentWidth}
                  strokeLinecap="round"
                  style={{
                    opacity: 0.2,
                    animation: `segmentPulse 2s linear infinite`,
                    animationDelay: `${(index / totalSegments) * 2}s`,
                  }}
                />
              );
            })}
          </svg>
          
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${width}px`,
              height: `${height}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span 
              style={{
                fontSize: '4rem',
                fontWeight: 'black',
                background: 'linear-gradient(to right, #FFD700, #FFF, #FFD700)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 3s linear infinite',
              }}
            >
              LIVE NOW
            </span>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.15); }
          }
          @keyframes segmentPulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
          @keyframes shimmer {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 215, 0, 0.1)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '1rem',
      padding: '2rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
      }}>
        <CircularTimer value={timeLeft.days} max={30} label="DAYS" segments={30} />
        <CircularTimer value={timeLeft.hours} max={24} label="HOURS" segments={24} />
        <CircularTimer value={timeLeft.minutes} max={60} label="MINS" segments={60} />
        <CircularTimer value={timeLeft.seconds} max={60} label="SECS" segments={60} />
      </div>
    </div>
  );
};

function CircularTimer({ value, max, label, segments }) {
  const size = 140;
  const center = size / 2;
  const radius = size / 2 - 10;
  const segmentLength = 8;
  const segmentWidth = 2;
  
  const filledSegments = Math.floor((value / max) * segments);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg
          height={size}
          width={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {Array.from({ length: segments }).map((_, index) => {
            const angle = (index * 360) / segments;
            const isFilled = index < filledSegments;
            
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
                style={{ transition: 'stroke 0.3s ease' }}
              />
            );
          })}
        </svg>
        
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${size}px`,
            height: `${size}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 0 15px rgba(255,215,0,0.6)',
          }}>
            {value.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <span style={{
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.3em',
        color: '#FFD700',
        fontWeight: 'bold',
      }}>
        {label}
      </span>
    </div>
  );
}

export default Countdown;
