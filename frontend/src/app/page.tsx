"use client";

import { useEffect, useState, useRef } from "react";
import VisualizerCanvas from "@/components/canvas/VisualizerCanvas";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import EmotionWebcam from "@/components/EmotionWebcam";
import DashboardModal from "@/components/DashboardModal";
import YouTube from 'react-youtube';

export default function Home() {
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [mood, setMood] = useState<'happy' | 'sad' | 'angry' | 'relaxed' | 'excited' | 'neutral'>('happy');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [playingTrack, setPlayingTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'library' | 'insights' | 'history' | 'settings'>('insights');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isSyncedLyrics, setIsSyncedLyrics] = useState(false);
  const [parsedLyrics, setParsedLyrics] = useState<{time: number, text: string}[]>([]);
  const playerRef = useRef<any>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  const audioData = useAudioAnalyzer(isVisualizing && isPlaying);

  const handleStart = () => {
    setIsVisualizing(true);
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!playingTrack || recommendations.length === 0) return;
    const currentIndex = recommendations.findIndex(t => t.videoId === playingTrack.videoId);
    const nextIndex = (currentIndex + 1) % recommendations.length;
    setPlayingTrack(recommendations[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!playingTrack || recommendations.length === 0) return;
    const currentIndex = recommendations.findIndex(t => t.videoId === playingTrack.videoId);
    const prevIndex = (currentIndex - 1 + recommendations.length) % recommendations.length;
    setPlayingTrack(recommendations[prevIndex]);
    setIsPlaying(true);
  };

  // Fetch new music recommendations when mood changes
  useEffect(() => {
    if (!isVisualizing) return;
    
    const fetchMusic = async () => {
      try {
        const res = await fetch(`http://localhost:8000/recommend-music/${mood}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (e) {
        console.error("Failed to fetch music", e);
      }
    };
    
    fetchMusic();
  }, [mood, isVisualizing]);

  // Fetch lyrics when showLyrics is toggled or track changes
  useEffect(() => {
    if (showLyrics && playingTrack?.videoId) {
      setLyrics(null);
      setIsSyncedLyrics(false);
      setParsedLyrics([]);
      
      const trackParam = encodeURIComponent(playingTrack.title);
      const artistParam = encodeURIComponent(playingTrack.artist);
      
      fetch(`http://localhost:8000/lyrics/${playingTrack.videoId}?track=${trackParam}&artist=${artistParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.synced && data.lyrics) {
            setIsSyncedLyrics(true);
            const lines = data.lyrics.split('\n');
            const parsed = [];
            for (const line of lines) {
              const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
              if (match) {
                const min = parseInt(match[1]);
                const sec = parseFloat(match[2]);
                const text = match[3].trim();
                if (text) {
                  parsed.push({ time: min * 60 + sec, text });
                }
              }
            }
            setParsedLyrics(parsed);
            setLyrics(data.lyrics);
          } else {
            setIsSyncedLyrics(false);
            setLyrics(data.lyrics || "No lyrics available.");
          }
        })
        .catch(() => setLyrics("Failed to load lyrics."));
    }
  }, [showLyrics, playingTrack]);

  // Update progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && playerRef.current) {
      interval = setInterval(async () => {
        try {
          const time = await playerRef.current.getCurrentTime();
          const dur = await playerRef.current.getDuration();
          setCurrentTime(time || 0);
          setDuration(dur || 0);
        } catch(e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Auto-scroll lyrics
  useEffect(() => {
    if (isSyncedLyrics && lyricsContainerRef.current) {
      const activeElement = lyricsContainerRef.current.querySelector('.lyric-active');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, isSyncedLyrics]);

  return (
    <>
      {/* 3D WebGL Canvas Visualizer */}
      <div className="absolute top-0 left-0 w-full h-full z-0 transition-opacity duration-1000">
        <VisualizerCanvas mood={mood} audioData={audioData} />
      </div>

      {/* Lyrics Overlay */}
      {showLyrics && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pt-24 pb-[200px] pointer-events-auto">
          <div ref={lyricsContainerRef} className="w-full max-w-4xl h-full overflow-y-auto scroll-smooth scroll-hide px-8 pb-32 mask-image-fade text-center flex flex-col items-center">
            {!lyrics ? (
              <p className="font-display-lg text-2xl text-white/50 animate-pulse mt-32">Loading lyrics...</p>
            ) : isSyncedLyrics ? (
              <div className="flex flex-col gap-8 pt-32 w-full max-w-2xl">
                {parsedLyrics.map((line, idx) => {
                  // Determine if this is the currently sung stanza
                  const isCurrent = currentTime >= line.time && (idx === parsedLyrics.length - 1 || currentTime < parsedLyrics[idx + 1].time);
                  
                  // Auto-scroll logic is handled by a useEffect looking for the .lyric-active class
                  return (
                    <p key={idx} 
                       className={`font-display-lg text-2xl md:text-5xl leading-tight transition-all duration-500 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] ${isCurrent ? 'lyric-active text-white scale-105 opacity-100 font-bold drop-shadow-[0_0_30px_rgba(0,219,233,0.8)]' : 'text-white/40 scale-100 opacity-50 hover:text-white/80'}`}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            ) : (
              <p className="whitespace-pre-line font-display-lg text-2xl md:text-5xl leading-relaxed text-white/90 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] mt-32">
                {lyrics}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="fixed top-0 w-full flex justify-between items-center px-[var(--spacing-gutter)] py-4 z-50 bg-transparent">
        <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            face_6
          </span>
          <h1 className="font-headline-lg-mobile text-[24px] font-bold tracking-tighter text-[var(--color-primary)] drop-shadow-[0_0_10px_rgba(0,219,233,0.4)]">
            MoodSync
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-8">
            <a className="font-label-caps text-[12px] text-[var(--color-primary)] tracking-widest uppercase cursor-pointer" onClick={() => window.scrollTo(0, 0)}>Visualizer</a>
            <a className="font-label-caps text-[12px] text-[var(--color-on-surface-variant)] tracking-widest uppercase hover:text-[var(--color-primary)] transition-colors cursor-pointer" onClick={() => { setDashboardTab('library'); setIsDashboardOpen(true); }}>Library</a>
            <a className="font-label-caps text-[12px] text-[var(--color-on-surface-variant)] tracking-widest uppercase hover:text-[var(--color-primary)] transition-colors cursor-pointer" onClick={() => { setDashboardTab('insights'); setIsDashboardOpen(true); }}>Insights</a>
          </div>
          <button className="material-symbols-outlined text-[var(--color-on-surface-variant)] hover:opacity-80 transition-opacity active:scale-95" onClick={() => { setDashboardTab('settings'); setIsDashboardOpen(true); }}>
            settings
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 w-full h-full flex flex-col pt-24 pb-32 px-[var(--spacing-gutter)] md:px-[var(--spacing-container-margin)]">
        
        {/* Center Focus Area (Disappears when started) */}
        <div
          className={`flex-grow flex flex-col items-center justify-center transition-all duration-700 ${
            isVisualizing ? "opacity-0 scale-90 pointer-events-none hidden" : "opacity-100 scale-100"
          }`}
        >
          <div className="text-center space-y-6">
            <h2 className="font-display-lg text-[40px] md:text-[72px] leading-tight font-extrabold tracking-tighter text-[var(--color-primary)]">
              SYNC YOUR SOUL
            </h2>
            <p className="font-body-md text-[16px] text-[var(--color-on-surface-variant)] max-w-md mx-auto">
              Emotional resonance engine active. Allow camera access to begin real-time generative mapping.
            </p>
            <button
              onClick={handleStart}
              className="mt-8 px-10 py-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-label-caps text-[12px] rounded-full shadow-[0_0_25px_rgba(0,219,233,0.5)] active:scale-95 transition-all hover:brightness-110 uppercase tracking-widest font-bold"
            >
              Start Visualizing
            </button>
          </div>
        </div>

        {/* HUD: Emotion Detection (Webcam Overlay) - Appears when started */}
        <EmotionWebcam isActive={isVisualizing} onEmotionUpdate={setMood} />

        {/* Bottom Slider: Mood Matches */}
        <section
          className={`mt-auto transition-all duration-1000 ${
            isVisualizing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          }`}
        >
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="font-label-caps text-[12px] text-[var(--color-primary)] tracking-widest uppercase">Current Vibe</span>
              <h3 className="font-headline-lg-mobile text-[24px] text-[var(--color-on-surface)] font-bold">Mood Matches</h3>
            </div>
            {playingTrack && (
              <div className="flex flex-col gap-2 glass-panel px-4 py-3 rounded-2xl border border-[var(--color-primary)]/40 animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_20px_rgba(0,219,233,0.2)] min-w-[280px] md:min-w-[340px]">
                <div className="flex items-center justify-between gap-4">
                  {/* Track Preview Info */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                      <img src={playingTrack.thumbnail} alt={playingTrack.title} className={`w-full h-full object-cover transition-transform duration-300 ${isPlaying ? 'scale-110' : 'scale-100 grayscale-[30%]'}`} />
                      {!isPlaying && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]"></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-[10px] text-[var(--color-primary)] uppercase tracking-wider">Now Playing</span>
                      <span className="font-mono-data text-[12px] text-[var(--color-on-surface)] truncate max-w-[120px] md:max-w-[200px]">{playingTrack.title}</span>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={handlePrev} className="material-symbols-outlined text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors active:scale-90">skip_previous</button>
                    
                    <button onClick={handlePlayPause} className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors active:scale-90">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    
                    <button onClick={handleNext} className="material-symbols-outlined text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors active:scale-90">skip_next</button>
                  </div>

                  {/* Equalizer & Lyrics */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 h-[12px]">
                      <div className={`eq-bar ${!isPlaying && '![animation-play-state:paused] h-[4px]'}`} style={{ animationDelay: '0s' }}></div>
                      <div className={`eq-bar ${!isPlaying && '![animation-play-state:paused] h-[4px]'}`} style={{ animationDelay: '0.2s' }}></div>
                      <div className={`eq-bar ${!isPlaying && '![animation-play-state:paused] h-[4px]'}`} style={{ animationDelay: '0.4s' }}></div>
                      <div className={`eq-bar ${!isPlaying && '![animation-play-state:paused] h-[4px]'}`} style={{ animationDelay: '0.6s' }}></div>
                    </div>
                    <button onClick={() => setShowLyrics(!showLyrics)} className={`text-[10px] font-label-caps transition-colors tracking-widest mt-1 uppercase ${showLyrics ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'}`}>
                      Lyrics
                    </button>
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="flex items-center gap-3 w-full mt-1">
                  <span className="text-[10px] font-mono-data text-[var(--color-on-surface-variant)] flex-shrink-0 w-8 text-right">{formatTime(currentTime)}</span>
                  <input 
                    type="range" 
                    min={0} 
                    max={duration || 100} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="w-full h-[3px] bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] hover:h-[5px] transition-all"
                  />
                  <span className="text-[10px] font-mono-data text-[var(--color-on-surface-variant)] flex-shrink-0 w-8">{formatTime(duration)}</span>
                </div>

                {/* Hidden YouTube Player */}
                {playingTrack && (
                  <div className="hidden">
                    <YouTube
                      videoId={playingTrack.videoId}
                      opts={{
                        playerVars: { autoplay: 1, controls: 0, disablekb: 1 },
                      }}
                      onReady={(e) => { playerRef.current = e.target; }}
                      onStateChange={(e) => {
                        // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
                        if (e.data === 1) setIsPlaying(true);
                        else if (e.data === 2) setIsPlaying(false);
                        else if (e.data === 0) handleNext();
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            <button className="font-mono-data text-[14px] text-[var(--color-on-surface-variant)] flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors" onClick={() => window.open('https://music.youtube.com/', '_blank')}>
              View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto scroll-hide pb-4">
            {recommendations.length > 0 ? (
              recommendations.map((track, i) => (
                <div key={track.videoId} onClick={() => { setPlayingTrack(track); setIsPlaying(true); }} className={`flex-shrink-0 w-[240px] md:w-[300px] glass-panel rounded-2xl p-4 flex gap-4 group cursor-pointer transition-all duration-300 ${playingTrack?.videoId === track.videoId ? 'border border-[var(--color-primary)] shadow-[0_0_15px_rgba(0,219,233,0.3)]' : 'hover:border-[var(--color-primary)]/40'}`}>
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                    {track.thumbnail && (
                      <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">play_arrow</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center flex-grow overflow-hidden">
                    <div className="energy-bar mb-1" style={{ animationDelay: `${i * 0.2}s` }}></div>
                    <h4 className="font-headline-lg-mobile text-[16px] text-[var(--color-on-surface)] truncate font-semibold" title={track.title}>{track.title}</h4>
                    <p className="font-mono-data text-[12px] text-[var(--color-on-surface-variant)] uppercase tracking-wider truncate" title={track.artist}>{track.artist}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[var(--color-on-surface-variant)] text-sm flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin">refresh</span> Loading vibes...
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-6 left-0 right-0 mx-auto z-50 flex justify-around items-center px-4 py-2 max-w-md bg-[var(--color-surface)]/5 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_0_30px_rgba(0,219,233,0.2)]">
        <button onClick={() => window.scrollTo(0,0)} className="flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full w-12 h-12 shadow-[0_0_20px_rgba(0,219,233,0.6)] active:scale-90 duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </button>
        <button onClick={() => { setDashboardTab('history'); setIsDashboardOpen(true); }} className="flex items-center justify-center text-[var(--color-on-surface-variant)] w-12 h-12 hover:text-[var(--color-primary)] transition-colors active:scale-90 duration-200">
          <span className="material-symbols-outlined">history</span>
        </button>
        <button onClick={() => { setDashboardTab('library'); setIsDashboardOpen(true); }} className="flex items-center justify-center text-[var(--color-on-surface-variant)] w-12 h-12 hover:text-[var(--color-primary)] transition-colors active:scale-90 duration-200">
          <span className="material-symbols-outlined">queue_music</span>
        </button>
        <button onClick={() => { setDashboardTab('settings'); setIsDashboardOpen(true); }} className="flex items-center justify-center text-[var(--color-on-surface-variant)] w-12 h-12 hover:text-[var(--color-primary)] transition-colors active:scale-90 duration-200">
          <span className="material-symbols-outlined">person</span>
        </button>
      </nav>

      <DashboardModal 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
        activeTab={dashboardTab}
        onTabChange={setDashboardTab as any}
        playingTrack={playingTrack}
      />
    </>
  );
}
