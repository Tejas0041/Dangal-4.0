import { motion } from "framer-motion";
import { ArrowRight, Trophy, ChevronLeft, ChevronRight, User, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import lionLogo from "@assets/image_1770666048367.webp";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Countdown } from "@/components/Countdown";
import { useEffect, useState, useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay } from 'swiper/modules';
import Masonry from 'react-masonry-css';
import LightGallery from 'lightgallery/react';
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import useEmblaCarousel from 'embla-carousel-react';
import AutoPlay from 'embla-carousel-autoplay';
import api from '@/lib/api';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';

// Animations
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const galleryImages = [
  "/gallery-image/DSC_0028.webp",
  "/gallery-image/DSC_0037-2.webp",
  "/gallery-image/DSC_0063.webp",
  "/gallery-image/DSC_00751.webp",
  "/gallery-image/DSC_0135.webp",
  "/gallery-image/DSC_0145.webp",
  "/gallery-image/DSC_0161.webp",
  "/gallery-image/DSC_0162.webp",
  "/gallery-image/DSC_01811.webp",
  "/gallery-image/DSC_0184.webp",
  "/gallery-image/DSC_0191.webp",
  "/gallery-image/DSC_0196.webp",
  "/gallery-image/DSC_0223 (2).webp",
  "/gallery-image/DSC_0235.webp",
  "/gallery-image/DSC_0260.webp",
  "/gallery-image/DSC_1079.webp",
];

// Past Winners Data - Organized by Dangal Edition
interface Winner {
  name: string;
  event: string;
  year: string;
  achievement: string;
  image: string;
  description?: string;
}

const pastWinnersData: Record<"dangal1.0" | "dangal2.0" | "dangal3.0", Winner[]> = {
  "dangal1.0": [
    { 
      name: "Wolfenden Hall", 
      event: "Table Tennis (Men)", 
      year: "2023", 
      achievement: "Champions",
      description: "In an exhilarating showcase of skill and precision, Wolfenden Hall triumphed in Men's Table Tennis at Dangal 2023. Their agile plays, strategic shots, and remarkable sportsmanship secured their well-deserved victory in a thrilling final match.",
      image: "/winners-image/dangal1.0-2023/wolfenden1.webp"
    },
    { 
      name: "Macdonald Hall", 
      event: "Kabaddi (Men)", 
      year: "2023", 
      achievement: "Champions",
      description: "Macdonald Hall emerged victorious in the intense Kabaddi final, displaying exceptional teamwork and strategic prowess. Their dominant raids and solid defense secured the title in a thrilling match at Dangal 2023.",
      image: "/winners-image/dangal1.0-2023/DSC_0263.webp"
    },
    { 
      name: "Macdonald Hall", 
      event: "Tug of War (Men)", 
      year: "2023", 
      achievement: "Champions",
      description: "Macdonald Hall dominated the Tug of War competition, showcasing immense strength, coordination, and teamwork. Their unwavering determination and synchronized efforts led them to a resounding victory in the Men's Tug of War event at Dangal 2023.",
      image: "/winners-image/dangal1.0-2023/tug.webp"
    },
    { 
      name: "Sister Nivedita Hall", 
      event: "Kabaddi (Women)", 
      year: "2023", 
      achievement: "Champions",
      description: "Sister Nivedita Hall exhibited exceptional skills and teamwork in the Girls' Kabaddi final at Dangal 2023, securing a well-deserved victory. Their strategic raids and solid defense showcased their prowess, making them the champions in this thrilling and fiercely contested event.",
      image: "/winners-image/dangal1.0-2023/DSC_0744.webp"
    },
    { 
      name: "Pandya Hall", 
      event: "Tug of War (Women)", 
      year: "2023", 
      achievement: "Champions",
      description: "Pandya Hall showcased immense strength and unity in the Tug of War competition, securing a decisive victory. Their coordinated efforts and unwavering determination in the Women's Tug of War event at Dangal 2023 made them the deserving champions.",
      image: "/winners-image/dangal1.0-2023/DSC_0754.webp"
    },
    { 
      name: "Lt. Williams Hall", 
      event: "Table Tennis (Women)", 
      year: "2023", 
      achievement: "Champions",
      description: "In an impressive display of finesse and skill, Lt. Williams Hall emerged victorious in Girls' Table Tennis at Dangal 2023. The team exhibited exceptional control, strategic plays, and sportsmanship, securing a well-deserved win in an intense final match.",
      image: "/winners-image/dangal1.0-2023/DSC_0768.webp"
    },
  ],
  "dangal2.0": [
    {
      name: "Macdonald Hall",
      event: "Kabaddi (Men)",
      year: "2024",
      achievement: "Champions",
      image: "/winners-image/dangal2.0-2024/macdonaldhallkabaddiwinnersmen.jpeg"
    },
  ],
  "dangal3.0": [
    {
      name: "Hostel 14",
      event: "Tug of War (Men)",
      year: "2025",
      achievement: "Champions",
      image: "/winners-image/dangal3.0-2025/hostel14tugofwarwinner-men.webp"
    },
    {
      name: "Lt. Williams Hall",
      event: "Table Tennis (Women)",
      year: "2025",
      achievement: "Champions",
      image: "/winners-image/dangal3.0-2025/ltwilliamstabletenniswinnerwomen.jpeg"
    },
    {
      name: "Macdonald Hall",
      event: "Kabaddi (Men)",
      year: "2025",
      achievement: "Champions",
      image: "/winners-image/dangal3.0-2025/macdonalhallkabaddiwinnermen.webp"
    },
    {
      name: "Pandya Hall",
      event: "Kabaddi (Women)",
      year: "2025",
      achievement: "Champions",
      image: "/winners-image/dangal3.0-2025/pandyakabaddiwinnerwomen.jpeg"
    },
    {
      name: "Pandya Hall",
      event: "Tug of War (Women)",
      year: "2025",
      achievement: "Champions",
      image: "/winners-image/dangal3.0-2025/pandyatugofwarwinnerwomen.jpeg"
    },
    {
      name: "SEN Hall",
      event: "Table Tennis (Men)",
      year: "2025",
      achievement: "Champions",
      image: "/winners-image/dangal3.0-2025/sentabletenniswinner-mens.jpeg"
    },
  ]
};

