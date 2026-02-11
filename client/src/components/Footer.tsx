import lionLogo from "@assets/image_1770666048367.webp";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black border-t-2 border-primary pt-16 pb-8 relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src={lionLogo} alt="Dangal Logo" className="h-12 w-auto grayscale opacity-80" />
              <h2 className="text-2xl font-bold font-display text-white tracking-widest">DANGAL 4.0</h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              The ultimate battle of talent, strength, and spirit. Macdonald Hall invites you to witness history in the making. Are you ready for the glory?
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-display text-lg tracking-wider">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#about" className="hover:text-primary transition-colors">About the Event</a></li>
              <li><a href="/#events" className="hover:text-primary transition-colors">Competitions</a></li>
              <li><a href="/gallery" className="hover:text-primary transition-colors">Gallery</a></li>
              <li><a href="/register" className="hover:text-primary transition-colors">Register Now</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-white font-display text-lg tracking-wider">Connect</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                <Facebook size={18} />
              </a>
              <a href="mailto:contact@dangal.com" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                <Mail size={18} />
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Macdonald Hall, IIEST Shibpur
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-muted-foreground">© 2026 Dangal 4.0. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
