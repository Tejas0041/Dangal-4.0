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
      games: Array<{
        type: 'Single' | 'Double';
        teamAScore: number;
        teamBScore: number;
        maxScore: number;
        winner?: string;
      }>;
      gamesWonA: number;
      gamesWonB: number;
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
    type?: 'pointScored' | 'setWon' | 'roundWon' | 'matchWon';
    setNumber?: number;
    roundNumber?: number;
    gameType?: string;
    scoreTypes?: Array<{ type: string; value: number }>;
  } | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const animationInProgress = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateRef = useRef<{ minutes: number; seconds: number; centiseconds: number } | null>(null);

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

  const handleSetWon = useCallback((data: { matchId: string; team: 'A' | 'B'; setNumber: number; pointIncrement?: number; gameType?: string }) => {
    console.log('=== SET WON EVENT RECEIVED ===');
    console.log('Full data:', data);
    console.log('Current matchId:', matchId);
    console.log('Animation in progress:', animationInProgress.current);
    
    if (data.matchId === matchId && !animationInProgress.current) {
      console.log('Processing set won animation...');
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
        
        console.log('Team name:', teamName);
        console.log('Point increment:', data.pointIncrement);
        console.log('Game type:', data.gameType);
        
        // Show point scored animation first (1.5 seconds)
        if (data.pointIncrement && data.pointIncrement > 0) {
          console.log('Showing point scored animation first');
          setScoreAnimation({
            team: data.team,
            increment: data.pointIncrement,
            teamName: teamName,
            type: 'pointScored'
          });

          // After 1.5 seconds, show set won animation (3 seconds)
          setTimeout(() => {
            console.log('Now showing set won animation');
            triggerConfetti();
            setScoreAnimation({
              team: data.team,
              increment: 0,
              teamName: teamName,
              type: 'setWon',
              setNumber: data.setNumber,
              gameType: data.gameType
            });

            // Hide animation after 3 seconds
            setTimeout(() => {
              console.log('Hiding set won animation');
              setScoreAnimation(null);
              animationInProgress.current = false;
            }, 3000);
          }, 1500);
        } else {
          // No point increment, just show set won (3 seconds)
          console.log('Showing set won animation directly (no point increment)');
          triggerConfetti();
          setScoreAnimation({
            team: data.team,
            increment: 0,
            teamName: teamName,
            type: 'setWon',
            setNumber: data.setNumber,
            gameType: data.gameType
          });

          setTimeout(() => {
            console.log('Hiding set won animation');
            setScoreAnimation(null);
            animationInProgress.current = false;
          }, 3000);
        }
      }).catch(error => {
        console.error('Error fetching match data:', error);
        animationInProgress.current = false;
      });
    } else {
      console.log('Skipping animation - matchId mismatch or animation in progress');
    }
  }, [matchId]);

  const handleRoundWon = useCallback((data: { matchId: string; team: 'A' | 'B'; roundNumber: number }) => {
    console.log('=== ROUND WON EVENT RECEIVED ===', data);
    
    if (data.matchId === matchId && !animationInProgress.current) {
      console.log('Processing round won animation...');
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
        
        console.log('Showing round won animation');
        triggerConfetti();
        setScoreAnimation({
          team: data.team,
          increment: 0,
          teamName: teamName,
          type: 'roundWon',
          roundNumber: data.roundNumber
        });

        // Hide animation after 3 seconds
        setTimeout(() => {
          console.log('Hiding round won animation');
          setScoreAnimation(null);
          animationInProgress.current = false;
        }, 3000);
      }).catch(error => {
        console.error('Error fetching match data:', error);
        animationInProgress.current = false;
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
        
        // Show match won animation (5 seconds)
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
      });
    }
  }, [matchId]);

  useEffect(() => {
    // Only fetch on initial mount
    fetchMatch();
  }, [matchId]); // Only re-fetch when matchId changes

  useEffect(() => {
    // Connect to socket if not connected
    if (!socket.connected) {
      console.log('MatchDetail: Socket not connected, connecting...');
      socket.connect();
    }

    // Join the live-scores room
    socket.emit('join-scores');
    console.log('MatchDetail: Joined live-scores room');
    console.log('MatchDetail: Setting up socket listeners for matchId:', matchId);
    console.log('MatchDetail: Socket connected:', socket.connected);

    // Socket listener for real-time updates
    socket.on('matchUpdated', handleMatchUpdate);
    socket.on('scoreUpdate', handleScoreUpdate);
    socket.on('setWon', (data) => {
      console.log('=== setWon event received by socket listener ===', data);
      handleSetWon(data);
    });
    socket.on('roundWon', (data) => {
      console.log('=== roundWon event received by socket listener ===', data);
      handleRoundWon(data);
    });
    socket.on('matchWon', handleMatchWon);
    socket.on('timerUpdate', (data) => {
      console.log('Timer update received:', data);
      if (data.matchId === matchId) {
        setMatch(prev => {
          if (!prev) return null;
          return {
            ...prev,
            result: {
              ...prev.result,
              kabaddi: {
                ...prev.result?.kabaddi,
                timer: data.timer
              }
            }
          };
        });
      }
    });
    socket.on('halfEnded', (data) => {
      if (data.matchId === matchId) {
        // Match will be updated via matchUpdated event, no need to fetch
        console.log('Half ended, waiting for matchUpdated event');
      }
    });

    return () => {
      console.log('MatchDetail: Cleaning up socket listeners for matchId:', matchId);
      socket.off('matchUpdated', handleMatchUpdate);
      socket.off('scoreUpdate', handleScoreUpdate);
      socket.off('setWon', handleSetWon);
      socket.off('roundWon', handleRoundWon);
      socket.off('matchWon', handleMatchWon);
      socket.off('timerUpdate');
      socket.off('halfEnded');
      socket.emit('leave-scores');
      console.log('MatchDetail: Left live-scores room');
    };
  }, [matchId, handleMatchUpdate, handleScoreUpdate, handleSetWon, handleRoundWon, handleMatchWon]);

  // Keyboard listener for fullscreen toggle (F key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  // Client-side timer countdown for Kabaddi
  useEffect(() => {
    if (match?.game.name.toUpperCase() === 'KABADDI' && match.result?.kabaddi?.timer?.isRunning) {
      // Initialize timer state ref if not already set or if timer values changed from socket
      const currentTimer = match.result.kabaddi.timer;
      if (!timerStateRef.current || 
          timerStateRef.current.minutes !== currentTimer.minutes ||
          timerStateRef.current.seconds !== currentTimer.seconds ||
          Math.abs(timerStateRef.current.centiseconds - currentTimer.centiseconds) > 5) {
        timerStateRef.current = {
          minutes: currentTimer.minutes,
          seconds: currentTimer.seconds,
          centiseconds: currentTimer.centiseconds
        };
      }

      // Only create interval if one doesn't exist
      if (!timerIntervalRef.current) {
        // Start countdown
        timerIntervalRef.current = setInterval(() => {
          if (!timerStateRef.current) return;
          
          let newCentiseconds = timerStateRef.current.centiseconds - 1;
          let newSeconds = timerStateRef.current.seconds;
          let newMinutes = timerStateRef.current.minutes;

          if (newCentiseconds < 0) {
            newCentiseconds = 99;
            newSeconds -= 1;
          }

          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes -= 1;
          }

          // Stop at 0
          if (newMinutes < 0) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            timerStateRef.current = { minutes: 0, seconds: 0, centiseconds: 0 };
            setMatch(prev => {
              if (!prev || !prev.result?.kabaddi?.timer) return prev;
              return {
                ...prev,
                result: {
                  ...prev.result,
                  kabaddi: {
                    ...prev.result.kabaddi,
                    timer: {
                      ...prev.result.kabaddi.timer,
                      minutes: 0,
                      seconds: 0,
                      centiseconds: 0,
                      isRunning: false
                    }
                  }
                }
              };
            });
            return;
          }

          // Update ref
          timerStateRef.current = {
            minutes: newMinutes,
            seconds: newSeconds,
            centiseconds: newCentiseconds
          };

          // Update state for display
          setMatch(prev => {
            if (!prev || !prev.result?.kabaddi?.timer) return prev;
            return {
              ...prev,
              result: {
                ...prev.result,
                kabaddi: {
                  ...prev.result.kabaddi,
                  timer: {
                    ...prev.result.kabaddi.timer,
                    minutes: newMinutes,
                    seconds: newSeconds,
                    centiseconds: newCentiseconds,
                    isRunning: true
                  }
                }
              }
            };
          });
        }, 10); // Update every 10ms (centisecond)
      }

      return () => {
        // Don't clear interval on every render, only when component unmounts or timer stops
      };
    } else {
      // Timer is not running, clear interval and ref
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      timerStateRef.current = null;
    }
  }, [match?.result?.kabaddi?.timer?.isRunning, match?.result?.kabaddi?.timer?.minutes, match?.result?.kabaddi?.timer?.seconds]);

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
      return (teamScore.raidPoints || 0) + (teamScore.tacklePoints || 0) + 
             (teamScore.bonusPoints || 0) + (teamScore.allOutPoints || 0) + 
             (teamScore.extraPoints || 0);
    }
    
    if (gameName === 'TABLE TENNIS') {
      const isLeague = match.round === 'League Stage';
      
      if (isLeague) {
        // For league, show games won (5 games total)
        return team === 'A' ? (match.result.tableTennis?.gamesWonA || 0) : (match.result.tableTennis?.gamesWonB || 0);
      } else {
        // For non-league, calculate rounds won (5 rounds, each with 3 sets)
        const games = match.result.tableTennis?.games || [];
        const teamId = team === 'A' ? match.teamA._id : match.teamB._id;
        let roundsWon = 0;
        
        // Check each of the 5 rounds
        for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
          const startIndex = roundIndex * 3;
          const endIndex = Math.min(startIndex + 3, games.length);
          
          // Count sets won in this round
          let setsWonInRound = 0;
          for (let i = startIndex; i < endIndex; i++) {
            if (games[i] && String(games[i].winner) === String(teamId)) {
              setsWonInRound++;
            }
          }
          
          // If won 2 or more sets in this round, won the round
          if (setsWonInRound >= 2) {
            roundsWon++;
          }
        }
        
        return roundsWon;
      }
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
        {!isFullscreen && <Navbar />}
      
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
          {/* Mobile: Icon above game name */}
          <div className="flex md:hidden flex-col items-center justify-center gap-4 mb-6">
            {match.game.icon && (
              <img src={match.game.icon} alt="" className="w-20 h-20" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-primary">{match.game.name}</h1>
              <p className="text-gray-400 text-lg">Match {match.matchNumber} • {match.round}</p>
              {match.matchType && (
                <p className="text-gray-500 text-sm">{match.matchType}</p>
              )}
            </div>
          </div>

          {/* Desktop: Icon left to game name */}
          <div className="hidden md:flex items-start justify-center gap-4 mb-6">
            {match.game.icon && (
              <img src={match.game.icon} alt="" className="w-12 h-12 mt-2" />
            )}
            <div>
              <h1 className="text-5xl font-bold text-primary">{match.game.name}</h1>
              <p className="text-gray-400 text-lg">Match {match.matchNumber} • {match.round}</p>
              {match.matchType && (
                <p className="text-gray-500 text-sm">{match.matchType}</p>
              )}
            </div>
          </div>
          
          {/* Winner Message - Shows when match is completed */}
          {match.status === 'Completed' && match.result?.winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500/20 via-yellow-400/20 to-yellow-500/20 border-2 border-yellow-500/50 rounded-full"
            >
              <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
              <span className="text-yellow-500 font-bold text-lg">
                {(() => {
                  const winnerId = typeof match.result.winner === 'string' 
                    ? match.result.winner 
                    : match.result.winner._id;
                  const isTeamA = String(match.teamA._id) === String(winnerId);
                  const winnerTeam = isTeamA ? match.teamA : match.teamB;
                  
                  if (winnerTeam.secondTeamName) {
                    return `${winnerTeam.secondTeamName} (${winnerTeam.hallId.name} - Team ${winnerTeam.teamName}) won the match`;
                  }
                  return `${winnerTeam.hallId.name} (Team ${winnerTeam.teamName}) won the match`;
                })()}
              </span>
            </motion.div>
          )}
          
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
          <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-8 items-stretch">
            {/* Team A */}
            <div className="glass-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center p-8 rounded-xl relative overflow-hidden group min-h-[320px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
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
            <div className="glass-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center p-8 rounded-xl relative overflow-hidden group min-h-[320px]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
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

          {/* Mobile View - Side by Side */}
          <div className="md:hidden">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4">
              {/* Team A */}
              <div className="glass-card flex flex-col items-center justify-center p-4 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center w-full">
                  <div className="text-5xl font-bold text-primary mb-2 text-glow">{getScore('A')}</div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <h2 className="text-lg font-bold truncate">{getTeamDisplayName(match.teamA)}</h2>
                    {isWinner(match.teamA._id) && (
                      <Trophy className="w-4 h-4 text-yellow-500 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs truncate">{getTeamSubtitle(match.teamA)}</p>
                </div>
              </div>

              {/* VS Icon */}
              <div className="flex items-center justify-center flex-shrink-0">
                <img src="/vs.webp" alt="VS" className="w-12 h-12 opacity-60 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              </div>

              {/* Team B */}
              <div className="glass-card flex flex-col items-center justify-center p-4 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center w-full">
                  <div className="text-5xl font-bold text-primary mb-2 text-glow">{getScore('B')}</div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <h2 className="text-lg font-bold truncate">{getTeamDisplayName(match.teamB)}</h2>
                    {isWinner(match.teamB._id) && (
                      <Trophy className="w-4 h-4 text-yellow-500 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs truncate">{getTeamSubtitle(match.teamB)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kabaddi Timer and Half-Time Scores */}
          {match.game.name.toUpperCase() === 'KABADDI' && (
            <div className="mt-8">
              {/* Timer Display - Only for Live matches and when visible */}
              {match.status === 'Live' && match.result?.kabaddi?.timer && match.result.kabaddi.timer.isVisible !== false && (
                <div className="glass-card p-6 rounded-xl mb-6" style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(255, 215, 0, 0.1) 100%)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)'
                }}>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-3 font-semibold tracking-wider">
                      {match.result.kabaddi.currentHalf === 1 ? '1ST HALF' : '2ND HALF'}
                    </p>
                    <div className="flex items-center justify-center gap-1" style={{
                      fontFamily: '"Courier New", Courier, monospace',
                      fontSize: 'clamp(3rem, 8vw, 5rem)',
                      fontWeight: 'bold',
                      color: '#FFD700',
                      textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)',
                      letterSpacing: '0.05em'
                    }}>
                      <span style={{ display: 'inline-block', minWidth: '1.2em', textAlign: 'center' }}>
                        {String(match.result.kabaddi.timer.minutes).padStart(2, '0')}
                      </span>
                      <span style={{ opacity: 0.7 }}>:</span>
                      <span style={{ display: 'inline-block', minWidth: '1.2em', textAlign: 'center' }}>
                        {String(match.result.kabaddi.timer.seconds).padStart(2, '0')}
                      </span>
                      <span style={{ 
                        fontSize: '0.6em', 
                        opacity: 0.5,
                        display: 'inline-block',
                        minWidth: '0.5em'
                      }}>:</span>
                      <span style={{ 
                        fontSize: '0.6em',
                        opacity: 0.7,
                        display: 'inline-block',
                        minWidth: '1.2em',
                        textAlign: 'center'
                      }}>
                        {String(match.result.kabaddi.timer.centiseconds).padStart(2, '0')}
                      </span>
                    </div>
                    {match.result.kabaddi.timer.minutes === 0 && 
                     match.result.kabaddi.timer.seconds === 0 && 
                     match.result.kabaddi.timer.centiseconds === 0 && (
                      <p className="text-red-500 font-bold text-xl mt-3 animate-pulse tracking-wider">
                        ⚠ LAST RAID ⚠
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Half-Time Scores - Only if halfTimeScores exist and have non-zero values */}
              {match.result?.kabaddi?.halfTimeScores && 
               match.result.kabaddi.halfTimeScores.teamAScore && 
               match.result.kabaddi.halfTimeScores.teamBScore && 
               (() => {
                 const htA = match.result.kabaddi.halfTimeScores.teamAScore;
                 const htB = match.result.kabaddi.halfTimeScores.teamBScore;
                 const totalA = (htA.raidPoints || 0) + (htA.tacklePoints || 0) + (htA.bonusPoints || 0) + 
                                (htA.allOutPoints || 0) + (htA.extraPoints || 0);
                 const totalB = (htB.raidPoints || 0) + (htB.tacklePoints || 0) + (htB.bonusPoints || 0) + 
                                (htB.allOutPoints || 0) + (htB.extraPoints || 0);
                 return totalA > 0 || totalB > 0; // Only show if at least one team has non-zero half-time score
               })() && (
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-primary mb-4 text-center">Half-Time Score</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">{getTeamDisplayName(match.teamA)}</p>
                      <p className="text-3xl font-bold text-primary">
                        {(() => {
                          const ht = match.result.kabaddi.halfTimeScores.teamAScore;
                          return (ht.raidPoints || 0) + (ht.tacklePoints || 0) + (ht.bonusPoints || 0) + 
                                 (ht.allOutPoints || 0) + (ht.extraPoints || 0);
                        })()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">{getTeamDisplayName(match.teamB)}</p>
                      <p className="text-3xl font-bold text-primary">
                        {(() => {
                          const ht = match.result.kabaddi.halfTimeScores.teamBScore;
                          return (ht.raidPoints || 0) + (ht.tacklePoints || 0) + (ht.bonusPoints || 0) + 
                                 (ht.allOutPoints || 0) + (ht.extraPoints || 0);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table Tennis Current Game Score */}
          {match.game.name.toUpperCase() === 'TABLE TENNIS' && match.result?.tableTennis?.games && match.result.tableTennis.games.length > 0 && match.status === 'Live' && (
            <div className="mt-8 glass-card p-6 rounded-xl relative overflow-hidden group max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                {(() => {
                  const isLeague = match.round === 'League Stage';
                  
                  // Calculate the actual active game index based on round completion
                  let activeGameIndex = 0;
                  
                  if (isLeague) {
                    // For league, just find first game without winner
                    const foundIndex = match.result.tableTennis.games.findIndex(game => !game.winner);
                    activeGameIndex = foundIndex !== -1 ? foundIndex : match.result.tableTennis.games.length - 1;
                  } else {
                    // For non-league, check each round and skip completed rounds
                    let found = false;
                    for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                      const startIndex = roundIndex * 3;
                      const endIndex = Math.min(startIndex + 3, match.result.tableTennis.games.length);
                      
                      // Count wins in this round
                      let winsA = 0;
                      let winsB = 0;
                      for (let i = startIndex; i < endIndex; i++) {
                        if (match.result.tableTennis.games[i]?.winner === match.teamA._id) winsA++;
                        if (match.result.tableTennis.games[i]?.winner === match.teamB._id) winsB++;
                      }
                      
                      // If round is not completed (neither team has 2 wins), find first game without winner in this round
                      if (winsA < 2 && winsB < 2) {
                        for (let i = startIndex; i < endIndex; i++) {
                          if (!match.result.tableTennis.games[i]?.winner) {
                            activeGameIndex = i;
                            found = true;
                            break;
                          }
                        }
                        if (found) break;
                      }
                    }
                    
                    // If no active game found, use last game
                    if (!found) {
                      activeGameIndex = match.result.tableTennis.games.length - 1;
                    }
                  }
                  
                  const currentGame = match.result.tableTennis.games[activeGameIndex];
                  if (!currentGame) return null;
                  
                  const gameNumber = activeGameIndex + 1; // 1-indexed
                  
                  return (
                    <>
                      <p className="text-center text-gray-400 text-sm mb-3">
                        Current Round Score ({(() => {
                          if (isLeague) {
                            return `Round ${gameNumber}`;
                          } else {
                            // For non-league, calculate round and set (3 sets per round)
                            const roundNum = Math.floor((gameNumber - 1) / 3) + 1;
                            const setNum = ((gameNumber - 1) % 3) + 1;
                            return `Round ${roundNum} - Set ${setNum}`;
                          }
                        })()} - {currentGame.type})
                      </p>
                    </>
                  );
                })()}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-6">
                    {(() => {
                      const isLeague = match.round === 'League Stage';
                      
                      // Use same logic to find active game
                      let activeGameIndex = 0;
                      
                      if (isLeague) {
                        const foundIndex = match.result.tableTennis.games.findIndex(game => !game.winner);
                        activeGameIndex = foundIndex !== -1 ? foundIndex : match.result.tableTennis.games.length - 1;
                      } else {
                        let found = false;
                        for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                          const startIndex = roundIndex * 3;
                          const endIndex = Math.min(startIndex + 3, match.result.tableTennis.games.length);
                          
                          let winsA = 0;
                          let winsB = 0;
                          for (let i = startIndex; i < endIndex; i++) {
                            if (match.result.tableTennis.games[i]?.winner === match.teamA._id) winsA++;
                            if (match.result.tableTennis.games[i]?.winner === match.teamB._id) winsB++;
                          }
                          
                          if (winsA < 2 && winsB < 2) {
                            for (let i = startIndex; i < endIndex; i++) {
                              if (!match.result.tableTennis.games[i]?.winner) {
                                activeGameIndex = i;
                                found = true;
                                break;
                              }
                            }
                            if (found) break;
                          }
                        }
                        
                        if (!found) {
                          activeGameIndex = match.result.tableTennis.games.length - 1;
                        }
                      }
                      
                      const currentGame = match.result.tableTennis.games[activeGameIndex];
                      if (!currentGame) return null;
                      
                      return (
                        <>
                          <div className="text-5xl font-bold text-primary text-glow">{currentGame.teamAScore || 0}</div>
                          <div className="text-gray-600 text-3xl">-</div>
                          <div className="text-5xl font-bold text-primary text-glow">{currentGame.teamBScore || 0}</div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* DEUCE indicator below scores */}
                  {(() => {
                    const isLeague = match.round === 'League Stage';
                    
                    // Use same logic to find active game
                    let activeGameIndex = 0;
                    
                    if (isLeague) {
                      const foundIndex = match.result.tableTennis.games.findIndex(game => !game.winner);
                      activeGameIndex = foundIndex !== -1 ? foundIndex : match.result.tableTennis.games.length - 1;
                    } else {
                      let found = false;
                      for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                        const startIndex = roundIndex * 3;
                        const endIndex = Math.min(startIndex + 3, match.result.tableTennis.games.length);
                        
                        let winsA = 0;
                        let winsB = 0;
                        for (let i = startIndex; i < endIndex; i++) {
                          if (match.result.tableTennis.games[i]?.winner === match.teamA._id) winsA++;
                          if (match.result.tableTennis.games[i]?.winner === match.teamB._id) winsB++;
                        }
                        
                        if (winsA < 2 && winsB < 2) {
                          for (let i = startIndex; i < endIndex; i++) {
                            if (!match.result.tableTennis.games[i]?.winner) {
                              activeGameIndex = i;
                              found = true;
                              break;
                            }
                          }
                          if (found) break;
                        }
                      }
                      
                      if (!found) {
                        activeGameIndex = match.result.tableTennis.games.length - 1;
                      }
                    }
                    
                    const currentGame = match.result.tableTennis.games[activeGameIndex];
                    if (!currentGame) return null;
                    
                    const winningScore = currentGame.maxScore;
                    const isDeuceRange = currentGame.teamAScore >= winningScore - 1 && currentGame.teamBScore >= winningScore - 1;
                    const isDeuce = isDeuceRange && Math.abs(currentGame.teamAScore - currentGame.teamBScore) < 2;
                    
                    if (isDeuce) {
                      return (
                        <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full animate-pulse">
                          <span className="text-yellow-500 font-bold text-sm">DEUCE</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <p className="text-center text-gray-500 text-xs mt-3">
                  Playing to {(() => {
                    const isLeague = match.round === 'League Stage';
                    
                    // Use same logic to find active game
                    let activeGameIndex = 0;
                    
                    if (isLeague) {
                      const foundIndex = match.result.tableTennis.games.findIndex(game => !game.winner);
                      activeGameIndex = foundIndex !== -1 ? foundIndex : match.result.tableTennis.games.length - 1;
                    } else {
                      let found = false;
                      for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                        const startIndex = roundIndex * 3;
                        const endIndex = Math.min(startIndex + 3, match.result.tableTennis.games.length);
                        
                        let winsA = 0;
                        let winsB = 0;
                        for (let i = startIndex; i < endIndex; i++) {
                          if (match.result.tableTennis.games[i]?.winner === match.teamA._id) winsA++;
                          if (match.result.tableTennis.games[i]?.winner === match.teamB._id) winsB++;
                        }
                        
                        if (winsA < 2 && winsB < 2) {
                          for (let i = startIndex; i < endIndex; i++) {
                            if (!match.result.tableTennis.games[i]?.winner) {
                              activeGameIndex = i;
                              found = true;
                              break;
                            }
                          }
                          if (found) break;
                        }
                      }
                      
                      if (!found) {
                        activeGameIndex = match.result.tableTennis.games.length - 1;
                      }
                    }
                    
                    const currentGame = match.result.tableTennis.games[activeGameIndex];
                    return currentGame?.maxScore || 11;
                  })()} points
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
        {match.game.name.toUpperCase() === 'TABLE TENNIS' && match.result?.tableTennis?.games && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-primary mb-6">Round-wise Scores</h3>
            <div className="space-y-4">
              {(() => {
                const isLeague = match.round === 'League Stage';
                const roundPattern = ['Single', 'Double', 'Single', 'Double', 'Single'];
                
                // Group games by rounds
                const groupedRounds = roundPattern.map((type, roundIndex) => {
                  if (isLeague) {
                    // League: 1 set per round
                    return {
                      roundNumber: roundIndex + 1,
                      type: type,
                      sets: [match.result.tableTennis.games[roundIndex]]
                    };
                  } else {
                    // Non-league: 3 sets per round
                    const startIndex = roundIndex * 3;
                    return {
                      roundNumber: roundIndex + 1,
                      type: type,
                      sets: match.result.tableTennis.games.slice(startIndex, startIndex + 3)
                    };
                  }
                });
                
                return groupedRounds.map((round, roundIndex) => {
                  if (!round.sets || round.sets.length === 0 || !round.sets[0]) return null;
                  
                  // For league matches, show compact single-row layout
                  if (isLeague) {
                    const set = round.sets[0];
                    return (
                      <div key={roundIndex} className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Single row layout for league */}
                        <div className="relative z-10 flex items-center justify-between">
                          {/* Left: Round number and type */}
                          <div className="flex items-center gap-3">
                            <span className="text-primary font-bold text-xl">Round {round.roundNumber}</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              round.type === 'Single' 
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}>
                              {round.type}
                            </span>
                          </div>
                          
                          {/* Right: Scores */}
                          <div className="flex items-center gap-6">
                            <span className={`text-3xl font-bold ${set.winner === match.teamA._id ? 'text-primary text-glow' : 'text-gray-400'}`}>
                              {set.teamAScore}
                            </span>
                            <span className="text-gray-600 text-2xl">-</span>
                            <span className={`text-3xl font-bold ${set.winner === match.teamB._id ? 'text-primary text-glow' : 'text-gray-400'}`}>
                              {set.teamBScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // For non-league matches, show expanded layout with sets
                  return (
                    <div key={roundIndex} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Round Header */}
                      <div className="relative z-10 flex items-center gap-3 mb-4 pb-3 border-b border-primary/20 flex-wrap">
                        <span className="text-primary font-bold text-xl">Round {round.roundNumber}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          round.type === 'Single' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {round.type}
                        </span>
                        {/* Round Winner Badge for non-league completed rounds */}
                        {(() => {
                          // Count sets won in this round
                          let setsWonA = 0;
                          let setsWonB = 0;
                          round.sets.forEach(set => {
                            if (set && set.winner === match.teamA._id) setsWonA++;
                            if (set && set.winner === match.teamB._id) setsWonB++;
                          });
                          
                          if (setsWonA >= 2 || setsWonB >= 2) {
                            const roundWinner = setsWonA >= 2 ? match.teamA : match.teamB;
                            const winnerName = roundWinner.secondTeamName || roundWinner.hallId.name;
                            return (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                                Won by {winnerName}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      {/* Sets in this round */}
                      <div className="relative z-10 space-y-3">
                        {round.sets.map((set, setIndex) => {
                          if (!set) return null;
                          
                          return (
                            <div key={setIndex} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3">
                                {!isLeague && (
                                  <span className="text-gray-400 font-semibold">Set {setIndex + 1}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-6">
                                <span className={`text-3xl font-bold ${set.winner === match.teamA._id ? 'text-primary text-glow' : 'text-gray-400'}`}>
                                  {set.teamAScore}
                                </span>
                                <span className="text-gray-600 text-2xl">-</span>
                                <span className={`text-3xl font-bold ${set.winner === match.teamB._id ? 'text-primary text-glow' : 'text-gray-400'}`}>
                                  {set.teamBScore}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
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

                {/* Set/Game Won */}
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
                        {match?.game.name.toUpperCase() === 'TABLE TENNIS' 
                          ? (() => {
                              const isLeague = match.round === 'League Stage';
                              if (isLeague) {
                                return `Won Round ${scoreAnimation.setNumber}!${scoreAnimation.gameType ? ` (${scoreAnimation.gameType})` : ''}`;
                              } else {
                                // For non-league, calculate round and set (3 sets per round)
                                const roundNum = Math.floor((scoreAnimation.setNumber - 1) / 3) + 1;
                                const setNum = ((scoreAnimation.setNumber - 1) % 3) + 1;
                                return `Won Round ${roundNum} - Set ${setNum}!${scoreAnimation.gameType ? ` (${scoreAnimation.gameType})` : ''}`;
                              }
                            })()
                          : `Won Set ${scoreAnimation.setNumber}!`
                        }
                      </p>
                    </motion.div>
                  </>
                )}

                {/* Round Won */}
                {scoreAnimation.type === 'roundWon' && (
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
                      <p className="text-4xl md:text-5xl font-bold text-white">
                        {scoreAnimation.teamName}
                      </p>
                      <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
                        Won Round {scoreAnimation.roundNumber}!
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
