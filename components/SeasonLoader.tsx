import React, { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';

type Season = 'rain' | 'snow';

export const SeasonLoader: React.FC = () => {
  const [season, setSeason] = useState<Season>('rain');

  // Cycle seasons every 6 seconds
  useEffect(() => {
    const cycle = ['rain', 'snow'] as Season[];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % cycle.length;
      setSeason(cycle[i]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Generate elements for animations
  const renderRain = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-900/40">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="rain-drop"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.1 + Math.random() * 0.2
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-slate-900/20 mix-blend-overlay"></div>
    </div>
  );

  const renderSnow = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-900/20">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${3 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            opacity: 0.4 + Math.random() * 0.4
          }}
        />
      ))}
      <div className="absolute inset-0 bg-white/5 mix-blend-soft-light"></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white transition-colors duration-1000">
      
      {/* Background Layer */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${season === 'rain' ? 'opacity-100' : 'opacity-0'}`}>
        {renderRain()}
      </div>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${season === 'snow' ? 'opacity-100' : 'opacity-0'}`}>
        {renderSnow()}
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center animate-reveal">
        <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/20 mb-8 animate-rock">
          <Scale className="h-12 w-12 text-white drop-shadow-md" />
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
          Analyzing your contract...
        </h2>
        
        <div className="flex items-center space-x-2 text-slate-400 font-medium text-sm tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>{season === 'rain' ? 'Scanning Clauses' : 'Evaluating Risks'}</span>
        </div>
      </div>
    </div>
  );
};