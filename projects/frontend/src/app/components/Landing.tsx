import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Shield, Zap, ArrowRight, ChevronRight, CheckCircle2, Globe, Users, HeartHandshake, PiggyBank, Home, BookOpen, TrendingUp, Rocket, Network, Clock, Lock } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AnimatedBackground } from './AnimatedBackground';
import { Navbar } from './Navbar';

interface LandingProps {
  onStart: () => void;
  onConnect: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onConnect }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-white/50 dark:bg-zinc-950/50 overflow-x-hidden selection:bg-teal-500/30 relative">
      <AnimatedBackground />
      
      {/* Navbar */}
      <Navbar onConnectWallet={onConnect} showConnectButton={true} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-zinc-900/40 border border-[#006266]/20 dark:border-[#006266]/40 backdrop-blur-xl text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            Live on Algorand Testnet
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[0.95]"
          >
            The New Era of<br />
            <span className="bg-gradient-to-r from-[#006266] to-[#00838f] bg-clip-text text-transparent dark:from-[#B2DFDB] dark:to-[#80CBC4]">
              Campus Finance
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-slate-500 dark:text-zinc-400 max-w-lg mx-auto text-lg sm:text-xl font-medium leading-relaxed"
          >
            Seamlessly split bills, save for goals, and discover events. Fast, secure, and built for students.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <motion.button 
              onClick={onStart}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#006266] to-[#00838f] hover:from-[#004d4f] hover:to-[#006266] text-white font-black rounded-3xl shadow-2xl shadow-[#006266]/30 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button 
              onClick={onConnect}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-10 py-5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-2 border-[#006266]/20 dark:border-[#006266]/40 text-slate-900 dark:text-white font-black rounded-3xl transition-all hover:bg-white/90 dark:hover:bg-zinc-800/70 hover:shadow-lg"
            >
              Connect Wallet
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* App Preview UI */}
      <section className="px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative group">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-[#006266]/30 to-[#00838f]/30 blur-[100px] opacity-50 group-hover:opacity-100 transition-opacity"
              whileInView={{ scale: [0.8, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
            />
            <div className="relative rounded-[3rem] border-[12px] border-slate-900/90 dark:border-zinc-800/90 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-900">
               <ImageWithFallback 
                 src="https://images.unsplash.com/photo-1620555791739-438a95e7ff65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJsb2NrY2hhaW4lMjBuZXR3b3JrJTIwdGVhbCUyMGJsdWV8ZW58MXx8fHwxNzcwODEwMjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                 alt="Dashboard Preview"
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]" />
               {/* UI Overlays to simulate dashboard */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.5 }}
                 className="absolute top-10 left-10 w-64 h-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20"
               >
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Wallet Balance</p>
                  <motion.p 
                    className="text-3xl font-black text-slate-900 dark:text-white"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    1,248.50 <span className="text-sm font-bold text-[#006266]">ALGO</span>
                  </motion.p>
               </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Built for Students Section */}
      <section id="for-students" className="px-6 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#006266]/10 dark:bg-[#006266]/20 border border-[#006266]/20"
          >
            <Users className="size-4 text-[#006266]" />
            <span className="text-xs font-bold text-[#006266] uppercase tracking-wide">Built for Students</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Everything Your Campus Needs
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto text-lg"
          >
            From hostel expenses to fundraising campaigns, manage it all in one place with complete transparency.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: "Hostel Expense Splitting", 
              desc: "Share rent, utilities, and groceries fairly with roommates.", 
              icon: Home, 
              color: "from-blue-500 to-cyan-500",
              delay: 0
            },
            { 
              title: "Trip & Event Sharing", 
              desc: "Split costs for college trips, parties, and weekend getaways.", 
              icon: Rocket, 
              color: "from-purple-500 to-pink-500",
              delay: 0.1
            },
            { 
              title: "Project Pool Contributions", 
              desc: "Collect funds for group projects and academic ventures.", 
              icon: BookOpen, 
              color: "from-orange-500 to-red-500",
              delay: 0.2
            },
            { 
              title: "Fundraising Transparency", 
              desc: "Run student campaigns with blockchain-verified contributions.", 
              icon: HeartHandshake, 
              color: "from-green-500 to-teal-500",
              delay: 0.3
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: item.delay }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <GlassCard className="p-6 h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/40 dark:border-zinc-800/40 shadow-lg hover:shadow-2xl hover:shadow-[#006266]/10 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-black mb-2 text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">{item.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-6 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#006266]/10 dark:bg-[#006266]/20 border border-[#006266]/20"
          >
            <Zap className="size-4 text-[#006266]" />
            <span className="text-xs font-bold text-[#006266] uppercase tracking-wide">How It Works</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Simple. Fast. Secure.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: "01",
              title: "Create a Split",
              desc: "Start a new split for any expense - rent, food, events, or trips.",
              icon: Users,
              delay: 0
            },
            {
              step: "02",
              title: "Add Expenses",
              desc: "Track who paid what. Everyone sees real-time updates instantly.",
              icon: TrendingUp,
              delay: 0.2
            },
            {
              step: "03",
              title: "Settle on Algorand",
              desc: "Pay with one click. Blockchain guarantees transparency and security.",
              icon: CheckCircle2,
              delay: 0.4
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: item.delay, type: "spring" }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <motion.div
                    className="absolute inset-0 bg-[#006266]/20 blur-2xl rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-2xl flex items-center justify-center shadow-2xl">
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border-2 border-[#006266] shadow-lg">
                    <span className="text-xs font-black text-[#006266]">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
              
              {/* Connecting Line */}
              {index < 2 && (
                <div className="hidden md:block absolute top-10 -right-1/2 w-full h-[2px] bg-gradient-to-r from-[#006266]/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Algorand Section */}
      <section className="px-6 py-32 max-w-7xl mx-auto relative">
        {/* Animated Network Background */}
        <div className="absolute inset-0 overflow-hidden opacity-20 dark:opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="2" fill="#006266" />
                <line x1="50" y1="50" x2="100" y2="50" stroke="#006266" strokeWidth="0.5" opacity="0.3" />
                <line x1="50" y1="50" x2="50" y2="100" stroke="#006266" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network)" />
          </svg>
        </div>

        <div className="text-center mb-16 space-y-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#006266]/10 dark:bg-[#006266]/20 border border-[#006266]/20"
          >
            <Network className="size-4 text-[#006266]" />
            <span className="text-xs font-bold text-[#006266] uppercase tracking-wide">Why Algorand?</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Built on the Future of Finance
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto text-lg"
          >
            We chose Algorand for its speed, security, and sustainability - the perfect blockchain for students.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            {
              title: "Instant Finality",
              desc: "Transactions confirm in under 3 seconds. No waiting, ever.",
              icon: Zap,
              gradient: "from-yellow-500 to-orange-500"
            },
            {
              title: "Ultra-Low Fees",
              desc: "Pay less than $0.001 per transaction. Perfect for students.",
              icon: TrendingUp,
              gradient: "from-green-500 to-emerald-500"
            },
            {
              title: "Secure Blockchain",
              desc: "Bank-grade security protecting every transaction you make.",
              icon: Lock,
              gradient: "from-blue-500 to-indigo-500"
            },
            {
              title: "Transparent Settlements",
              desc: "Every payment is verified on-chain. Complete trust guaranteed.",
              icon: Shield,
              gradient: "from-purple-500 to-pink-500"
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <GlassCard className="p-6 h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/40 dark:border-zinc-800/40 shadow-lg hover:shadow-xl hover:shadow-[#006266]/10 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">{item.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Everything for Student Life</h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium max-w-xl mx-auto">A unified platform for all your campus financial needs. Built for speed and absolute security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Smart Splitting", desc: "Instantly split rent, utilities, or pizza nights with roommates.", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { title: "Campus Savings", desc: "Automate your savings and earn rewards on your Algorand assets.", icon: PiggyBank, color: "text-teal-600", bg: "bg-teal-50" },
            { title: "Event Tickets", desc: "Buy and sell tickets for campus parties and workshops as NFTs.", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
            { title: "Fundraising", desc: "Raise funds for clubs or social causes with full transparency.", icon: HeartHandshake, color: "text-rose-600", bg: "bg-rose-50" },
            { title: "Instant Pay", desc: "Pay friends by username or QR code with zero blockchain fees.", icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "Vault Security", desc: "Your funds are protected by the most secure blockchain tech.", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <GlassCard className="p-8 h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/40 dark:border-zinc-800/40 shadow-lg hover:shadow-2xl hover:shadow-[#006266]/10 transition-all duration-300">
                <div className={`w-16 h-16 rounded-3xl ${f.bg} dark:bg-zinc-800 flex items-center justify-center mb-6`}>
                  <f.icon className={`w-8 h-8 ${f.color}`} />
                </div>
                <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-20 border-t border-slate-100 dark:border-zinc-900 text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#006266] to-[#00838f] rounded-lg flex items-center justify-center shadow-lg">
            <Users className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">CampusPay</span>
        </div>
        <div className="flex justify-center gap-10 text-xs font-bold uppercase tracking-widest text-slate-400">
           <a href="#" className="hover:text-[#006266] transition-colors">Privacy</a>
           <a href="#" className="hover:text-[#006266] transition-colors">Terms</a>
           <a href="#" className="hover:text-[#006266] transition-colors">Twitter</a>
           <a href="#" className="hover:text-[#006266] transition-colors">GitHub</a>
        </div>
        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">© 2026 CampusPay • Built for the future of education</p>
      </footer>
    </div>
  );
};