// Animated Gradient Mesh Background
function AnimatedMeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient blobs */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-15 md:opacity-30"
        style={{
          background: "radial-gradient(circle, #FFD700 0%, #FFA500 50%, transparent 70%)",
          top: "-20%",
          right: "-10%",
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 md:opacity-20"
        style={{
          background: "radial-gradient(circle, #FF6B00 0%, #FFD700 50%, transparent 70%)",
          bottom: "-10%",
          left: "-5%",
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full blur-[110px] opacity-12 md:opacity-25"
        style={{
          background: "radial-gradient(circle, #FFAA00 0%, #FF8C00 50%, transparent 70%)",
          top: "30%",
          left: "20%",
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
    </div>
  );
}

// Particle Network (No Mouse Interaction)
function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    // Create particles - Reduce count on mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 40 : 80;
    const maxDistance = isMobile ? 100 : 120;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 * (1 - distance / maxDistance)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.4 }}
    />
  );
}

interface Game {
  _id: string;
  name: string;
  description: string;
  image: string;
  rulebook?: string;
}

interface EventSettings {
  eventName: string;
  eventDate: string;
  registrationOpen: boolean;
}

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDangal, setSelectedDangal] = useState<"dangal3.0" | "dangal2.0" | "dangal1.0">("dangal3.0");
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Get current winners based on selected edition
  const pastWinners = pastWinnersData[selectedDangal];
  
  // Get tab indicator position
  const getTabIndicatorX = () => {
    if (!tabContainerRef.current) return 0;
    const containerWidth = tabContainerRef.current.offsetWidth;
    const tabWidth = (containerWidth - 8) / 3; // 8px for padding (4px on each side)
    
    switch (selectedDangal) {
      case "dangal3.0":
        return 4; // 4px padding
      case "dangal2.0":
        return tabWidth + 4;
      case "dangal1.0":
        return (tabWidth * 2) + 4;
      default:
        return 4;
    }
  };

  // Embla Carousel for Winners
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      skipSnaps: false,
      dragFree: false,
      containScroll: 'trimSnaps',
      slidesToScroll: 1,
    },
    [AutoPlay({ delay: 4000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Fetch games and event settings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch games
        const gamesResponse = await api.get('/api/games');
        setGames(gamesResponse.data);
        
        // Fetch event settings
        const eventResponse = await api.get('/api/event/settings');
        setEventSettings(eventResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative">
      {/* Global Animated Mesh Background */}
      <div className="fixed inset-0 z-0">
        <AnimatedMeshBackground />
        <ParticleNetwork />
      </div>
      
      <div className="relative z-10">
        <Navbar />
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-5 py-2 mb-6 border border-primary/30 rounded-full bg-primary/5 backdrop-blur-sm shadow-[0_0_15px_rgba(255,215,0,0.1)]"
            >
              <span className="text-primary text-sm font-bold tracking-[0.2em] uppercase">MacDonald Hall Presents</span>
            </motion.div>
            
            <h1 className="text-7xl md:text-9xl font-bold font-display text-white leading-[0.9] tracking-tighter mb-4">
              {eventSettings?.eventName || 'DANGAL'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-yellow-200 drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]">4.0</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide max-w-lg mb-8 border-l-4 border-primary pl-6">
              The Ultimate Battle of Talent, Grit, and Glory.
            </p>
            
            <Countdown />
            
            <div className="mt-12 flex flex-wrap gap-6 relative z-20">
              <Link to="/register" className="relative z-20">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,215,0,0.6)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-primary text-black font-bold text-lg uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all flex items-center gap-2 relative z-20 pointer-events-auto"
                >
                  Register Now <ArrowRight size={20} />
                </motion.button>
              </Link>
            </div>
          </motion.div>
          
          {/* Right Side - Lion Logo with Roar & Rule */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex flex-col justify-center items-center"
          >
            {/* Animated Energy Brackets - Top & Bottom */}
            {[0, 180].map((rotation, i) => (
              <div key={`bracket-set-${i}`}>
                {/* Left Bracket */}
                <motion.div
                  className="absolute"
                  style={{
                    width: "120px",
                    height: "4px",
                    background: "linear-gradient(90deg, rgba(255,215,0,0.8), rgba(255,215,0,0.2))",
                    transform: `rotate(${rotation}deg)`,
                    top: rotation === 0 ? "0%" : "auto",
                    bottom: rotation === 180 ? "0%" : "auto",
                    left: "10%",
                    boxShadow: "0 0 20px rgba(255,215,0,0.5)",
                  }}
                  animate={{
                    scaleX: [0.7, 1, 0.7],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.8,
                    times: [0, 0.5, 1]
                  }}
                />
                {/* Vertical connector */}
                <motion.div
                  className="absolute"
                  style={{
                    width: "4px",
                    height: "60px",
                    background: "linear-gradient(180deg, rgba(255,215,0,0.8), rgba(255,215,0,0.2))",
                    top: rotation === 0 ? "0%" : "auto",
                    bottom: rotation === 180 ? "0%" : "auto",
                    left: "10%",
                    boxShadow: "0 0 20px rgba(255,215,0,0.5)",
                  }}
                  animate={{
                    scaleY: [0.7, 1, 0.7],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.8,
                    times: [0, 0.5, 1]
                  }}
                />
                
                {/* Right Bracket */}
                <motion.div
                  className="absolute"
                  style={{
                    width: "120px",
                    height: "4px",
                    background: "linear-gradient(90deg, rgba(255,215,0,0.2), rgba(255,215,0,0.8))",
                    transform: `rotate(${rotation}deg)`,
                    top: rotation === 0 ? "0%" : "auto",
                    bottom: rotation === 180 ? "0%" : "auto",
                    right: "10%",
                    boxShadow: "0 0 20px rgba(255,215,0,0.5)",
                  }}
                  animate={{
                    scaleX: [0.7, 1, 0.7],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.8 + 0.4,
                    times: [0, 0.5, 1]
                  }}
                />
                {/* Vertical connector */}
                <motion.div
                  className="absolute"
                  style={{
                    width: "4px",
                    height: "60px",
                    background: "linear-gradient(180deg, rgba(255,215,0,0.8), rgba(255,215,0,0.2))",
                    top: rotation === 0 ? "0%" : "auto",
                    bottom: rotation === 180 ? "0%" : "auto",
                    right: "10%",
                    boxShadow: "0 0 20px rgba(255,215,0,0.5)",
                  }}
                  animate={{
                    scaleY: [0.7, 1, 0.7],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.8 + 0.4,
                    times: [0, 0.5, 1]
                  }}
                />
              </div>
            ))}
            
            {/* Orbiting Dots */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8;
              return (
                <motion.div
                  key={`orbit-${i}`}
                  className="absolute"
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "rgba(255, 215, 0, 0.8)",
                    boxShadow: "0 0 15px rgba(255, 215, 0, 0.6)",
                  }}
                  animate={{
                    x: [
                      Math.cos((angle * Math.PI) / 180) * 200,
                      Math.cos(((angle + 360) * Math.PI) / 180) * 200,
                    ],
                    y: [
                      Math.sin((angle * Math.PI) / 180) * 200,
                      Math.sin(((angle + 360) * Math.PI) / 180) * 200,
                    ],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.2,
                  }}
                />
              );
            })}
            
            {/* Pulsing Rings */}
            {[1, 2, 3].map((ring, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full border border-primary/20"
                style={{
                  width: `${100 + ring * 50}%`,
                  height: `${100 + ring * 50}%`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3 + ring,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: ring * 0.3,
                }}
              />
            ))}
            
            {/* Lion Logo */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
              className="relative z-10 flex flex-col items-center"
            >
              <img 
                src={lionLogo} 
                alt="Macdonald Hall Lion" 
                className="w-full max-w-lg md:max-w-2xl object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.3)] filter brightness-110 relative z-10"
              />
              
              {/* "ROAR & RULE" Tagline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-8 relative"
              >
                <motion.h2 
                  className="text-5xl md:text-7xl font-black font-display tracking-wider text-center"
                  style={{
                    textShadow: "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)",
                  }}
                  animate={{
                    textShadow: [
                      "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)",
                      "0 0 40px rgba(255,215,0,1), 0 0 80px rgba(255,215,0,0.6)",
                      "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-primary to-yellow-400">
                    ROAR
                  </span>
                  <span className="text-white mx-3">&</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-primary to-yellow-200">
                    RULE
                  </span>
                </motion.h2>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="py-12 md:py-16 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <motion.div 
              {...fadeIn}
              className="md:w-1/2"
            >
              <h2 className="text-5xl font-bold text-white mb-6">UNLEASH THE <span className="text-primary">BEAST</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Dangal 4.0 is not just a fest; it's a battleground where legends are forged. Hosted by the prestigious Macdonald Hall, this event brings together the fiercest competitors from across the nation.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Experience the adrenaline of Kabaddi, the raw power of Tug of War, and the precision of Table Tennis. Step in, prove your worth, and take home the glory.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="md:w-1/2 grid grid-cols-2 gap-6"
            >
              {[
                { label: "Elite Events", count: "3" },
                { label: "Years of Legacy", count: "4+" },
                { label: "Participants", count: "100+" },
                { label: "Event Dates", count: "16-18 FEB" },
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  variants={{ 
                    hidden: { opacity: 0, scale: 0.8, y: 20 }, 
                    show: { 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 10,
                        delay: idx * 0.1
                      }
                    } 
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -8,
                    transition: { duration: 0.2 }
                  }}
                  className="bg-black/40 backdrop-blur-md border-2 border-white/20 p-6 rounded-xl flex flex-col items-center justify-center hover:border-primary/50 transition-all group relative overflow-hidden cursor-pointer"
                >
                  {/* Animated Background Gradient */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  
                  {/* Count with Counter Animation */}
                  <motion.span 
                    className="text-4xl font-bold text-white group-hover:text-primary transition-colors font-display relative z-10"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      type: "spring",
                      stiffness: 200,
                      damping: 10,
                      delay: idx * 0.1 + 0.2
                    }}
                  >
                    {stat.count}
                  </motion.span>
                  
                  {/* Label */}
                  <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2 relative z-10 text-center">
                    {stat.label}
                  </span>
                  
                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                    animate={{
                      translateX: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 5,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- ABOUT US SECTION --- */}
      <section id="about" className="py-12 md:py-16 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Our Legacy</span>
            <h2 className="text-5xl md:text-6xl font-bold text-white mt-2">ABOUT <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">US</span></h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2"
            >
              <div className="relative group overflow-hidden rounded-xl border-2 border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                <img 
                  src="/1000430706.webp" 
                  alt="Macdonald Hall"
                  className="w-full h-[400px] md:h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                <span className="text-primary">MACDONALD HALL</span>: ROAR AND RULE
              </h3>
              
              <div className="space-y-4 text-gray-400 text-lg leading-relaxed">
                <p>
                  Nestled within the IIEST Shibpur campus, Macdonald Hall stands as a towering symbol of versatility, where its reputation extends beyond mere physical stature. Macdonald Hall embodies the spirit of teamwork, dedication, and triumph. Within its walls, athletes train tirelessly, honing their skills and pushing their limits in pursuit of victory. Whether hosting sports tournaments or fostering grassroots development, Macdonald Hall remains the beating heart of sports culture at IIEST Shibpur, inspiring a legacy of champions.
                </p>
                
                <p>
                  Nestled proudly across the majestic Lords ground, the Leo Hall exudes an unparalleled aura. Here, within the Leo Hall, dwell the upper echelons of final and pre-final year students, forging their legacies with each passing day.
                </p>
              </div>

              {/* Decorative Element */}
              <div className="mt-8 flex items-center gap-4">
                <div className="h-1 w-20 bg-primary rounded-full" />
                <span className="text-primary font-display text-sm uppercase tracking-widest">Est. 1952</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- CAROUSEL SECTION (Swiper) --- */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Action Highlights</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-2">WITNESS THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">INTENSITY</span></h2>
          </div>
          
          <div className="relative">
            <Swiper
              effect="coverflow"
              grabCursor={true}
              centeredSlides={true}
              slidesPerView="auto"
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 1.5,
                slideShadows: false,
              }}
              loop={true}
              autoplay={{
                delay: 2000,
                disableOnInteraction: false,
              }}
              modules={[EffectCoverflow, Autoplay]}
              className="swiper-container"
            >
              {[
                "/carousel-images/DSC_0075.webp",
                "/carousel-images/DSC_0101.webp",
                "/carousel-images/DSC_0442.webp",
                "/carousel-images/DSC_0132.webp",
                "/carousel-images/DSC_0029.webp",
                "/carousel-images/DSC_0407.webp",
                "/carousel-images/DSC_0124.webp",
                "/carousel-images/WhatsApp Image 2026-02-11 at 10.16.45 AM.webp"
              ].map((img, idx) => (
                <SwiperSlide key={idx}>
                  <div className="relative overflow-hidden rounded-lg border-2 border-white/20 bg-black/30 backdrop-blur-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] h-[300px] md:h-[400px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    <img 
                      src={img} 
                      alt={`Dangal moment ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* --- EVENTS SECTION --- */}
      <section id="events" className="pt-6 pb-12 md:pt-8 md:pb-16 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mt-2 font-display">
              CHOOSE YOUR <span className="text-primary">BATTLE</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {loading ? (
              // Skeleton placeholders
              [...Array(3)].map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-xl flex flex-col"
                >
                  {/* Image Skeleton */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-r from-yellow-900/20 via-primary/30 to-yellow-900/20 animate-shimmer bg-[length:200%_100%]">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />
                  </div>
                  
                  {/* Content Skeleton */}
                  <div className="p-6 flex flex-col flex-1 space-y-4">
                    {/* Title Skeleton */}
                    <div className="h-8 bg-gradient-to-r from-yellow-900/20 via-primary/30 to-yellow-900/20 animate-shimmer bg-[length:200%_100%] rounded w-3/4" />
                    
                    {/* Description Skeleton */}
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gradient-to-r from-yellow-900/20 via-primary/30 to-yellow-900/20 animate-shimmer bg-[length:200%_100%] rounded w-full" />
                      <div className="h-4 bg-gradient-to-r from-yellow-900/20 via-primary/30 to-yellow-900/20 animate-shimmer bg-[length:200%_100%] rounded w-5/6" />
                      <div className="h-4 bg-gradient-to-r from-yellow-900/20 via-primary/30 to-yellow-900/20 animate-shimmer bg-[length:200%_100%] rounded w-4/6" />
                    </div>
                    
                    {/* Buttons Skeleton */}
                    <div className="flex gap-3 mt-auto">
                      <div className="flex-1 h-12 bg-gradient-to-r from-yellow-900/20 via-primary/30 to-yellow-900/20 animate-shimmer bg-[length:200%_100%] rounded-lg" />
                      <div className="flex-1 h-12 bg-gradient-to-r from-yellow-900/20 via-primary/30 to-yellow-900/20 animate-shimmer bg-[length:200%_100%] rounded-lg" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              games.map((game, index) => (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden">
                    <motion.img 
                      src={game.image} 
                      alt={game.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-primary mb-3 font-display">
                      {game.name}
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed flex-1">
                      {game.description}
                    </p>
                    
                    <div className="flex gap-3 mt-auto">
                      {game.rulebook && (
                        <a 
                          href={game.rulebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full px-4 py-3 bg-white/5 text-white border border-white/20 rounded-lg font-bold uppercase tracking-wider hover:bg-white/10 hover:border-white/40 transition-all duration-300"
                          >
                            Rulebook
                          </motion.button>
                        </a>
                      )}
                      
                      <Link to="/register" className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full px-4 py-3 bg-black text-white border border-primary/50 rounded-lg font-bold uppercase tracking-wider hover:bg-primary hover:text-black transition-all duration-300"
                        >
                          Register
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- GALLERY SECTION --- */}
      <section id="gallery" className="py-12 md:py-16 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Memories</span>
            <h2 className="text-5xl md:text-6xl font-bold text-white mt-2">DANGAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">MOMENTS</span></h2>
            <p className="text-gray-400 mt-4 text-lg">Relive the epic battles and unforgettable moments</p>
          </div>
          
          {/* Mobile View - 5 Images + View More Button */}
          <div className="md:hidden">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Images at positions: 3,3 (index 10), 4,1 (index 12), 4,4 (index 15), 4,3 (index 14), 3,4 (index 11) */}
              {[galleryImages[10], galleryImages[12], galleryImages[15], galleryImages[14], galleryImages[11]].map((src, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden rounded-lg border-2 border-white/10 bg-black/20 backdrop-blur-sm ${idx === 4 ? 'col-span-2' : ''}`}
                >
                  <img 
                    src={src} 
                    alt=""
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              ))}
            </div>
            
            {/* View More Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => {
                const gallerySection = document.getElementById('mobile-gallery-modal');
                if (gallerySection) {
                  gallerySection.classList.remove('hidden');
                  document.body.style.overflow = 'hidden';
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-primary to-yellow-600 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
            >
              View More
            </motion.button>
          </div>

          {/* Desktop View - Full Gallery */}
          <div className="hidden md:block">
            <LightGallery
              speed={500}
              plugins={[lgZoom, lgThumbnail]}
              mode="lg-slide-skew-only"
              thumbnail={true}
              animateThumb={true}
              zoomFromOrigin={true}
              allowMediaOverlap={true}
              toggleThumb={true}
              download={false}
              swipeThreshold={50}
              enableSwipe={true}
              enableDrag={true}
              preload={2}
              elementClassNames="masonry-gallery"
              selector=".gallery-item"
              subHtmlSelectorRelative={false}
              licenseKey="0000-0000-000-0000"
            >
              <Masonry
                breakpointCols={{
                  default: 4,
                  1100: 3,
                  700: 2,
                }}
                className="masonry-grid"
                columnClassName="masonry-grid-column"
              >
                {galleryImages.map((src, idx) => (
                  <motion.a
                    key={idx}
                    href={src}
                    data-sub-html=""
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.03, duration: 0.4 }}
                    className="gallery-item group relative block overflow-hidden rounded-lg border-2 border-white/10 bg-black/20 backdrop-blur-sm cursor-pointer mb-4 will-change-transform"
                  >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                    
                    {/* Corner Accents - Top Left */}
                    <div className="absolute top-0 left-0 w-0 h-0 border-t-[3px] border-l-[3px] border-primary opacity-0 group-hover:opacity-100 group-hover:w-12 group-hover:h-12 transition-all duration-300 z-30" />
                    
                    {/* Corner Accents - Bottom Right */}
                    <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[3px] border-r-[3px] border-primary opacity-0 group-hover:opacity-100 group-hover:w-12 group-hover:h-12 transition-all duration-300 z-30" />
                    
                    {/* Image */}
                    <img 
                      src={src} 
                      alt=""
                      loading="lazy"
                      className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  </motion.a>
                ))}
              </Masonry>
            </LightGallery>
          </div>
        </div>
      </section>

      {/* Mobile Gallery Modal */}
      <div id="mobile-gallery-modal" className="hidden fixed inset-0 bg-black z-[9999] overflow-y-auto">
        <div className="min-h-screen p-4 pb-20 pt-[4.5rem]">
          {/* Close Button - Fixed at top with margin to avoid navbar */}
          <div className="sticky top-[4rem] z-10 flex justify-between items-center mb-4 pt-2 pb-4 bg-gradient-to-b from-black via-black to-transparent">
            <h2 className="text-2xl md:text-3xl font-bold text-white">DANGAL <span className="text-primary">GALLERY</span></h2>
            <button
              onClick={() => {
                const gallerySection = document.getElementById('mobile-gallery-modal');
                if (gallerySection) {
                  gallerySection.classList.add('hidden');
                  document.body.style.overflow = 'auto';
                }
              }}
              className="w-12 h-12 bg-primary backdrop-blur-md border-2 border-black rounded-full flex items-center justify-center hover:bg-yellow-500 transition-all shadow-lg flex-shrink-0"
              style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* All Images - Clickable Grid */}
          <div className="grid grid-cols-2 gap-4">
            {galleryImages.map((src, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(src)}
                className="relative block overflow-hidden rounded-lg border-2 border-white/10 bg-black/20 cursor-pointer active:scale-95 transition-transform"
              >
                <img 
                  src={src} 
                  alt=""
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full View Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black z-[10000] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-[10001] w-14 h-14 bg-primary backdrop-blur-md border-2 border-black rounded-full flex items-center justify-center hover:bg-yellow-500 transition-all shadow-lg"
            style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Full Size Image */}
          <img 
            src={selectedImage} 
            alt="Full view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* --- PAST WINNERS SECTION --- */}
<section id="winners" className="py-12 md:py-16 relative">
  <div className="container mx-auto px-6">
    <div className="text-center mb-8">
      <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Legacy</span>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-2">
        PAST <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">WINNERS</span>
      </h2>
    </div>
    
    {/* Dangal Edition Selector - Mobile Optimized with Sliding Indicator */}
    <div className="flex justify-center mb-12">
      <div ref={tabContainerRef} className="relative inline-flex bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-1 w-full max-w-2xl">
        {/* Sliding Background Indicator */}
        <motion.div
          className="absolute top-1 bottom-1 bg-primary rounded-lg shadow-lg shadow-primary/30 z-0"
          style={{
            width: tabContainerRef.current ? `${(tabContainerRef.current.offsetWidth - 8) / 3}px` : '33.333%',
            left: '4px'
          }}
          animate={{
            x: getTabIndicatorX() - 4
          }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 40,
            mass: 0.5
          }}
        />
        
        <button
          onClick={() => setSelectedDangal("dangal3.0")}
          className={`relative z-10 flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-bold text-xs md:text-sm uppercase tracking-wider transition-colors duration-200 ${
            selectedDangal === "dangal3.0"
              ? "text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="block md:inline">Dangal 3.0</span>
          <span className="block md:inline md:ml-1 text-[10px] md:text-xs">(2025)</span>
        </button>
        <button
          onClick={() => setSelectedDangal("dangal2.0")}
          className={`relative z-10 flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-bold text-xs md:text-sm uppercase tracking-wider transition-colors duration-200 ${
            selectedDangal === "dangal2.0"
              ? "text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="block md:inline">Dangal 2.0</span>
          <span className="block md:inline md:ml-1 text-[10px] md:text-xs">(2024)</span>
        </button>
        <button
          onClick={() => setSelectedDangal("dangal1.0")}
          className={`relative z-10 flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-bold text-xs md:text-sm uppercase tracking-wider transition-colors duration-200 ${
            selectedDangal === "dangal1.0"
              ? "text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="block md:inline">Dangal 1.0</span>
          <span className="block md:inline md:ml-1 text-[10px] md:text-xs">(2023)</span>
        </button>
      </div>
    </div>
    
    {/* Preload all winner images */}
    <div className="hidden">
      {pastWinners.map((winner, idx) => (
        <img key={idx} src={winner.image} alt="" />
      ))}
    </div>
    
    {/* Empty State */}
    {pastWinners.length === 0 && (
      <div className="text-center py-20">
        <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto">
          <Trophy className="text-primary/50 mx-auto mb-6" size={64} />
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Coming Soon</h3>
          <p className="text-gray-400 text-base md:text-lg">
            Winners for this edition will be announced after the event concludes.
          </p>
        </div>
      </div>
    )}
    
    {/* Winners Carousel - Only show if there are winners */}
    {pastWinners.length > 0 && (
    <div className="relative">
      {/* Embla Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className={`flex -ml-4 md:-ml-6 ${pastWinners.length < 3 ? 'justify-center' : ''}`}>
          {pastWinners.map((winner, idx) => (
            <div
              key={idx}
              className={`pl-4 md:pl-6 flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 ${pastWinners.length < 3 ? 'lg:max-w-md' : ''}`}
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl hover:border-primary/50 transition-all group shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden h-full">
                {/* Winner Image */}
                <div className="relative h-48 md:h-64 overflow-hidden">
                  <img 
                    src={winner.image} 
                    alt={winner.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-primary/90 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full">
                    <span className="text-black font-bold text-xs md:text-sm">{winner.year}</span>
                  </div>
                </div>
                
                {/* Winner Info */}
                <div className="p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <Trophy className="text-primary flex-shrink-0 group-hover:rotate-12 transition-transform" size={28} />
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{winner.name}</h3>
                      <p className="text-primary font-display tracking-widest uppercase text-xs md:text-sm">
                        {winner.event}
                      </p>
                    </div>
                  </div>
                  
                  {winner.description && (
                    <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-3 md:mb-4 line-clamp-3">
                      {winner.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/10">
                    <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">
                      {winner.achievement}
                    </span>
                    <div className="w-6 md:w-8 h-1 bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons - Only show if more than 3 winners */}
      {pastWinners.length > 3 && (
        <>
          <button
            onClick={scrollPrev}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary/40 items-center justify-center text-primary hover:bg-primary/40 hover:scale-110 hover:border-primary/60 transition-all z-10 shadow-[0_0_25px_rgba(255,215,0,0.4)]"
            aria-label="Previous"
            style={{marginLeft: '-50px'}}
          >
            <ChevronLeft size={24} strokeWidth={2.5} className="xl:w-7 xl:h-7" />
          </button>

          <button
            onClick={scrollNext}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary/40 items-center justify-center text-primary hover:bg-primary/40 hover:scale-110 hover:border-primary/60 transition-all z-10 shadow-[0_0_25px_rgba(255,215,0,0.4)]"
            aria-label="Next"
            style={{marginRight: '-50px'}}
          >
            <ChevronRight size={24} strokeWidth={2.5} className="xl:w-7 xl:h-7" />
          </button>
        </>
      )}
    </div>
    )}
  </div>
  </section>


      {/* --- COORDINATOR SECTION --- */}
      <section className="py-12 md:py-16 relative">
        <div className="container mx-auto px-6">
          {/* Heading Outside */}
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4 font-display"
            >
              EVENT COORDINATORS
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="w-20 h-1 bg-primary mx-auto"
            />
          </div>

          {/* Coordinator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Coordinator 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-8 md:p-10 text-center hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col h-full"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={40} className="text-primary md:w-12 md:h-12" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-display">VEDANT DHANRAJ BAGADE</h3>
              <p className="text-primary font-semibold mb-6 text-base md:text-lg">Event Coordinator</p>
              <div className="flex-grow"></div>
              <a
                href="tel:+918421201582"
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black font-bold rounded-full hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
              >
                <Phone size={20} />
                <span className="text-base md:text-lg">+91 84212 01582</span>
              </a>
            </motion.div>

            {/* Coordinator 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-8 md:p-10 text-center hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col h-full"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={40} className="text-primary md:w-12 md:h-12" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-display">MANCHU VENKATA SAI SAKETH</h3>
              <p className="text-primary font-semibold mb-6 text-base md:text-lg">Event Coordinator</p>
              <div className="flex-grow"></div>
              <a
                href="tel:+919381457448"
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black font-bold rounded-full hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
              >
                <Phone size={20} />
                <span className="text-base md:text-lg">+91 93814 57448</span>
              </a>
            </motion.div>

            {/* Coordinator 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-8 md:p-10 text-center hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col h-full"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={40} className="text-primary md:w-12 md:h-12" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-display">PRATIK GANPAT KADAM</h3>
              <p className="text-primary font-semibold mb-6 text-base md:text-lg">Event Coordinator</p>
              <div className="flex-grow"></div>
              <a
                href="tel:+917436048007"
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black font-bold rounded-full hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
              >
                <Phone size={20} />
                <span className="text-base md:text-lg">+91 74360 48007</span>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
}
