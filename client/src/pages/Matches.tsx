import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Trophy } from "lucide-react";
import api from "@/lib/api";

interface Match {
  _id: string;
  matchNumber: number;
  game: {
    _id: string;
    name: string;
    image: string;
    icon?: string;
  };
  teamA: {
    _id: string;
    teamName: string;
    secondTeamName?: string;
    hallId: {
      _id: string;
      name: string;
      image: string;
    };
  };
  teamB: {
    _id: string;
    teamName: string;
    secondTeamName?: string;
    hallId: {
      _id: string;
      name: string;
      image: string;
    };
  };
  date: string;
  time: string;
  venue: string;
  round: string;
  status: string;
  result?: {
    winner?: {
      _id: string;
    } | string;
  };
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesVisible, setMatchesVisible] = useState<boolean | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>("All");
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      // Check if matches are visible
      const settingsRes = await api.get('/api/event/settings');
      setMatchesVisible(settingsRes.data.matchesVisible || false);
      
      if (settingsRes.data.matchesVisible) {
        // Fetch matches
        const matchesRes = await api.get('/api/schedule');
        setMatches(matchesRes.data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatchesVisible(false);
    } finally {
      setLoadingMatches(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live':
        return 'from-red-500 to-red-600';
      case 'Completed':
        return 'from-green-500 to-green-600';
      case 'Cancelled':
        return 'from-gray-500 to-gray-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getRoundColor = (round: string) => {
    switch (round) {
      case 'Final':
        return 'text-yellow-400';
      case 'Semi Final':
        return 'text-orange-400';
      case 'Quarter Final':
        return 'text-purple-400';
      default:
        return 'text-primary';
    }
  };

  const rounds = ["All", "League Stage", "Semi Final", "Final"];
  
  const filteredMatches = selectedRound === "All" 
    ? matches 
    : matches.filter(m => m.round === selectedRound);

  const getTeamDisplayName = (team: Match['teamA'] | Match['teamB']) => {
    if (team.secondTeamName) {
      return team.secondTeamName;
    }
    return team.hallId.name;
  };

  // Render match card content
  const renderMatchCard = (match: Match, isLeft: boolean) => {
    return (
      <>
        {/* Match Header */}
        <div className="bg-gradient-to-r from-primary/20 via-blue-500/10 to-purple-500/10 p-2 sm:p-4 border-b border-white/10">
          {isLeft ? (
            // Left cards
            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-2">
              {/* Mobile: Match left, Event right | Desktop: Match, Event, Status */}
              <div className="flex items-start justify-between sm:justify-start gap-1 sm:gap-4 w-full sm:w-auto">
                <div className="order-1">
                  <div className="text-primary font-bold text-[8px] sm:text-xs">MATCH</div>
                  <div className="text-white font-bold text-sm sm:text-2xl">{String(match.matchNumber).padStart(2, '0')}</div>
                </div>
                <div className="flex flex-col items-end sm:items-start order-2">
                  <h3 className="text-white font-bold text-xs sm:text-xl leading-tight">{match.game.name}</h3>
                  <div className={`text-[10px] sm:text-sm font-bold ${getRoundColor(match.round)} mt-0.5 sm:mt-1 leading-tight`}>
                    {match.round}
                  </div>
                </div>
              </div>
              {/* Status - centered on mobile, right on desktop */}
              <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start">
                <div className={`px-2 py-1 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${getStatusColor(match.status)} text-white font-bold text-[8px] sm:text-xs shadow-lg`}>
                  {match.status}
                </div>
              </div>
            </div>
          ) : (
            // Right cards
            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-2">
              {/* Status - centered on mobile, left on desktop */}
              <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start order-2 sm:order-1">
                <div className={`px-2 py-1 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${getStatusColor(match.status)} text-white font-bold text-[8px] sm:text-xs shadow-lg`}>
                  {match.status}
                </div>
              </div>
              {/* Mobile: Event left, Match right | Desktop: Status, Event, Match */}
              <div className="flex items-start justify-between sm:justify-start gap-1 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
                <div className="flex flex-col items-start sm:items-end order-1 sm:order-1">
                  <h3 className="text-white font-bold text-xs sm:text-xl leading-tight">{match.game.name}</h3>
                  <div className={`text-[10px] sm:text-sm font-bold ${getRoundColor(match.round)} mt-0.5 sm:mt-1 leading-tight`}>
                    {match.round}
                  </div>
                </div>
                <div className="text-right order-2 sm:order-2">
                  <div className="text-primary font-bold text-[8px] sm:text-xs">MATCH</div>
                  <div className="text-white font-bold text-sm sm:text-2xl">{String(match.matchNumber).padStart(2, '0')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Match Content */}
        <div className="p-2 sm:p-6">
          {/* Teams */}
          <div className="space-y-2 sm:space-y-4 mb-3 sm:mb-6">
            {/* Team A */}
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <div className="text-white font-bold text-[11px] sm:text-lg text-center leading-tight">{getTeamDisplayName(match.teamA)}</div>
                {match.status === 'Completed' && match.result?.winner && 
                 String(typeof match.result.winner === 'string' ? match.result.winner : match.result.winner._id) === String(match.teamA._id) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                    <Trophy className="w-2 h-2 sm:w-3 sm:h-3" />
                    Winner
                  </span>
                )}
              </div>
              <div className="text-primary text-[10px] sm:text-sm">Team {match.teamA.teamName}{match.teamA.secondTeamName ? ` - ${match.teamA.hallId.name}` : ''}</div>
            </div>

            {/* VS */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              <div className="text-primary font-bold text-[10px] sm:text-sm">VS</div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <div className="text-white font-bold text-[11px] sm:text-lg text-center leading-tight">{getTeamDisplayName(match.teamB)}</div>
                {match.status === 'Completed' && match.result?.winner && 
                 String(typeof match.result.winner === 'string' ? match.result.winner : match.result.winner._id) === String(match.teamB._id) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                    <Trophy className="w-2 h-2 sm:w-3 sm:h-3" />
                    Winner
                  </span>
                )}
              </div>
              <div className="text-primary text-[10px] sm:text-sm">Team {match.teamB.teamName}{match.teamB.secondTeamName ? ` - ${match.teamB.hallId.name}` : ''}</div>
            </div>
          </div>

          {/* Match Details */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-2 sm:mb-4">
            <div className="bg-white/5 rounded-lg p-1.5 sm:p-2.5 border border-white/10 flex flex-col">
              <div className={`flex items-center gap-1 sm:gap-2 text-gray-400 text-[8px] sm:text-xs mb-0.5 sm:mb-1 justify-center sm:${isLeft ? 'justify-start' : 'justify-end'}`}>
                <Clock size={10} className="sm:w-3 sm:h-3" />
                <span>Time</span>
              </div>
              <div className={`text-gray-400 text-[8px] sm:text-xs mb-0.5 text-center sm:${isLeft ? 'text-right' : 'text-left'}`}>{formatDate(match.date)}</div>
              <div className={`text-primary font-semibold text-[10px] sm:text-sm text-center sm:${isLeft ? 'text-right' : 'text-left'}`}>{formatTime(match.time)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-1.5 sm:p-2.5 border border-white/10 flex flex-col">
              <div className={`flex items-center gap-1 sm:gap-2 text-gray-400 text-[8px] sm:text-xs mb-auto justify-center sm:${isLeft ? 'justify-start' : 'justify-end'}`}>
                <MapPin size={10} className="sm:w-3 sm:h-3" />
                <span>Venue</span>
              </div>
              <div className={`text-white font-semibold text-[10px] sm:text-sm mt-auto text-center sm:${isLeft ? 'text-right' : 'text-left'}`}>{match.venue}</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Particle Network Animation
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{x: number, y: number, vx: number, vy: number}> = [];
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 40 : 60;
    const maxDistance = isMobile ? 100 : 120;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particle.x;
          const dy = particles[j].y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 * (1 - distance / maxDistance)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Gradient Mesh Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-yellow-500/15 rounded-full blur-[100px]"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-[90px]"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Particle Network */}
      <canvas
        id="particle-canvas"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10">
        <Navbar />
        
        <div className="pt-32 pb-24 container mx-auto px-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-display"
            >
              MATCH <span className="text-primary">SCHEDULE</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg"
            >
              View all upcoming and completed matches
            </motion.p>
          </motion.div>

          {matchesVisible === null || loadingMatches ? (
            // Loading state
            <div className="flex items-center justify-center py-20">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : !matchesVisible ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/40 backdrop-blur-md border border-white/20 p-12 rounded-2xl text-center max-w-2xl mx-auto"
            >
              <div className="mb-6">
                <Calendar className="mx-auto text-primary" size={64} />
              </div>
              <h2 className="text-3xl font-bold text-primary mb-4">Coming Soon</h2>
              <p className="text-gray-400 text-lg">
                Match schedule will be available soon. Stay tuned for updates!
              </p>
            </motion.div>
          ) : (
            <>
              {/* Round Filter */}
              <div className="flex justify-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-nowrap overflow-x-auto gap-2 sm:gap-3 pb-2 scrollbar-hide max-w-full"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {rounds.map((round) => (
                    <button
                      key={round}
                      onClick={() => setSelectedRound(round)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                        selectedRound === round
                          ? 'bg-gradient-to-r from-primary to-yellow-500 text-black'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {round}
                    </button>
                  ))}
                </motion.div>
              </div>

              {/* Timeline View */}
              {filteredMatches.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Trophy className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400 text-lg">No matches found for this round</p>
                </motion.div>
              ) : (
                <div className="max-w-5xl mx-auto relative px-1 sm:px-0">
                  {/* Desktop Timeline Line - Hidden on mobile */}
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-blue-500 to-purple-500 transform -translate-x-1/2" />

                  {/* Matches */}
                  <div className="space-y-8 sm:space-y-12">
                    {filteredMatches.map((match, index) => {
                      const isLeft = index % 2 === 0;
                      
                      return (
                      <motion.div
                        key={`${match._id}-${selectedRound}`}
                        initial={{ opacity: 0, x: isLeft ? -100 : 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-50px" }}
                        transition={{ 
                          duration: 0.6,
                          delay: index * 0.1,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        className="relative"
                      >
                        {/* Mobile Layout - Alternating with curved timeline */}
                        <div className="md:hidden relative">
                          {/* Timeline for odd matches (left side) */}
                          {isLeft && (
                            <>
                              {/* Vertical line on right */}
                              <div className="absolute right-[10%] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-blue-500" />
                              
                              {/* Timeline Icon */}
                              <div className="absolute right-[10%] top-1/2 transform translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.6)] z-10 border-4 border-black bg-black">
                                {match.game.icon ? (
                                  <img 
                                    src={match.game.icon} 
                                    alt={match.game.name}
                                    className="w-6 h-6 object-contain"
                                  />
                                ) : (
                                  <Trophy className="text-primary" size={16} />
                                )}
                              </div>
                              
                              {/* Connector with CSS curves to next match (if not last) */}
                              {index < filteredMatches.length - 1 && (
                                <div className="absolute top-full left-0 right-0 h-20 flex items-center">
                                  {/* Vertical line down from right - 6px */}
                                  <div 
                                    className="absolute right-[10%] w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"
                                    style={{ top: '0px', height: '8px' }}
                                  />
                                  
                                  {/* Top-right curve - 8px */}
                                  <div 
                                    className="absolute right-[10%] border-l-2 border-b-2 border-purple-500"
                                    style={{ 
                                      top: '6px',
                                      width: '10px',
                                      height: '10px',
                                      borderBottomLeftRadius: '10px',
                                      transform: 'scaleX(-1)'
                                    }}
                                  />
                                  
                                  {/* Horizontal line - at 14px (6px gap + 8px curve) */}
                                  <div 
                                    className="absolute h-0.5 bg-gradient-to-r from-purple-500 via-primary to-purple-500"
                                    style={{
                                      top: '14px',
                                      left: 'calc(10% + 8px)',
                                      right: 'calc(10% + 8px)'
                                    }}
                                  />
                                  
                                  {/* Bottom-left curve - 8px */}
                                  <div 
                                    className="absolute left-[10%] border-r-2 border-t-2 border-purple-500"
                                    style={{ 
                                      top: '14px',
                                      width: '10px',
                                      height: '10px',
                                      borderTopRightRadius: '10px',
                                      transform: 'scaleX(-1)'
                                    }}
                                  />
                                  
                                  {/* Vertical line down to left - 6px */}
                                  <div 
                                    className="absolute left-[10%] w-0.5 bg-gradient-to-b from-purple-500 to-primary"
                                    style={{ top: '22px', height: '11px' }}
                                  />
                                  
                                  {/* Connector line from left card edge to horizontal line */}
                                  <div 
                                    className="absolute h-0.5 bg-gradient-to-l from-purple-500 to-transparent"
                                    style={{
                                      top: '14px',
                                      left: 'calc(10% + 10px)',
                                      width: 'calc(70% - 10px - 1rem)'
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* Match Card - 80% width on left */}
                              <div className="w-[80%] pr-4">
                                <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-xl hover:border-primary/50 transition-all group hover:scale-[1.02]">
                                  {/* Match content here */}
                                  {renderMatchCard(match, true)}
                                </div>
                              </div>
                            </>
                          )}
                          
                          {/* Timeline for even matches (right side) */}
                          {!isLeft && (
                            <>
                              {/* Vertical line on left */}
                              <div className="absolute left-[10%] top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-primary" />
                              
                              {/* Timeline Icon */}
                              <div className="absolute left-[10%] top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.6)] z-10 border-4 border-black bg-black">
                                {match.game.icon ? (
                                  <img 
                                    src={match.game.icon} 
                                    alt={match.game.name}
                                    className="w-6 h-6 object-contain"
                                  />
                                ) : (
                                  <Trophy className="text-primary" size={16} />
                                )}
                              </div>
                              
                              {/* Connector with CSS curves to next match (if not last) */}
                              {index < filteredMatches.length - 1 && (
                                <div className="absolute top-full left-0 right-0 h-20 flex items-center">
                                  {/* Vertical line down from left - 6px */}
                                  <div 
                                    className="absolute left-[10%] w-0.5 bg-gradient-to-b from-purple-500 to-primary"
                                    style={{ top: '0px', height: '7px' }}
                                  />
                                  
                                  {/* Top-left curve - 8px */}
                                  <div 
                                    className="absolute left-[10%] border-r-2 border-b-2 border-primary"
                                    style={{ 
                                      top: '7px',
                                      width: '9px',
                                      height: '9px',
                                      borderBottomRightRadius: '9px',
                                      transform: 'scaleX(-1)'
                                    }}
                                  />

                                  {/* Vertical line down to left - 6px */}
                                  <div 
                                    className="absolute right-[10%] w-0.5 bg-gradient-to-b from-purple-500 to-primary"
                                    style={{ top: '22px', height: '11px' }}
                                  />
                                  
                                  {/* Horizontal line - at 14px (6px gap + 8px curve) */}
                                  <div 
                                    className="absolute h-0.5 bg-gradient-to-r from-primary via-yellow-400 to-blue-500"
                                    style={{
                                      top: '14px',
                                      left: 'calc(10% + 8px)',
                                      right: 'calc(10% + 8px)'
                                    }}
                                  />
                                  
                                  {/* Bottom-right curve - 8px */}
                                  <div 
                                    className="absolute right-[10%] border-l-2 border-t-2 border-blue-500"
                                    style={{ 
                                      top: '14px',
                                      width: '9px',
                                      height: '9px',
                                      borderTopLeftRadius: '9px',
                                      transform: 'scaleX(-1)'
                                    }}
                                  />
                                  
                                  {/* Vertical line down to right - 6px */}
                                  <div 
                                    className="absolute right-[10%] w-0.5 bg-gradient-to-b from-blue-500 to-blue-600"
                                    style={{ top: '22px', height: '6px' }}
                                  />
                                  
                                  {/* Connector line from right card edge to horizontal line */}
                                  <div 
                                    className="absolute h-0.5 bg-gradient-to-r from-primary to-transparent"
                                    style={{
                                      top: '14px',
                                      right: 'calc(10% + 9px)',
                                      width: 'calc(70% - 9px - 1rem)'
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* Match Card - 80% width on right */}
                              <div className="w-[80%] ml-auto pl-4">
                                <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-xl hover:border-primary/50 transition-all group hover:scale-[1.02]">
                                  {/* Match content here */}
                                  {renderMatchCard(match, false)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Desktop Layout - Original centered timeline */}
                        <div className="hidden md:flex items-center gap-8" style={{ flexDirection: isLeft ? 'row' : 'row-reverse' }}>
                          {/* Timeline Icon */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.6)] z-10 border-4 border-black bg-black">
                            {match.game.icon ? (
                              <img 
                                src={match.game.icon} 
                                alt={match.game.name}
                                className="w-12 h-12 object-contain"
                              />
                            ) : (
                              <Trophy className="text-primary" size={16} />
                            )}
                          </div>

                          {/* Match Card */}
                          <div className="w-[calc(50%-4rem)]" style={{ textAlign: isLeft ? 'right' : 'left' }}>
                            <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:border-primary/50 transition-all group hover:scale-[1.02] hover:-translate-y-1">
                              {renderMatchCard(match, isLeft)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )})}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
} 
