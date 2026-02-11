import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, LogOut, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import lionLogo from "@assets/image_1770666048367.webp";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Home", href: "/#" },
  { name: "About", href: "/#about" },
  { name: "Events", href: "/#events" },
  { name: "Matches", href: "/matches" },
  { name: "Gallery", href: "/#gallery" },
  { name: "Winners", href: "/#winners" },
];

export function Navbar({ onProfileClick }: { onProfileClick?: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith("/#") && location.pathname === "/") {
      const id = href.substring(2);
      const element = id ? document.getElementById(id) : document.body;
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[10000] transition-all duration-500 ${
          isScrolled 
            ? "bg-black/60 backdrop-blur-xl border-b border-white/5 py-3" 
            : "bg-transparent py-6"
        }`}
      >
      <div className="container mx-auto px-6 flex items-center justify-between relative">
        {/* Logo Area */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer relative">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full scale-0 group-hover:scale-150 transition-transform" />
            <img src={lionLogo} alt="Dangal Logo" className="h-12 w-auto relative z-10 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-display tracking-widest text-white group-hover:text-primary transition-colors leading-none">DANGAL <span className="text-primary">4.0</span></span>
            <span className="text-[0.6rem] text-muted-foreground tracking-[0.3em] uppercase hidden sm:block mt-1">MacDonald Hall</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center bg-white/5 backdrop-blur-md rounded-full px-2 border border-white/10 mr-4 h-[44px]">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith("/#") && location.pathname === "/") {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }
                }}
                className="px-4 h-full flex items-center text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white transition-all relative group"
              >
                {item.name}
                <motion.span 
                  className="absolute bottom-1 left-4 right-4 h-[1px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform"
                />
              </a>
            ))}
          </div>
          
          {user ? (
            <div className="flex items-center gap-2">
              {/* Register Button */}
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-[44px] px-6 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-full shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] transition-all flex items-center gap-2"
                >
                  Register <ChevronRight size={14} />
                </motion.button>
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-[44px] flex items-center gap-2 px-4 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-md rounded-full border-2 border-primary/40 hover:border-primary/60 hover:from-primary/30 hover:to-primary/20 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]"
                >
                  {user.avatar ? (
                    <>
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-6 h-6 rounded-full border-2 border-primary/50"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="w-6 h-6 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/10 hidden">
                        <UserCircle size={18} className="text-primary" />
                      </div>
                    </>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/10">
                      <UserCircle size={18} className="text-primary" />
                    </div>
                  )}
                  <span className="text-xs text-white font-bold uppercase tracking-wider">Menu</span>
                  <motion.div
                    animate={{ rotate: showUserMenu ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={16} className="text-primary rotate-90" />
                  </motion.div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-black/95 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-[0_0_40px_rgba(255,215,0,0.3)] overflow-hidden z-50"
                      >
                        {/* User Info */}
                        <div className="p-4 border-b border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <>
                                <img 
                                  src={user.avatar} 
                                  alt={user.name} 
                                  className="w-12 h-12 rounded-full border-2 border-primary/50"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="w-12 h-12 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/10 hidden">
                                  <UserCircle size={28} className="text-primary" />
                                </div>
                              </>
                            ) : (
                              <div className="w-12 h-12 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/10">
                                <UserCircle size={28} className="text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-sm truncate">{user.name}</p>
                              <p className="text-gray-400 text-xs truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <motion.button
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate('/profile');
                            }}
                            whileHover={{ x: 4 }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-primary/20 rounded-xl transition-all group"
                          >
                            <UserCircle size={20} className="text-primary" />
                            <span className="font-semibold">View Profile</span>
                            <ChevronRight size={16} className="ml-auto text-gray-400 group-hover:text-primary transition-colors" />
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleLogoutClick();
                            }}
                            whileHover={{ x: 4 }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/20 rounded-xl transition-all group"
                          >
                            <LogOut size={20} className="text-red-400" />
                            <span className="font-semibold">Logout</span>
                            <ChevronRight size={16} className="ml-auto text-gray-400 group-hover:text-red-400 transition-colors" />
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <Link to="/register">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-[44px] px-6 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-full shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] transition-all flex items-center gap-2"
              >
                Register <ChevronRight size={14} />
              </motion.button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white hover:text-primary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Glowing Yellow Line with Glare Animation - Only when scrolled */}
      {isScrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-75"
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              width: '50%',
              filter: 'blur(8px)',
            }}
          />
        </div>
      )}
    </nav>

      {/* Mobile Menu - OUTSIDE nav element */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[10001]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] bg-black border-l border-white/10 p-10 flex flex-col z-[10002] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-xl font-bold font-display tracking-widest text-primary">MENU</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/40 hover:text-white">
                    <X size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith("/#") && location.pathname === "/") {
                        e.preventDefault();
                        handleNavClick(item.href);
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className="text-2xl font-bold font-display uppercase text-white hover:text-primary tracking-widest flex items-center justify-between group"
                  >
                    {item.name === "Winners" ? "Past Winners" : item.name}
                    <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
              <div className="mt-auto">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      {user.avatar ? (
                        <>
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="w-10 h-10 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/10 hidden flex-shrink-0">
                            <UserCircle size={24} className="text-primary" />
                          </div>
                        </>
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/10 flex-shrink-0">
                          <UserCircle size={24} className="text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-gray-400 text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full py-4 bg-primary/20 border-2 border-primary/40 text-primary font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                      <UserCircle size={18} /> View Profile
                    </button>
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        // Small delay to allow sidebar to close before showing confirmation
                        setTimeout(() => {
                          handleLogoutClick();
                        }, 300);
                      }}
                      className="w-full py-4 bg-red-600/80 text-white font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                ) : (
                  <Link to="/register">
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-5 bg-primary text-black font-bold uppercase tracking-widest text-sm rounded-sm"
                    >
                      Register Now
                    </button>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal - Outside nav for proper centering */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999]"
              onClick={cancelLogout}
            />
            
            {/* Modal Container - Fixed centering */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                pointerEvents: 'none',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  width: '90%',
                  maxWidth: '28rem',
                  pointerEvents: 'auto',
                }}
              >
                {/* Glow effect - contained within modal */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-xl rounded-3xl" style={{ zIndex: -1 }} />
                
                {/* Modal content */}
                <div className="relative bg-black/80 backdrop-blur-xl border-2 border-primary/30 rounded-2xl p-8 shadow-[0_0_60px_rgba(255,215,0,0.15)]">
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-6">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600/30 to-red-800/30 border-2 border-red-500/50 flex items-center justify-center relative"
                    >
                      <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
                      <LogOut size={36} className="text-red-500 relative z-10" />
                    </motion.div>
                  </div>
                  
                  {/* Title */}
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl md:text-3xl font-bold text-white text-center mb-3 font-display tracking-wider"
                  >
                    CONFIRM <span className="text-primary">LOGOUT</span>
                  </motion.h3>
                  
                  {/* Description */}
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 text-center mb-8 text-sm"
                  >
                    Are you sure you want to logout from your account?
                  </motion.p>

                  {/* Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(255,215,0,0.2)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={cancelLogout}
                      className="flex-1 py-3.5 px-6 bg-white/5 backdrop-blur-sm border-2 border-primary/30 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white/10 hover:border-primary/50 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(239,68,68,0.5)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={confirmLogout}
                      className="flex-1 py-3.5 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] border-2 border-red-500/50"
                    >
                      Logout
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
