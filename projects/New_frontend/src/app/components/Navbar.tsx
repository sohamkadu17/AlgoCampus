import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, Users, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onConnectWallet?: () => void;
  showConnectButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onConnectWallet, 
  showConnectButton = true 
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-[#006266]/10 dark:border-[#006266]/20 shadow-lg shadow-[#006266]/5' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Brand */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#006266]/30 to-[#00838f]/30 blur-lg rounded-xl" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="size-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#006266] to-[#00838f] bg-clip-text text-transparent">
              CampusPay
            </span>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#006266] dark:hover:text-[#B2DFDB] transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#006266] dark:hover:text-[#B2DFDB] transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('for-students')}
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#006266] dark:hover:text-[#B2DFDB] transition-colors"
            >
              For Students
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {showConnectButton && onConnectWallet && (
              <motion.button
                onClick={onConnectWallet}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#006266] to-[#00838f] hover:from-[#004d4f] hover:to-[#006266] text-white text-sm font-bold rounded-full shadow-lg shadow-[#006266]/30 transition-all"
              >
                <Wallet className="size-4" />
                Connect Wallet
              </motion.button>
            )}
            
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      {/* Bottom Glow Line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#006266]/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: scrolled ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />
    </motion.nav>
  );
};
