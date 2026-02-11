import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, User, CheckCircle2, ChevronDown, ChevronUp, UserCircle, X, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

// Animated Gradient Mesh Background
function AnimatedMeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 80, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
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

    const particleCount = 50;
    const maxDistance = 150;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 215, 0, 0.5)";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.2 * (1 - distance / maxDistance)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

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
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
}

interface Game {
  _id: string;
  name: string;
  description: string;
  image: string;
  registrationAmount: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  maxTeams: number;
  qrCodeImage: string;
}

interface Hall {
  _id: string;
  name: string;
  type: string;
}

interface RegistrationStatus {
  gameId: string;
  gameName: string;
  teamsRegistered: number;
  maxTeams: number;
  teamNames: string[];
  canRegisterMore: boolean;
}

interface Team {
  _id: string;
  teamName: string;
  players: { name: string }[];
  gameId: string;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [hall, setHall] = useState<Hall | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{ gameName: string; teams: Team[] } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/register');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoadingData(false);
        return;
      }
      
      try {
        setLoadingData(true);
        
        const gamesRes = await api.get('/api/games');
        setGames(gamesRes.data);
        
        const hallsRes = await api.get('/api/halls/all');
        const userHall = hallsRes.data.find((h: Hall & { jmcr: { gsuite: string } }) => 
          h.jmcr?.gsuite === user.email
        );
        
        if (userHall) {
          setHall(userHall);
          
          const statusRes = await api.get(`/api/teams/status/${userHall._id}`);
          setRegistrationStatus(statusRes.data);
          
          const teamsRes = await api.get(`/api/teams/hall/${userHall._id}`);
          setTeams(teamsRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!user || !hall) {
    return null;
  }

  const registeredEvents = registrationStatus.filter(s => s.teamsRegistered > 0);
  const unregisteredEvents = registrationStatus.filter(s => s.teamsRegistered === 0);

  const handleViewTeams = (gameName: string, gameId: string) => {
    const eventTeams = teams.filter(t => {
      const teamGameId = typeof t.gameId === 'object' ? t.gameId._id : t.gameId;
      return teamGameId.toString() === gameId.toString();
    });
    setSelectedEvent({ gameName, teams: eventTeams });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Global Animated Mesh Background */}
      <div className="fixed inset-0 z-0">
        <AnimatedMeshBackground />
        <ParticleNetwork />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
      </div>

      <div className="relative z-10">
        <Navbar />
        
        <div className="pt-32 pb-24 container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 font-display">
              <span className="text-primary">PROFILE</span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - JMCR & Hall Details - Fixed */}
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-32 lg:self-start">
                {/* JMCR Details */}
                <div className="bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <User size={20} className="text-primary" />
                    JMCR Details
                  </h3>
                  <div className="flex flex-col items-center text-center">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-24 h-24 rounded-full border-2 border-primary/30 mb-4"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-24 h-24 rounded-full border-2 border-primary/30 mb-4 flex items-center justify-center bg-white/5 ${user.avatar ? 'hidden' : ''}`}>
                      <UserCircle size={48} className="text-gray-400" />
                    </div>
                    <p className="text-white font-bold text-xl mb-1">{user.name}</p>
                    <p className="text-gray-400 text-sm break-all">{user.email}</p>
                  </div>
                </div>

                {/* Hall Details */}
                <div className="bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-primary" />
                    Hall/Hostel
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Name</p>
                      <p className="text-white font-bold text-lg">{hall.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Type</p>
                      <p className="text-white font-bold text-lg capitalize">{hall.type}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-primary mb-4">Event-wise Summary</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {registrationStatus.map((status) => (
                      <div key={status.gameId} className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-white font-semibold text-sm truncate">{status.gameName}</p>
                          <p className="text-gray-400 text-xs">
                            {status.teamsRegistered > 0 ? (
                              <span className="text-green-400">{status.teamsRegistered} registered</span>
                            ) : (
                              <span className="text-yellow-400">Not registered</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">{status.teamsRegistered}/{status.maxTeams}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Registration Details - Scrollable */}
              <div className="lg:col-span-2 space-y-6">
                {/* Registered Events */}
                {registeredEvents.length > 0 && (
                  <div className="bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-green-400 mb-4">Registered Events ({registeredEvents.length})</h3>
                    <div className="space-y-4">
                      {registeredEvents.map((status) => (
                        <div key={status.gameId} className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-white text-lg">{status.gameName}</p>
                              <p className="text-gray-400 text-sm">{status.teamsRegistered} team(s) registered</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-bold text-sm">
                                {status.teamsRegistered}/{status.maxTeams}
                              </span>
                              <button
                                onClick={() => handleViewTeams(status.gameName, status.gameId)}
                                className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                              >
                                <Users size={16} />
                                View Teams
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending/Incomplete Events */}
                {registrationStatus.filter(s => s.teamsRegistered < s.maxTeams).length > 0 && (
                  <div className="bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">
                      Pending/Incomplete Registration ({registrationStatus.filter(s => s.teamsRegistered < s.maxTeams).length})
                    </h3>
                    <div className="space-y-3">
                      {registrationStatus.filter(s => s.teamsRegistered < s.maxTeams).map((status) => (
                        <div key={status.gameId} className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                          <p className="font-bold text-white mb-2 text-lg">{status.gameName}</p>
                          <div className="space-y-1">
                            <p className="text-gray-400 text-sm">
                              {status.teamsRegistered > 0 ? (
                                <>Registered: <span className="text-green-400 font-semibold">{status.teamsRegistered}</span></>
                              ) : (
                                <span className="text-yellow-400">No teams registered yet</span>
                              )}
                            </p>
                            <p className="text-yellow-400 text-xs">
                              {status.maxTeams - status.teamsRegistered} slot(s) remaining
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>

      {/* Teams Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999]"
              onClick={() => setSelectedEvent(null)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-4xl max-h-[85vh] bg-black/95 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-[0_0_60px_rgba(255,215,0,0.2)] overflow-hidden"
              >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-br from-primary/20 to-primary/5 border-b border-primary/30 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedEvent.gameName}</h2>
                      <p className="text-gray-400 text-sm">{selectedEvent.teams.length} team(s) registered</p>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-6">
                  {selectedEvent.teams.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEvent.teams.map((team) => (
                        <motion.div
                          key={team._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5 hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-bold text-lg">
                              Team {team.teamName}
                            </span>
                            <span className="text-gray-400 text-sm">
                              {team.players.length} player(s)
                            </span>
                          </div>
                          
                          <div className="bg-black/40 rounded-lg p-4">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Users size={14} />
                              Players:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {team.players.map((player, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-white bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all">
                                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium">{player.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">No teams found for this event</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
