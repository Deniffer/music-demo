"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Song } from "@/types/song";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  PlayCircle,
  PauseCircle,
  Scissors,
  Download,
  RotateCcw,
} from "lucide-react";
import { bufferToWav, formatTime } from "@/lib/utils";
import { set } from "react-hook-form";

export function Content({ song }: { song: Song }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editCurrentTime, setEditCurrentTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      if (!song.audio_url) {
        console.error("No audio URL found for song:", song);
        return;
      }

      try {
        const response = await fetch(song.audio_url);
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await audioContextRef.current.decodeAudioData(
          arrayBuffer
        );
        setAudioBuffer(decodedBuffer);
        setDuration(decodedBuffer.duration);
        setTrimRange([0, decodedBuffer.duration]);
      } catch (error) {
        console.error("Error fetching audio:", error);
      }
    };

    fetchAudio();
  }, [song.audio_url]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      if (isEditMode) {
        // In edit mode, update editCurrentTime relative to the trim start
        const relativeTime = audioRef.current.currentTime - trimRange[0];
        setEditCurrentTime(
          Math.max(0, Math.min(relativeTime, trimRange[1] - trimRange[0]))
        );
      } else {
        setCurrentTime(audioRef.current.currentTime);
      }
    }
  }, [isEditMode, trimRange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setIsEditMode(false);
      });
    }
    return () => {
      if (audio) {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", () => {
          setIsPlaying(false);
          setIsEditMode(false);
        });
      }
    };
  }, [handleTimeUpdate]);

  const playAudio = useCallback(
    (start: number, end: number) => {
      if (!audioContextRef.current || !audioBuffer) return;

      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }

      //   const startSample = Math.floor(start * audioBuffer.sampleRate);
      //   const endSample = Math.floor(end * audioBuffer.sampleRate);

      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = audioBuffer;
      sourceNodeRef.current.connect(audioContextRef.current.destination);
      sourceNodeRef.current.start(0, start, end - start);
      sourceNodeRef.current.addEventListener("timeupdate", handleTimeUpdate);
      sourceNodeRef.current.onended = () => {
        setIsPlaying(false);
        setEditCurrentTime(0); // Reset edit current time when playback ends
      };
      setIsPlaying(true);

      // Update editCurrentTime during playback
      const updateEditTime = () => {
        if (isPlaying && isEditMode) {
          setEditCurrentTime((prevTime) => {
            const newTime = prevTime + 0.1; // Update every 100ms
            if (newTime >= trimRange[1] - trimRange[0]) {
              setIsPlaying(false);
              return 0;
            }
            return newTime;
          });
          requestAnimationFrame(updateEditTime);
        }
      };
      requestAnimationFrame(updateEditTime);
    },
    [audioBuffer, isEditMode, isPlaying, trimRange]
  );

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (isEditMode) {
        playAudio(trimRange[0], trimRange[1]);
      } else {
        if (audioRef.current) {
          audioRef.current.currentTime = currentTime;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  }, [isPlaying, isEditMode, trimRange, currentTime, playAudio]);

  const handleSliderChange = useCallback((value: number[]) => {
    setTrimRange(value as [number, number]);
    setCurrentTime(value[0]);
    setEditCurrentTime(value[0]);
  }, []);

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const newValue = parseFloat(value);
      if (!isNaN(newValue) && newValue >= 0 && newValue <= duration) {
        setTrimRange((prev) => {
          const newRange = [...prev] as [number, number];
          newRange[index] = newValue;
          return newRange;
        });
      }
    },
    [duration]
  );

  const handleTrimAndDownload = useCallback(async () => {
    if (!audioBuffer || !audioContextRef.current) return;

    setIsProcessing(true);
    try {
      const startSample = Math.floor(trimRange[0] * audioBuffer.sampleRate);
      const endSample = Math.floor(trimRange[1] * audioBuffer.sampleRate);
      const trimmedBuffer = audioContextRef.current.createBuffer(
        audioBuffer.numberOfChannels,
        endSample - startSample,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < trimmedBuffer.length; i++) {
          trimmedData[i] = channelData[i + startSample];
        }
      }

      const wavBuffer = bufferToWav(trimmedBuffer);
      const blob = new Blob([wavBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${song.title}_trimmed.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error trimming audio:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [audioBuffer, song.title, trimRange]);

  const resetToOriginal = useCallback(() => {
    setIsEditMode(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setEditCurrentTime(0);
    setTrimRange([0, duration]);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [duration]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Song: {song.title}</h1>
      <p className="text-lg mb-2">Artist: {song.artist || "匿名"}</p>
      <p className="text-lg mb-4">Duration: {formatTime(duration)}</p>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={togglePlayPause}
            className="flex items-center text-lg"
          >
            {isPlaying ? (
              <PauseCircle className="mr-2" />
            ) : (
              <PlayCircle className="mr-2" />
            )}
            {isPlaying
              ? "Pause"
              : `Play ${isEditMode ? "Trimmed" : "Original"}`}
          </Button>
          <div className="text-lg font-semibold">
            {isEditMode
              ? `${formatTime(editCurrentTime)} / ${formatTime(
                  trimRange[1] - trimRange[0]
                )}`
              : `${formatTime(currentTime)} / ${formatTime(duration)}`}
          </div>
        </div>

        <Slider
          min={0}
          max={duration}
          step={0.1}
          value={trimRange}
          onValueChange={handleSliderChange}
          className="mb-4"
        />

        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center">
            <span className="mr-2">Start:</span>
            <Input
              type="number"
              min={0}
              max={duration}
              step={0.1}
              value={trimRange[0].toFixed(1)}
              onChange={(e) => handleInputChange(0, e.target.value)}
              className="w-20 mr-2"
            />
            <span>{formatTime(trimRange[0])}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">End:</span>
            <Input
              type="number"
              min={0}
              max={duration}
              step={0.1}
              value={trimRange[1].toFixed(1)}
              onChange={(e) => handleInputChange(1, e.target.value)}
              className="w-20 mr-2"
            />
            <span>{formatTime(trimRange[1])}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          onClick={() => setIsEditMode(true)}
          className="flex items-center text-lg"
          variant={isEditMode ? "default" : "outline"}
        >
          <Scissors className="mr-2" />
          {isEditMode ? "Editing Mode" : "Enter Edit Mode"}
        </Button>
        <Button
          onClick={handleTrimAndDownload}
          className="flex items-center text-lg"
          disabled={isProcessing || !isEditMode}
        >
          <Download className="mr-2" />
          {isProcessing ? "Processing..." : "Download Trimmed"}
        </Button>
        <Button
          onClick={resetToOriginal}
          className="flex items-center text-lg"
          variant="outline"
        >
          <RotateCcw className="mr-2" />
          Reset
        </Button>
      </div>

      <audio ref={audioRef} src={song.audio_url} style={{ display: "none" }} />
    </div>
  );
}
