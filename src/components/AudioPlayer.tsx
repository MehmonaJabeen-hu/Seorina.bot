import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Sparkles } from 'lucide-react';

interface AudioPlayerProps {
  base64Audio: string;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulated audio waveform heights
  const bars = [28, 45, 60, 35, 80, 50, 95, 70, 40, 85, 65, 30, 75, 90, 55, 40, 70, 60, 35, 25];

  useEffect(() => {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [base64Audio, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.25, 1.5];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div className="flex flex-col gap-2 p-3 bg-stone-50 border border-stone-200/80 rounded-2xl max-w-sm">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 shrink-0 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          aria-label={isPlaying ? 'Pause audio note' : 'Play audio note'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        {/* Waveform Visualization */}
        <div className="flex-1 flex items-center gap-[3px] h-8 px-1">
          {bars.map((heightPercent, idx) => {
            const barProgress = idx / bars.length;
            const isPlayed = barProgress <= progress;
            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full cursor-pointer"
                onClick={() => {
                  if (audioRef.current && duration > 0) {
                    audioRef.current.currentTime = barProgress * duration;
                  }
                }}
              >
                <div
                  className={`w-full rounded-full transition-all duration-150 ${
                    isPlayed
                      ? 'bg-rose-500'
                      : 'bg-stone-300'
                  } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: '4px',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Speed button */}
        <button
          onClick={cycleSpeed}
          className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 px-2 py-1 rounded bg-stone-200/60 hover:bg-stone-200 transition-colors shrink-0"
          title="Playback speed"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Meta Bar */}
      <div className="flex items-center justify-between text-[11px] text-stone-500 px-1 font-mono tabular-nums">
        <span className="flex items-center gap-1 text-rose-600 font-sans font-medium">
          <Sparkles className="w-3 h-3" /> Voice note
        </span>
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
