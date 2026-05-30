"use client";

import { useEffect, useState } from "react";

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'library' | 'insights' | 'history' | 'settings';
  onTabChange: (tab: 'library' | 'insights' | 'history' | 'settings') => void;
  playingTrack?: any;
}

export default function DashboardModal({ isOpen, onClose, activeTab, onTabChange, playingTrack }: DashboardModalProps) {
  if (!isOpen) return null;

  const tabs = [
    { id: 'library', label: 'Library', icon: 'queue_music' },
    { id: 'insights', label: 'Insights', icon: 'analytics' },
    { id: 'history', label: 'History', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl h-full max-h-[800px] flex flex-col glass-panel bg-[var(--color-surface)]/80 rounded-3xl border border-[var(--color-primary)]/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome_mosaic
            </span>
            <h2 className="font-headline-lg text-2xl text-[var(--color-on-surface)] font-bold tracking-tight">MoodSync Dashboard</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-[var(--color-on-surface-variant)] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Nav */}
          <nav className="flex md:flex-col gap-2 p-4 md:p-6 border-b md:border-b-0 md:border-r border-white/5 overflow-x-auto md:w-64 flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-label-caps tracking-widest text-sm uppercase whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30' 
                    : 'text-[var(--color-on-surface-variant)] hover:bg-white/5 hover:text-[var(--color-on-surface)]'
                }`}
              >
                <span className="material-symbols-outlined" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto scroll-hide">
            
            {activeTab === 'library' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-display-lg text-2xl text-[var(--color-primary)]">Your Saved Tracks</h3>
                  <span className="font-mono-data text-sm text-[var(--color-on-surface-variant)]">12 Tracks</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mock Library Items */}
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer group">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-highest flex-shrink-0 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20"></div>
                         <span className="material-symbols-outlined absolute inset-0 m-auto w-6 h-6 text-white/50 group-hover:text-white transition-colors">music_note</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-on-surface)]">Vocal Anthem {i}</h4>
                        <p className="font-mono-data text-xs text-[var(--color-on-surface-variant)] mt-1">Added 2 days ago</p>
                      </div>
                      <button className="ml-auto material-symbols-outlined text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)]">favorite</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
                <h3 className="font-display-lg text-2xl text-[var(--color-primary)]">Emotional Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-tertiary-fixed-dim)] mb-2">local_fire_department</span>
                    <h4 className="font-mono-data text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest">Current Streak</h4>
                    <p className="font-display-lg text-4xl mt-1 text-[var(--color-on-surface)]">5 <span className="text-xl">Days</span></p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-primary)] mb-2">face_5</span>
                    <h4 className="font-mono-data text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest">Dominant Mood</h4>
                    <p className="font-display-lg text-4xl mt-1 text-[var(--color-on-surface)]">Happy</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-secondary)] mb-2">headphones</span>
                    <h4 className="font-mono-data text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest">Tracks Synced</h4>
                    <p className="font-display-lg text-4xl mt-1 text-[var(--color-on-surface)]">142</p>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center min-h-[300px]">
                   <div className="relative w-48 h-48 rounded-full border-[16px] border-[var(--color-surface-container-low)] flex items-center justify-center mb-6">
                     <div className="absolute inset-0 rounded-full border-[16px] border-[var(--color-primary)] border-r-transparent border-b-transparent transform -rotate-45"></div>
                     <div className="absolute inset-0 rounded-full border-[16px] border-[var(--color-secondary)] border-l-transparent border-t-transparent border-b-transparent transform rotate-45"></div>
                     <span className="font-display-lg text-3xl font-bold">60%</span>
                   </div>
                   <p className="font-body-md text-[var(--color-on-surface-variant)] text-center max-w-md">
                     Your sessions are overwhelmingly positive! 60% of your visualizer time is spent in the 'Happy' or 'Excited' state.
                   </p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                <h3 className="font-display-lg text-2xl text-[var(--color-primary)]">Session Journal</h3>
                <div className="relative pl-6 border-l-2 border-[var(--color-primary)]/20 space-y-8">
                  {/* Mock Timeline */}
                  {[
                    { day: 'Today', mood: 'Relaxed', time: '2h 15m', desc: 'Ambient vibes during deep work.' },
                    { day: 'Yesterday', mood: 'Excited', time: '45m', desc: 'Pre-workout hype session.' },
                    { day: 'May 28', mood: 'Happy', time: '1h 30m', desc: 'Weekend pop mixes.' }
                  ].map((entry, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-surface)]"></div>
                      <h4 className="font-bold text-lg text-[var(--color-on-surface)]">{entry.day}</h4>
                      <div className="mt-2 p-5 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-mono-data text-xs uppercase">{entry.mood}</span>
                          <span className="text-xs text-[var(--color-on-surface-variant)]"><span className="material-symbols-outlined text-[14px] align-middle mr-1">timer</span>{entry.time}</span>
                        </div>
                        <p className="text-[var(--color-on-surface-variant)] text-sm">{entry.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
                <h3 className="font-display-lg text-2xl text-[var(--color-primary)]">Profile & Settings</h3>
                
                <div className="flex items-center gap-6 p-6 rounded-3xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] p-1">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=MoodSync" alt="Avatar" className="w-full h-full rounded-full bg-[var(--color-surface)]" />
                  </div>
                  <div>
                    <h4 className="font-display-lg text-2xl text-[var(--color-on-surface)]">Aura User</h4>
                    <p className="font-mono-data text-sm text-[var(--color-on-surface-variant)] mt-1">Pro Plan Member</p>
                  </div>
                  <button className="ml-auto px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-label-caps text-xs">Edit Profile</button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-label-caps text-[var(--color-on-surface-variant)] tracking-widest uppercase text-sm mb-4">Preferences</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <h5 className="font-bold text-[var(--color-on-surface)]">Camera Smoothing</h5>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Prevents erratic visualizer jumps.</p>
                    </div>
                    <div className="w-12 h-6 bg-[var(--color-primary)] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <h5 className="font-bold text-[var(--color-on-surface)]">Connect Spotify</h5>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Sync visualizer to your premium account.</p>
                    </div>
                    <button className="px-4 py-2 rounded-full bg-[#1DB954] text-white font-bold text-xs hover:brightness-110">Connect</button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <h5 className="font-bold text-[var(--color-on-surface)]">Data Privacy</h5>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">We do not store your webcam frames.</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs">View Policy</button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
