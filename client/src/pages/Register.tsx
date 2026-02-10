import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, Plus, X, Upload, CheckCircle2, AlertCircle, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

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

export default function Register() {
  const { toast } = useToast();
  const { user, loading, login } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [hall, setHall] = useState<Hall | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>("");
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch games, hall info, and registration status
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoadingData(false);
        return;
      }
      
      try {
        setLoadingData(true);
        
        // Fetch games
        const gamesRes = await api.get('/api/games');
        setGames(gamesRes.data);
        
        // Fetch hall info (find hall where user is JMCR)
        const hallsRes = await api.get('/api/halls/all');
        const userHall = hallsRes.data.find((h: Hall & { jmcr: { gsuite: string } }) => 
          h.jmcr?.gsuite === user.email
        );
        
        if (userHall) {
          setHall(userHall);
          
          // Fetch registration status
          const statusRes = await api.get(`/api/teams/status/${userHall._id}`);
          setRegistrationStatus(statusRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load registration data",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Check for error in URL hash
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    
    if (hash === 'jmcr_only') {
      toast({
        title: "Access Denied",
        description: "Only JMCRs can register teams. Please contact your hall's JMCR for registration.",
        variant: "destructive",
        duration: 8000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (hash === 'auth_failed') {
      toast({
        title: "Authentication Failed",
        description: "Unable to authenticate. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (hash === 'auth_success') {
      toast({
        title: "Authentication Successful",
        description: "You can now register for events.",
        duration: 4000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  // Initialize players array when game is selected
  useEffect(() => {
    if (selectedGame) {
      const minPlayers = selectedGame.minPlayersPerTeam;
      setPlayers(Array(minPlayers).fill(''));
      setTeamName('');
      setPaymentScreenshot('');
    }
  }, [selectedGame]);

  const handleAddPlayer = () => {
    if (selectedGame && players.length < selectedGame.maxPlayersPerTeam) {
      setPlayers([...players, '']);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (selectedGame && players.length > selectedGame.minPlayersPerTeam) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const handlePaymentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File",
        description: "Please select a PNG, JPG, JPEG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPayment(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPaymentScreenshot(response.data.url);
      toast({
        title: "Upload Successful",
        description: "Payment screenshot uploaded",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload payment screenshot",
        variant: "destructive",
      });
    } finally {
      setUploadingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGame || !hall) return;

    // Validate all players have names
    const filledPlayers = players.filter(p => p.trim() !== '');
    if (filledPlayers.length < selectedGame.minPlayersPerTeam) {
      toast({
        title: "Incomplete Team",
        description: `Please add at least ${selectedGame.minPlayersPerTeam} players`,
        variant: "destructive",
      });
      return;
    }

    if (!paymentScreenshot) {
      toast({
        title: "Payment Required",
        description: "Please upload payment screenshot",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/api/teams', {
        hallId: hall._id,
        gameId: selectedGame._id,
        teamName,
        players: filledPlayers.map(name => ({ name })),
        paymentScreenshot
      });

      toast({
        title: "Registration Successful!",
        description: `Team ${teamName} registered for ${selectedGame.name}`,
      });

      // Refresh registration status
      const statusRes = await api.get(`/api/teams/status/${hall._id}`);
      setRegistrationStatus(statusRes.data);

      // Reset form
      setSelectedGame(null);
      setTeamName('');
      setPlayers([]);
      setPaymentScreenshot('');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Failed to register team",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewQR = (qrUrl: string) => {
    window.open(qrUrl, '_blank');
  };

  const handleDownloadQR = async (qrUrl: string, gameName: string) => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${gameName.replace(/\s+/g, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "QR code is being downloaded",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const getAvailableTeamNames = (gameId: string) => {
    const status = registrationStatus.find(s => s.gameId === gameId);
    if (!status) return [];
    
    const maxTeams = status.maxTeams;
    const registeredNames = status.teamNames;
    const allNames = Array.from({ length: maxTeams }, (_, i) => 
      String.fromCharCode(65 + i) // A, B, C, D...
    );
    
    return allNames.filter(name => !registeredNames.includes(name));
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
        
        <div className="pt-32 pb-24 container mx-auto px-6 flex flex-col items-center justify-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl"
          >
            <div className="text-center mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-display"
              >
                TEAM <span className="text-primary">REGISTRATION</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-lg"
              >
                Register your hall's teams for Dangal 4.0
              </motion.p>
            </div>

            {loading || loadingData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
              </div>
            ) : !user ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-black/40 backdrop-blur-md border border-white/20 p-6 md:p-10 lg:p-12 rounded-2xl shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                <div className="space-y-8 text-center py-8">
                  <div className="space-y-4">
                    <p className="text-white text-lg font-semibold">
                      Only JMCR of respective hall / hostel can register for events
                    </p>
                    <p className="text-gray-400 text-sm">
                      (Use G Suite ID only)
                    </p>
                  </div>
                  
                  <motion.button
                    onClick={login}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mx-auto flex items-center gap-3 px-8 py-4 bg-white text-black font-bold uppercase tracking-wider rounded-lg hover:bg-gray-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </motion.button>
                </div>
              </motion.div>
            ) : !hall ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/40 backdrop-blur-md border border-white/20 p-10 rounded-2xl text-center"
              >
                <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
                <h3 className="text-2xl font-bold text-white mb-2">Not a JMCR</h3>
                <p className="text-gray-400">
                  You are not registered as a JMCR for any hall. Please contact your hall administrator.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Registration Status - Top Row */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl mx-auto w-full lg:w-[75%]"
                >
                  <div className="flex flex-col gap-4 mb-6">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                      <CheckCircle2 size={24} />
                      Registration Status
                    </h3>
                    
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg w-full">
                      <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">Hall/Hostel:</span>
                      <span className="text-white font-bold text-base sm:text-lg truncate flex-1">{hall.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registrationStatus.map((status) => (
                      <div
                        key={status.gameId}
                        className={`p-5 rounded-lg border ${
                          status.teamsRegistered >= status.maxTeams
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-white text-base">{status.gameName}</p>
                          <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                            status.teamsRegistered >= status.maxTeams
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {status.teamsRegistered}/{status.maxTeams}
                          </span>
                        </div>
                        {status.teamNames.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {status.teamNames.map((name) => (
                              <span
                                key={name}
                                className="text-sm px-3 py-1 bg-primary/20 text-primary rounded font-semibold"
                              >
                                Team {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No teams registered</p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Event Selection or Registration Form */}
                {!selectedGame ? (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <h3 className="text-2xl font-bold text-white mb-6">Select an Event</h3>
                      {games.map((game) => {
                        const status = registrationStatus.find(s => s.gameId === game._id);
                        const canRegister = status?.canRegisterMore ?? true;
                        
                        return (
                          <motion.div
                            key={game._id}
                            whileHover={{ scale: canRegister ? 1.02 : 1 }}
                            className={`bg-black/40 backdrop-blur-md border rounded-2xl overflow-hidden ${
                              canRegister
                                ? 'border-white/20 cursor-pointer hover:border-primary/50'
                                : 'border-gray-700 opacity-60 cursor-not-allowed'
                            }`}
                            onClick={() => {
                              if (canRegister) {
                                setSelectedGame(game);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                          >
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-1/3 h-48 md:h-auto">
                                <img
                                  src={game.image}
                                  alt={game.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 p-6 flex flex-col">
                                <div className="flex justify-between items-start mb-8">
                                  <h4 className="text-2xl font-bold text-primary">{game.name}</h4>
                                  {!canRegister && (
                                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                                      Full
                                    </span>
                                  )}
                                </div>
                                
                                {/* Top Row - Registration Fee and Players */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-6">
                                  <div>
                                    <p className="text-gray-500 text-base mb-1">Registration Fee</p>
                                    <p className="text-white font-bold text-lg">₹{game.registrationAmount} <span className="text-gray-500 text-sm">per team</span></p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-base mb-1">Players</p>
                                    <p className="text-white font-bold text-lg">
                                      {game.minPlayersPerTeam === game.maxPlayersPerTeam
                                        ? `${game.minPlayersPerTeam}`
                                        : `${game.minPlayersPerTeam}-${game.maxPlayersPerTeam}`}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Spacer to push bottom content down */}
                                <div className="flex-1"></div>
                                
                                {/* Bottom Row - Teams Registered and Register Button */}
                                <div className="grid grid-cols-2 gap-x-4 items-end">
                                  <div>
                                    <p className="text-gray-500 text-base mb-1">Teams Registered</p>
                                    <p className="text-white font-bold text-lg">
                                      {status?.teamsRegistered || 0}/{game.maxTeams}
                                    </p>
                                  </div>
                                  <div>
                                    {canRegister ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedGame(game);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="w-full px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-all text-sm"
                                      >
                                        Register
                                      </button>
                                    ) : (
                                      <div>
                                        <p className="text-gray-500 text-base mb-1">Status</p>
                                        <p className="text-red-400 font-bold text-lg">Full</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-black/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl mx-auto w-full lg:w-[75%]"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-primary">Register for {selectedGame.name}</h3>
                        <button
                          onClick={() => setSelectedGame(null)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">
                          <AlertCircle size={16} />
                          Teams are non-editable once submitted. Please fill carefully.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Team Name Selection */}
                        <div className="relative">
                          <label className="block text-sm font-bold uppercase tracking-wider text-primary mb-2">
                            Team Name *
                          </label>
                          <select
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            required
                            className="w-full bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer hover:bg-black/60 hover:border-white/30"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23FFD700'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                              backgroundSize: '1.5em 1.5em',
                            }}
                          >
                            <option value="" className="bg-black text-gray-400 py-3">Select Team Name</option>
                            {getAvailableTeamNames(selectedGame._id).map((name) => (
                              <option key={name} value={name} className="bg-black text-primary font-bold py-3">
                                Team {name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Available teams based on max limit ({selectedGame.maxTeams} teams)
                          </p>
                        </div>

                        {/* Players */}
                        <div>
                          <label className="block text-sm font-bold uppercase tracking-wider text-primary mb-2">
                            Players *
                            {selectedGame.minPlayersPerTeam === selectedGame.maxPlayersPerTeam ? (
                              <span className="text-gray-400 text-xs ml-2 normal-case">
                                (Exactly {selectedGame.minPlayersPerTeam} players required)
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs ml-2 normal-case">
                                (Min: {selectedGame.minPlayersPerTeam}, Max: {selectedGame.maxPlayersPerTeam})
                              </span>
                            )}
                          </label>
                          
                          <div className="space-y-3">
                            {players.map((player, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={player}
                                  onChange={(e) => handlePlayerChange(index, e.target.value)}
                                  required={index < selectedGame.minPlayersPerTeam}
                                  placeholder={`Player ${index + 1} name${index < selectedGame.minPlayersPerTeam ? ' *' : ''}`}
                                  className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                                {index >= selectedGame.minPlayersPerTeam && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlayer(index)}
                                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {players.length < selectedGame.maxPlayersPerTeam && (
                            <button
                              type="button"
                              onClick={handleAddPlayer}
                              className="mt-3 w-full px-4 py-3 bg-white/5 text-white border border-white/20 rounded-lg font-bold uppercase tracking-wider hover:bg-white/10 hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus size={20} />
                              Add Player ({selectedGame.maxPlayersPerTeam - players.length} slots left)
                            </button>
                          )}
                        </div>

                        {/* Payment Section */}
                        <div className="border-t border-white/10 pt-6 mt-6">
                          <h4 className="text-xl font-bold text-primary mb-6 uppercase tracking-wider">Payment Details</h4>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* QR Code Section */}
                            <div className="flex flex-col">
                              <label className="block text-sm font-bold uppercase tracking-wider text-primary mb-3">
                                Scan to Pay *
                              </label>
                              
                              <div className="relative bg-white p-4 rounded-xl shadow-2xl group flex-1 flex items-center justify-center min-h-[400px]">
                                <img
                                  src={selectedGame.qrCodeImage}
                                  alt="Payment QR Code"
                                  className="w-auto h-auto max-w-full max-h-full rounded-lg"
                                />
                                
                                {/* Hover Overlay with Actions */}
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleViewQR(selectedGame.qrCodeImage)}
                                    className="flex flex-col items-center justify-center gap-1.5 w-20 h-20 bg-primary text-black rounded-lg hover:bg-yellow-400 hover:scale-105 transition-all font-bold shadow-lg"
                                  >
                                    <Eye size={22} strokeWidth={2.5} />
                                    <span className="text-xs uppercase tracking-wide">View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadQR(selectedGame.qrCodeImage, selectedGame.name)}
                                    className="flex flex-col items-center justify-center gap-1.5 w-20 h-20 bg-white text-black rounded-lg hover:bg-gray-200 hover:scale-105 transition-all font-bold shadow-lg"
                                  >
                                    <Download size={22} strokeWidth={2.5} />
                                    <span className="text-xs uppercase tracking-wide">Download</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Amount Below QR */}
                              <div className="mt-3 text-center">
                                <div className="inline-block px-14 py-2 bg-black/60 backdrop-blur-sm border border-primary/30 rounded-lg">
                                  <p className="text-gray-300 text-sm">Registration Amount: <span className="text-primary font-bold text-lg">₹{selectedGame.registrationAmount}</span> <span className="text-gray-400 text-xs">per team</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Payment Screenshot Upload */}
                            <div className="flex flex-col">
                              <label className="block text-sm font-bold uppercase tracking-wider text-primary mb-3">
                                Payment Screenshot *
                              </label>
                              
                              {paymentScreenshot ? (
                                <div className="relative group flex-1">
                                  <div className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-black/50 p-4 h-full flex items-center justify-center">
                                    <img
                                      src={paymentScreenshot}
                                      alt="Payment Screenshot"
                                      className="max-w-full max-h-full rounded-lg object-contain"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setPaymentScreenshot('')}
                                      className="absolute top-6 right-6 p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg"
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>
                                  <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                                    <CheckCircle2 size={16} />
                                    <span>Payment screenshot uploaded</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={handlePaymentUpload}
                                    disabled={uploadingPayment}
                                    className="hidden"
                                    id="payment-upload"
                                  />
                                  <label
                                    htmlFor="payment-upload"
                                    className={`relative overflow-hidden flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-gradient-to-br from-black/50 to-black/30 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${
                                      uploadingPayment
                                        ? 'border-gray-600 cursor-not-allowed'
                                        : 'border-white/30 hover:border-primary/60 hover:bg-black/60'
                                    }`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {uploadingPayment ? (
                                      <div className="relative z-10 flex flex-col items-center justify-center">
                                        <Loader2 className="animate-spin text-primary mb-3" size={48} />
                                        <span className="text-gray-400 font-semibold">Uploading...</span>
                                      </div>
                                    ) : (
                                      <div className="relative z-10 text-center px-4">
                                        <div className="mb-4 p-4 bg-primary/10 rounded-full inline-block">
                                          <Upload className="text-primary" size={40} />
                                        </div>
                                        <span className="block text-white font-bold text-lg mb-2">Click to upload payment screenshot</span>
                                        <span className="text-gray-400 text-sm">PNG, JPG, JPEG, WebP up to 5MB</span>
                                      </div>
                                    )}
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                          type="submit"
                          disabled={isSubmitting || uploadingPayment || !teamName || !paymentScreenshot}
                          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                          className="w-full mt-8 py-4 bg-primary text-black font-bold uppercase tracking-widest rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)]"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              Registering...
                            </>
                          ) : (
                            "Register Team"
                          )}
                        </motion.button>
                        
                        {/* Cancel Button */}
                        <motion.button
                          type="button"
                          onClick={() => {
                            setSelectedGame(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full mt-4 py-4 bg-white/5 text-white font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 border border-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-2"
                        >
                          Cancel
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
              </div>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}
