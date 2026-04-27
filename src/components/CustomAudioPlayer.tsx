"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";

export default function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    
    // Listen for global pause events triggered by other players
    const handlePauseOthers = (e: Event) => {
      const target = e as CustomEvent;
      if (target.detail.src !== src) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    window.addEventListener("spy-audio-play", handlePauseOthers);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      window.removeEventListener("spy-audio-play", handlePauseOthers);
    };
  }, [src]);

  const togglePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Dispatch event to pause others
        const event = new CustomEvent("spy-audio-play", { detail: { src } });
        window.dispatchEvent(event);
        
        setIsPlaying(true);
        try {
          await audioRef.current.play();
        } catch (error) {
          // Playback blocked or interrupted by pause (AbortError) happens commonly
          setIsPlaying(false);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : playbackSpeed === 2 ? 0.5 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = "spy_recording.wav";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
      // Fallback if fetch blocks cross-origin blob creation
      window.open(src, "_blank");
    }
  };

  return (
    <div className="custom-audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button onClick={togglePlay} className="play-btn" aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause size={18} className="icon-pause" /> : <Play size={18} className="icon-play" style={{ marginLeft: "2px" }} />}
      </button>

      <div className="progress-container">
        <div className="time-display current-time">
          {formatTime(audioRef.current?.currentTime || 0)}
        </div>
        
        <div className="track-wrapper">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress || 0} 
            onChange={handleSeek}
            className="progress-bar"
          />
        </div>

        <div className="time-display duration-time">
          {formatTime(duration)}
        </div>
      </div>

      <div className="audio-actions">
        <button onClick={toggleSpeed} className="speed-btn" aria-label="Playback Speed">
          {playbackSpeed}x
        </button>
        <button onClick={handleDownload} className="download-btn" aria-label="Download Recording">
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
