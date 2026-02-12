import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Search, 
  Filter,
  Users,
  Clock
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ImageWithFallback } from './figma/ImageWithFallback';

export const Events: React.FC = () => {
  const categories = ["All", "Parties", "Workshops", "Sports", "Music"];
  
  const events = [
    {
      id: 1,
      title: "Neon Campus Party",
      org: "Student Union",
      date: "Tomorrow, 9:00 PM",
      location: "Main Quad",
      price: "15 ALGO",
      attendees: 142,
      image: "https://images.unsplash.com/photo-1761781342506-821be95168c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwZXZlbnQlMjBwYXJ0eSUyMHN0dWRlbnRzfGVufDF8fHx8MTc3MDgxMDI0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 2,
      title: "Web3 Hackathon",
      org: "Coding Club",
      date: "Oct 12-14",
      location: "Library Hall B",
      price: "Free",
      attendees: 56,
      image: "https://images.unsplash.com/photo-1620555791739-438a95e7ff65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJsb2NrY2hhaW4lMjBuZXR3b3JrJTIwdGVhbCUyMGJsdWV8ZW58MXx8fHwxNzcwODEwMjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campus Events</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-sm font-bold">
          <Ticket className="w-4 h-4" /> My Tickets
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Find events..." 
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
        <button className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
          <Filter className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <button 
            key={i}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              i === 0 ? "bg-teal-600 text-white" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {events.map((event) => (
          <GlassCard key={event.id} className="bg-white dark:bg-zinc-900 overflow-hidden" hoverable>
            <div className="h-40 relative">
              <ImageWithFallback 
                src={event.image} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-teal-600">
                {event.price}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{event.title}</h4>
                <p className="text-xs font-medium text-teal-600 uppercase tracking-wider">{event.org}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {event.date}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {event.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {event.attendees} attending
                </div>
              </div>

              <button className="w-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-3 rounded-xl transition-all hover:bg-slate-800 active:scale-95">
                Get Tickets
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
