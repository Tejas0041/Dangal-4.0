import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, MapPin, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import confetti from "canvas-confetti";
import Confetti from "react-confetti";
import { useLiveScores } from "@/hooks/useLiveScores";

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
  matchType?: string;
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

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreAnimation, setScoreAnimation] = useState<{
    team: 'A' | 'B';
    increment: number;
    teamName: string;
    type?: 'pointScored' | 'setWon' | 'matchWon';
    setNumber?: number;
    scoreTypes?: Array<{ type: string; value: number }>;
  } | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const animationInProgress = useRef(false);

  // Use live scores hook for real-time updates
  const liveScores = useLiveScores();

  const fetchMatch = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/schedule/${matchId}`);
      setMatch(response.data);
    } catch (error) {
      console.error('Error fetching match:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const triggerFireworks = () => {
    setShowFireworks(true);
    
    // Also trigger canvas confetti for extra effect
    const duration = 5000;
    const animationEnd = Date.now() + duration;

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        setShowFireworks(false);
        return;
      }

      const particleCount = 100;
      
      // Fireworks from bottom corners
      confetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1'],
        zIndex: 9999
      });
      confetti({
        particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1'],
        zIndex: 9999
      });

      // Random center bursts
      if (Math.random() < 0.4) {
        confetti({
          particleCount: 150,
          spread: 360,
          startVelocity: 45,
          origin: { x: randomInRange(0.3, 0.7), y: randomInRange(0.3, 0.6) },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1'],
          zIndex: 9999
        });
      }
    }, 300);
  };

  const handleMatchUpdate = useCallback((updatedMatch: Match) => {
    if (updatedMatch._id === matchId) {
      setMatch(updatedMatch);
    }
  }, [matchId]);

  const handleScoreUpdate = useCallback((data: { matchId: string; increment: number; team: 'A' | 'B'; type?: string; scoreTypes?: Array<{ type: string; value: number }> }) => {
    console.log('Score update received:', data);
    console.log('Current matchId:', matchId);
    console.log('Animation in progress:', animationInProgress.current);
    
    if (data.matchId === matchId && !animationInProgress.current) {
      console.log('Processing score update animation...');
      animationInProgress.current = true;
      
      // Fetch the latest match data to get team info
      api.get(`/api/schedule/${matchId}`).then(response => {
        const currentMatch = response.data;
        const team = data.team === 'A' ? currentMatch.teamA : currentMatch.teamB;
        
        // Build team name: "SecondName (Team A/B - Hall Name)" or "Hall Name (Team A/B)"
        let teamName = '';
        if (team.secondTeamName) {
          teamName = `${team.secondTeamName} (Team ${team.teamName} - ${team.hallId.name})`;
        } else {
          teamName = `${team.hallId.name} (Team ${team.teamName})`;
        }
        
        console.log('Setting score animation for:', teamName, '+' + data.increment);
        console.log('Animation state:', {
          team: data.team,
          increment: data.increment,
          teamName: teamName,
          type: 'pointScored',
          scoreTypes: data.scoreTypes
        });
        
        setScoreAnimation({
          team: data.team,
          increment: data.increment,
          teamName: teamName,
          type: 'pointScored',
          scoreTypes: data.scoreTypes
        });

        // Hide animation after 1.5 seconds
        setTimeout(() => {
          setScoreAnimation(null);
          animationInProgress.current = false;
        }, 1500);
      });
    }
  }, [matchId]);

  const handleSetWon = useCallback((data: { matchId: string; team: 'A' | 'B'; setNumber: number; pointIncrement?: number }) => {
    console.log('Set won received:', data);
    
    if (data.matchId === matchId && !animationInProgress.current) {
      animationInProgress.current = true;
      
      api.get(`/api/schedule/${matchId}`).then(response => {
        const currentMatch = response.data;
        const team = data.team === 'A' ? currentMatch.teamA : currentMatch.teamB;
        
        // Build team name
        let teamName = '';
        if (team.secondTeamName) {
          teamName = `${team.secondTeamName} (Team ${team.teamName} - ${team.hallId.name})`;
        } else {
          teamName = `${team.hallId.name} (Team ${team.teamName})`;
        }
        
        // First show point scored animation if there was a point increment
        if (data.pointIncrement && data.pointIncrement > 0) {
          setScoreAnimation({
            team: data.team,
            increment: data.pointIncrement,
            teamName: teamName,
            type: 'pointScored'
          });

          // After 1.5 seconds, show set won animation
          setTimeout(() => {
            triggerConfetti();
            setScoreAnimation({
              team: data.team,
              increment: 0,
              teamName: teamName,
              type: 'setWon',
              setNumber: data.setNumber
            });

            // Hide animation after 5 seconds
            setTimeout(() => {
              setScoreAnimation(null);
              animationInProgress.current = false;
            }, 5000);
          }, 1500);
        } else {
          // No point increment, just show set won
          triggerConfetti();
          setScoreAnimation({
            team: data.team,
            increment: 0,
            teamName: teamName,
            type: 'setWon',
            setNumber: data.setNumber
          });

          setTimeout(() => {
            setScoreAnimation(null);
            animationInProgress.current = false;
          }, 5000);
        }
      });
    }
  }, [matchId]);

  const handleMatchWon = useCallback((data: { matchId: string; winner: string; pointIncrement?: number; team?: 'A' | 'B'; scoreTypes?: Array<{ type: string; value: number }> }) => {
    console.log('Match won received:', data);
    
    if (data.matchId === matchId && !animationInProgress.current) {
      animationInProgress.current = true;
      
      api.get(`/api/schedule/${matchId}`).then(response => {
        const currentMatch = response.data;
        const winnerId = data.winner;
        const isTeamA = String(currentMatch.teamA._id) === String(winnerId);
        const winnerTeam = isTeamA ? currentMatch.teamA : currentMatch.teamB;
        
        // Build team name
        let teamName = '';
        if (winnerTeam.secondTeamName) {
          teamName = `${winnerTeam.secondTeamName} (Team ${winnerTeam.teamName} - ${winnerTeam.hallId.name})`;
        } else {
          teamName = `${winnerTeam.hallId.name} (Team ${winnerTeam.teamName})`;
        }
        
        // First show point scored animation if there was a point increment
        if (data.pointIncrement && data.pointIncrement > 0 && data.team) {
          setScoreAnimation({
            team: data.team,
            increment: data.pointIncrement,
            teamName: teamName,
            type: 'pointScored',
            scoreTypes: data.scoreTypes
          });

          // After 1.5 seconds, show match won animation
          setTimeout(() => {
            triggerFireworks();
            setScoreAnimation({
              team: isTeamA ? 'A' : 'B',
              increment: 0,
              teamName: teamName,
              type: 'matchWon'
            });

            // Hide animation after 5 seconds
            setTimeout(() => {
              setScoreAnimation(null);
              animationInProgress.current = false;
            }, 5000);
          }, 1500);
        } else {
          // No point increment, just show match won
          triggerFireworks();
          setScoreAnimation({
            team: isTeamA ? 'A' : 'B',
            increment: 0,
            teamName: teamName,
            type: 'matchWon'
          });

          setTimeout(() => {
            setScoreAnimation(null);
            animationInProgress.current = false;
          }, 5000);
        }
      });
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();

    // Check socket connection
    console.log('Socket connected:', socket.connected);
    console.log('Setting up socket listeners for matchId:', matchId);

    // Socket listener for real-time updates
    socket.on('matchUpdated', handleMatchUpdate);
    socket.on('scoreUpdate', handleScoreUpdate);
    socket.on('setWon', handleSetWon);
    socket.on('matchWon', handleMatchWon);

    return () => {
      console.log('Cleaning up socket listeners for matchId:', matchId);
      socket.off('matchUpdated', handleMatchUpdate);
      socket.off('scoreUpdate', handleScoreUpdate);
      socket.off('setWon', handleSetWon);
      socket.off('matchWon', handleMatchWon);
    };
  }, [matchId, handleMatchUpdate, handleScoreUpdate, handleSetWon, handleMatchWon]);

  // Update match when live scores change
  useEffect(() => {
    if (matchId && liveScores[matchId]) {
      setMatch(liveScores[matchId]);
    }
  }, [matchId, liveScores]);

  // Debug: Log when scoreAnimation changes
  useEffect(() => {
    console.log('scoreAnimation state changed:', scoreAnimation);
  }, [scoreAnimation]);

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

  const getScore = (team: 'A' | 'B') => {
    if (!match?.result) return 0;

    const gameName = match.game.name.toUpperCase();
    
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

  const isWinner = (teamId: string) => {
    if (!match?.result?.winner) return false;
    const winnerId = typeof match.result.winner === 'string' 
      ? match.result.winner 
      : match.result.winner._id;
    return String(winnerId) === String(teamId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary text-xl">Loading match details...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Match not found</div>
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
      
      {/* Fireworks Effect */}
      {showFireworks && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={true}
          numberOfPieces={200}
          gravity={0.25}
          colors={['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1', '#FFFFFF']}
        />
      )}
      
      <div className="relative z-10">
        <Navbar />
      
        <div className="container mx-auto px-4 py-8 mt-20">
        {/* Back Button */}
        <button
          onClick={() => navigate('/scores')}
          className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Scores
        </button>

        {/* Match Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            {match.game.icon && (
              <img src={match.game.icon} alt="" className="w-20 h-20" />
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary">{match.game.name}</h1>
              <p className="text-gray-400 text-lg">Match {match.matchNumber} • {match.round}</p>
              {match.matchType && (
                <p className="text-gray-500 text-sm">{match.matchType}</p>
              )}
            </div>
          </div>
          
          {match.status === 'Live' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-semibold">LIVE</span>
            </div>
          )}
        </motion.div>

        {/* Teams and Score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto mb-12"
        >
          {/* Desktop View - Side by Side */}
          <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
            {/* Team A */}
            <div className="glass-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center p-8 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="text-8xl font-bold text-primary mb-4 text-glow">{getScore('A')}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{getTeamDisplayName(match.teamA)}</h2>
                  {isWinner(match.teamA._id) && (
                    <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
                  )}
                </div>
                <p className="text-gray-400">{getTeamSubtitle(match.teamA)}</p>
              </div>
            </div>

            {/* VS Icon */}
            <div className="flex items-center justify-center">
              <img src="/vs.webp" alt="VS" className="w-16 h-16 opacity-60 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
            </div>

            {/* Team B */}
            <div className="glass-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center p-8 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="text-8xl font-bold text-primary mb-4 text-glow">{getScore('B')}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{getTeamDisplayName(match.teamB)}</h2>
                  {isWinner(match.teamB._id) && (
                    <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
                  )}
                </div>
                <p className="text-gray-400">{getTeamSubtitle(match.teamB)}</p>
              </div>
            </div>
          </div>

          {/* Mobile View - Stacked */}
          <div className="md:hidden space-y-6">
            {/* Team A */}
            <div className="glass-card flex items-center justify-between p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold">{getTeamDisplayName(match.teamA)}</h2>
                  {isWinner(match.teamA._id) && (
                    <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
                  )}
                </div>
                <p className="text-gray-400">{getTeamSubtitle(match.teamA)}</p>
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary text-glow">{getScore('A')}</div>
            </div>

            {/* VS */}
            <div className="text-center text-gray-600 font-bold text-2xl">
              <img src="/vs.webp" alt="VS" className="w-16 h-16 mx-auto opacity-60 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
            </div>

            {/* Team B */}
            <div className="glass-card flex items-center justify-between p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold">{getTeamDisplayName(match.teamB)}</h2>
                  {isWinner(match.teamB._id) && (
                    <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
                  )}
                </div>
                <p className="text-gray-400">{getTeamSubtitle(match.teamB)}</p>
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary text-glow">{getScore('B')}</div>
            </div>
          </div>

          {/* Table Tennis Current Set Score */}
          {match.game.name.toUpperCase() === 'TABLE TENNIS' && match.result?.tableTennis?.sets && match.result.tableTennis.sets.length > 0 && match.status === 'Live' && (
            <div className="mt-8 glass-card p-6 rounded-xl relative overflow-hidden group max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <p className="text-center text-gray-400 text-sm mb-3">Current Set Score</p>
                <div className="flex items-center justify-center gap-6">
                  {(() => {
                    // Find the current active set (first set without a winner)
                    const currentSet = match.result.tableTennis.sets.find(set => !set.winner) || match.result.tableTennis.sets[match.result.tableTennis.sets.length - 1];
                    if (!currentSet) return null;
                    
                    const winningScore = match.matchType === 'Doubles' ? 15 : 11;
                    const isDeuceRange = currentSet.teamAScore >= winningScore - 1 && currentSet.teamBScore >= winningScore - 1;
                    const isDeuce = isDeuceRange && Math.abs(currentSet.teamAScore - currentSet.teamBScore) < 2;
                    
                    return (
                      <>
                        <div className="text-5xl font-bold text-primary text-glow">{currentSet.teamAScore || 0}</div>
                        <div className="text-gray-600 text-3xl">-</div>
                        <div className="text-5xl font-bold text-primary text-glow">{currentSet.teamBScore || 0}</div>
                        {isDeuce && (
                          <div className="ml-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full animate-pulse">
                            <span className="text-yellow-500 font-bold text-sm">DEUCE</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <p className="text-center text-gray-500 text-xs mt-3">
                  Playing to {match.matchType === 'Doubles' ? '15' : '11'} points
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Match Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          <div className="glass-card p-4 rounded-xl hover:border-primary/30 transition-all duration-300 flex flex-col">
            <p className="text-gray-400 mb-2 text-sm">Round</p>
            <p className="text-xl font-semibold text-primary break-words">{match.round}</p>
          </div>
          <div className="glass-card p-4 rounded-xl hover:border-primary/30 transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">Time</p>
            </div>
            <p className="text-xl font-semibold text-primary">{formatTime(match.time)}</p>
          </div>
          <div className="glass-card p-4 rounded-xl hover:border-primary/30 transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">Venue</p>
            </div>
            <p className="text-xl font-semibold text-primary break-words">{match.venue}</p>
          </div>
        </motion.div>

        {/* Detailed Scoring */}
        {match.game.name.toUpperCase() === 'TABLE TENNIS' && match.result?.tableTennis?.sets && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-primary mb-6">Set-wise Scores</h3>
            <div className="space-y-4">
              {match.result.tableTennis.sets.map((set, index) => (
                <div key={index} className="glass-card flex items-center justify-between p-6 rounded-xl hover:border-primary/30 transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative z-10 text-gray-400 font-semibold text-lg">Set {index + 1}</span>
                  <div className="relative z-10 flex items-center gap-6">
                    <span className={`text-3xl font-bold ${set.winner === match.teamA._id ? 'text-primary text-glow' : 'text-gray-400'}`}>
                      {set.teamAScore}
                    </span>
                    <span className="text-gray-600 text-2xl">-</span>
                    <span className={`text-3xl font-bold ${set.winner === match.teamB._id ? 'text-primary text-glow' : 'text-gray-400'}`}>
                      {set.teamBScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tug of War Winner */}
        {match.game.name.toUpperCase() === 'TUG OF WAR' && match.status === 'Completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto glass-card p-8 rounded-xl text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-400/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400 text-lg mb-3">Winner</p>
              <p className="text-3xl font-bold text-yellow-500 mb-2 text-glow">
                {isWinner(match.teamA._id) 
                  ? getTeamDisplayName(match.teamA)
                  : getTeamDisplayName(match.teamB)
                }
              </p>
              <p className="text-gray-400">
                {isWinner(match.teamA._id) 
                  ? getTeamSubtitle(match.teamA)
                  : getTeamSubtitle(match.teamB)
                }
              </p>
            </div>
          </motion.div>
        )}

      </div>

      {/* Score Animation Overlay */}
      <AnimatePresence>
        {scoreAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            {/* Blurred Background */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
            
            {/* Score Update Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-4 border-primary rounded-3xl p-16 shadow-2xl"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-yellow-400/30 to-primary/30 blur-2xl -z-10"></div>
              
              <div className="text-center space-y-6">
                {/* Point Scored */}
                {scoreAnimation.type === 'pointScored' && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="text-9xl md:text-[10rem] font-black bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent"
                    >
                      +{scoreAnimation.increment}
                    </motion.div>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-3"
                    >
                      {/* Show score types for Kabaddi */}
                      {scoreAnimation.scoreTypes && scoreAnimation.scoreTypes.length > 0 ? (
                        <>
                          <div className="space-y-1">
                            {scoreAnimation.scoreTypes.map((scoreType, index) => (
                              <p key={index} className="text-2xl md:text-3xl font-semibold text-yellow-400 uppercase tracking-wider">
                                {scoreType.type}
                              </p>
                            ))}
                          </div>
                          <p className="text-3xl md:text-4xl font-bold text-white mt-4">
                            {scoreAnimation.teamName}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xl md:text-2xl font-semibold text-primary uppercase tracking-wider">
                            {scoreAnimation.increment === 1 ? 'Point Scored!' : 'Points Scored!'}
                          </p>
                          <p className="text-3xl md:text-4xl font-bold text-white">
                            {scoreAnimation.teamName}
                          </p>
                        </>
                      )}
                    </motion.div>
                  </>
                )}

                {/* Set Won */}
                {scoreAnimation.type === 'setWon' && (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="flex justify-center mb-6"
                    >
                      <Trophy className="w-32 h-32 text-yellow-500" />
                    </motion.div>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4"
                    >
                      <p className="text-4xl md:text-5xl font-bold text-white">
                        {scoreAnimation.teamName}
                      </p>
                      <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
                        Won Set {scoreAnimation.setNumber}!
                      </p>
                    </motion.div>
                  </>
                )}

                {/* Match Won */}
                {scoreAnimation.type === 'matchWon' && (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="flex justify-center mb-6"
                    >
                      <Trophy className="w-40 h-40 text-yellow-500" />
                    </motion.div>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4"
                    >
                      <p className="text-2xl md:text-3xl font-semibold text-primary uppercase tracking-wider">
                        Victory!
                      </p>
                      <p className="text-5xl md:text-6xl font-black text-white">
                        {scoreAnimation.teamName}
                      </p>
                      <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
                        Wins the Match!
                      </p>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      </div>
    </div>
  );
}
