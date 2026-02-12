import React from 'react';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  Target, 
  Users, 
  TrendingUp, 
  Plus,
  Share2
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ImageWithFallback } from './figma/ImageWithFallback';

export const Fundraising: React.FC = () => {
  const campaigns = [
    {
      id: 1,
      title: "Campus Shelter Fund",
      desc: "Helping students displaced by the dormitory floods.",
      current: "4,250",
      target: "5,000",
      contributors: 156,
      daysLeft: 12,
      progress: 85,
      image: "https://images.unsplash.com/photo-1758270704464-f980b03b9633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudHMlMjBjYW1wdXMlMjBncm91cCUyMGxhdWdoaW5nfGVufDF8fHx8MTc3MDgxMDI0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 2,
      title: "Coding Club Gear",
      desc: "New monitors and keyboards for our campus lab.",
      current: "800",
      target: "2,500",
      contributors: 42,
      daysLeft: 24,
      progress: 32,
      image: "https://images.unsplash.com/photo-1620555791739-438a95e7ff65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJsb2NrY2hhaW4lMjBuZXR3b3JrJTIwdGVhbCUyMGJsdWV8ZW58MXx8fHwxNzcwODEwMjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fundraising</h2>
        <button className="p-2 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/20">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-blue-700 p-6 rounded-3xl text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold">Start a Campaign</h3>
        </div>
        <p className="text-sm text-purple-100">Raise funds for clubs, events, or social causes on campus using transparent blockchain tech.</p>
        <button className="w-full bg-white text-purple-700 font-bold py-3 rounded-2xl shadow-lg">
          Create Campaign
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="font-bold text-slate-900 dark:text-white px-1">Active Campaigns</h3>
        {campaigns.map((camp) => (
          <GlassCard key={camp.id} className="bg-white dark:bg-zinc-900">
            <div className="h-32 relative">
               <ImageWithFallback 
                 src={camp.image} 
                 alt={camp.title}
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">{camp.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{camp.desc}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{camp.current} ALGO</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Raised of {camp.target}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-teal-600">{camp.progress}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${camp.progress}%` }}
                    className="h-full bg-teal-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {camp.contributors} contributors
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" /> {camp.daysLeft} days left
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-teal-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-600/10">
                  Contribute
                </button>
                <button className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
