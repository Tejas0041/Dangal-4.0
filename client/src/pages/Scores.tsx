import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import { Trophy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { socket } from "@/lib/socket";

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

// Particle Network
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

interface Match {
  _id: string;
  matchNumber: number;
  game: {
    _id: string;
    name: string;
    icon?: string;
  };
  teamA: {
    _id: string;
    teamName: string;
    secondTeamName?: string;
    hallId: {
      _id: string;
      name: string;
    };
  };
  teamB: {
    _id: string;
    teamName: string;
    secondTeamName?: string;
    hallId: {
      _id: string;
      name: string;
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
    teamAScore?: any;
    teamBScore?: any;
    tableTennis?: {
      sets: Array<{
        teamAScore: number;
        teamBScore: number;
        winner?: string;
      }>;
      setsWonA: number;
      setsWonB: number;
    };
  };
}

export default function Scores() {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreUpdates, setScoreUpdates] = useState<{ [key: string]: string }>({});
  const [scoresVisible, setScoresVisible] = useState<boolean | null>(null);

  useEffect(() => {
    fetchMatches();

    // Socket listeners
    socket.on('matchUpdated', handleMatchUpdate);
    socket.on('scoreUpdate', handleScoreUpdate);

    return () => {
      socket.off('matchUpdated', handleMatchUpdate);
      socket.off('scoreUpdate', handleScoreUpdate);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      
      // Check if scores are visible
      const settingsRes = await api.get('/api/event/settings');
      setScoresVisible(settingsRes.data.scoresVisible || false);
      
      if (settingsRes.data.scoresVisible) {
        const response = await api.get('/api/schedule');
        const live = response.data.filter((m: Match) => m.status === 'Live');
        const completed = response.data.filter((m: Match) => m.status === 'Completed');
        setLiveMatches(live);
        setCompletedMatches(completed);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setScoresVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchUpdate = (updatedMatch: Match) => {
    // Update or add to live matches if status is Live
    if (updatedMatch.status === 'Live') {
      setLiveMatches(prev => {
        const exists = prev.find(m => m._id === updatedMatch._id);
        if (exists) {
          return prev.map(m => m._id === updatedMatch._id ? updatedMatch : m);
        } else {
          return [...prev, updatedMatch];
        }
      });
      // Remove from completed if it was there
      setCompletedMatches(prev => prev.filter(m => m._id !== updatedMatch._id));
    } 
    // Update or add to completed matches if status is Completed
    else if (updatedMatch.status === 'Completed') {
      setCompletedMatches(prev => {
        const exists = prev.find(m => m._id === updatedMatch._id);
        if (exists) {
          return prev.map(m => m._id === updatedMatch._id ? updatedMatch : m);
        } else {
          return [...prev, updatedMatch];
        }
      });
      // Remove from live if it was there
      setLiveMatches(prev => prev.filter(m => m._id !== updatedMatch._id));
    }
    // If status is Scheduled or Cancelled, remove from both
    else {
      setLiveMatches(prev => prev.filter(m => m._id !== updatedMatch._id));
      setCompletedMatches(prev => prev.filter(m => m._id !== updatedMatch._id));
    }
  };

  const handleScoreUpdate = (data: { matchId: string; increment: number; team: 'A' | 'B' }) => {
    const key = `${data.matchId}-${data.team}`;
    setScoreUpdates(prev => ({ ...prev, [key]: `+${data.increment}` }));
    setTimeout(() => {
      setScoreUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[key];
        return newUpdates;
      });
    }, 2000);
  };

  const getTeamDisplayName = (team: Match['teamA'] | Match['teamB']) => {
    if (team.secondTeamName) {
      return team.secondTeamName;
    }
    return team.hallId.name;
  };

  const getTeamSubtitle = (team: Match['teamA'] | Match['teamB']) => {
    if (team.secondTeamName) {
      return `Team ${team.teamName} - ${team.hallId.name}`;
    }
    return `Team ${team.teamName}`;
  };

  const getScore = (match: Match, team: 'A' | 'B') => {
    if (!match.result) return 0;

    const gameName = match.game.name.toUpperCase();
    
    // Handle Tug of War - show 1 for winner, 0 for loser
    if (gameName === 'TUG OF WAR') {
      if (!match.result.winner) return 0;
      const winnerId = typeof match.result.winner === 'string' 
        ? match.result.winner 
        : match.result.winner._id;
      const teamId = team === 'A' ? match.teamA._id : match.teamB._id;
      return String(winnerId) === String(teamId) ? 1 : 0;
    }
    
    if (gameName === 'KABADDI') {
      const teamScore = team === 'A' ? match.result.teamAScore : match.result.teamBScore;
      if (!teamScore) return 0;
      return (teamScore.raidPoints || 0) + (teamScore.bonusPoints || 0) + 
             (teamScore.allOutPoints || 0) + (teamScore.extraPoints || 0);
    }
    
    if (gameName === 'TABLE TENNIS') {
      return team === 'A' ? (match.result.tableTennis?.setsWonA || 0) : (match.result.tableTennis?.setsWonB || 0);
    }
    
    return 0;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isWinner = (match: Match, teamId: string) => {
    if (!match.result?.winner) return false;
    const winnerId = typeof match.result.winner === 'string' 
      ? match.result.winner 
      : match.result.winner._id;
    return String(winnerId) === String(teamId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary text-xl">Loading scores...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Global Animated Mesh Background */}
      <div className="fixed inset-0 z-0">
        <AnimatedMeshBackground />
        <ParticleNetwork />
      </div>
      
      <div className="relative z-10">
        <Navbar />
      
        <div className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
              Live Scores
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Real-time match updates</p>
        </motion.div>

        {/* Loading State */}
        {(scoresVisible === null || loading) && (
          <div className="flex items-center justify-center py-20">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Coming Soon Message */}
        {!loading && scoresVisible === false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-2xl text-center max-w-2xl mx-auto"
          >
            <div className="mb-6">
              <Trophy className="mx-auto text-primary" size={64} />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-4">Coming Soon</h2>
            <p className="text-gray-400 text-lg">
              Live scores will be available soon. Stay tuned for real-time match updates!
            </p>
          </motion.div>
        )}

        {/* Live Matches */}
        {!loading && scoresVisible && liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary">Live Now</h2>
            </div>
            
            <div className="grid gap-4">
              {liveMatches.map((match, index) => (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card hover:border-primary/50 transition-all duration-300 rounded-xl p-4 md:p-6 relative overflow-hidden group"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Game Info */}
                    <div className="flex items-center gap-3">
                      {match.game.icon && (
                        <img src={match.game.icon} alt="" className="w-10 h-10 md:w-12 md:h-12" />
                      )}
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-primary">{match.game.name}</h3>
                        <p className="text-sm text-gray-400">Match {match.matchNumber} • {match.round}</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-4 md:gap-8">
                      {/* Team A */}
                      <div className="flex-1 text-right">
                        <p className="text-sm md:text-base font-semibold truncate">{getTeamDisplayName(match.teamA)}</p>
                        <p className="text-xs text-gray-500">{getTeamSubtitle(match.teamA)}</p>
                      </div>

                      {/* Score Display */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 md:gap-4 relative">
                          <div className="text-center relative">
                            <div className="text-2xl md:text-4xl font-bold text-primary">{getScore(match, 'A')}</div>
                            <AnimatePresence>
                              {scoreUpdates[`${match._id}-A`] && (
                                <motion.div
                                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, y: -20, scale: 1 }}
                                  exit={{ opacity: 0, y: -40 }}
                                  className="absolute -top-8 left-1/2 -translate-x-1/2 text-green-400 font-bold text-xl"
                                >
                                  {scoreUpdates[`${match._id}-A`]}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="text-gray-600 text-xl md:text-2xl font-bold">-</div>
                          <div className="text-center relative">
                            <div className="text-2xl md:text-4xl font-bold text-primary">{getScore(match, 'B')}</div>
                            <AnimatePresence>
                              {scoreUpdates[`${match._id}-B`] && (
                                <motion.div
                                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, y: -20, scale: 1 }}
                                  exit={{ opacity: 0, y: -40 }}
                                  className="absolute -top-8 left-1/2 -translate-x-1/2 text-green-400 font-bold text-xl"
                                >
                                  {scoreUpdates[`${match._id}-B`]}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        
                        {/* Table Tennis Set Details */}
                        {match.game.name.toUpperCase() === 'TABLE TENNIS' && match.result?.tableTennis?.sets && (
                          <div className="flex items-center gap-1 text-xs mt-1">
                            {match.result.tableTennis.sets.map((set, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
                                  {set.teamAScore}-{set.teamBScore}
                                </span>
                                <span className="text-[10px] text-yellow-500 mt-0.5">Set {idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Team B */}
                      <div className="flex-1">
                        <p className="text-sm md:text-base font-semibold truncate">{getTeamDisplayName(match.teamB)}</p>
                        <p className="text-xs text-gray-500">{getTeamSubtitle(match.teamB)}</p>
                      </div>
                    </div>

                    {/* Live Badge and Button */}
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-semibold">LIVE</span>
                      </div>
                      <button
                        onClick={() => navigate(`/match/${match._id}`)}
                        className="px-3 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-full transition-colors text-sm font-semibold text-primary"
                      >
                        View Full Scorecard
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed Matches */}
        {!loading && scoresVisible && completedMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Completed Matches</h2>
            
            <div className="grid gap-4">
              {completedMatches.map((match, index) => (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card hover:border-primary/30 transition-all duration-300 rounded-xl p-4 md:p-6 relative overflow-hidden group"
                >
                  {/* Subtle background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Game Info */}
                    <div className="flex items-center gap-3">
                      {match.game.icon && (
                        <img src={match.game.icon} alt="" className="w-10 h-10 md:w-12 md:h-12 opacity-70" />
                      )}
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-300">{match.game.name}</h3>
                        <p className="text-sm text-gray-500">Match {match.matchNumber} • {match.round}</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-4 md:gap-8">
                      {/* Team A */}
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <p className="text-sm md:text-base font-semibold truncate">{getTeamDisplayName(match.teamA)}</p>
                          {isWinner(match, match.teamA._id) && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{getTeamSubtitle(match.teamA)}</p>
                      </div>

                      {/* Score Display */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className={`text-2xl md:text-4xl font-bold ${isWinner(match, match.teamA._id) ? 'text-yellow-500' : 'text-gray-400'}`}>
                            {getScore(match, 'A')}
                          </div>
                          <div className="text-gray-600 text-xl md:text-2xl font-bold">-</div>
                          <div className={`text-2xl md:text-4xl font-bold ${isWinner(match, match.teamB._id) ? 'text-yellow-500' : 'text-gray-400'}`}>
                            {getScore(match, 'B')}
                          </div>
                        </div>
                        
                        {/* Table Tennis Set Details */}
                        {match.game.name.toUpperCase() === 'TABLE TENNIS' && match.result?.tableTennis?.sets && (
                          <div className="flex items-center gap-1 text-xs mt-1">
                            {match.result.tableTennis.sets.map((set, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500">
                                  {set.teamAScore}-{set.teamBScore}
                                </span>
                                <span className="text-[10px] text-yellow-500 mt-0.5">Set {idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Team B */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isWinner(match, match.teamB._id) && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                          <p className="text-sm md:text-base font-semibold truncate">{getTeamDisplayName(match.teamB)}</p>
                        </div>
                        <p className="text-xs text-gray-500">{getTeamSubtitle(match.teamB)}</p>
                      </div>
                    </div>

                    {/* View Scorecard Button */}
                    <button
                      onClick={() => navigate(`/match/${match._id}`)}
                      className="px-3 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-full transition-colors text-sm font-semibold text-primary"
                    >
                      View Full Scorecard
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {liveMatches.length === 0 && completedMatches.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No matches available</p>
          </div>
        )}
      </div>

      <Footer />
      </div>
    </div>
  );
}
