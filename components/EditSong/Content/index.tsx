"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Song } from "@/types/song";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function Content({ song }: { song: Song }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

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
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", () => setIsPlaying(false));
    }
    return () => {
      if (audio) {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", () => setIsPlaying(false));
      }
    };
  }, [handleTimeUpdate]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.currentTime = trimRange[0];
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, trimRange]);

  const handleTrimPreview = useCallback(() => {
    if (!audioContextRef.current || !audioBuffer) return;

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

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

    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = trimmedBuffer;
    sourceNodeRef.current.connect(audioContextRef.current.destination);
    sourceNodeRef.current.start();
    setIsPlaying(true);
  }, [audioBuffer, trimRange]);

  const handleSliderChange = useCallback((value: number[]) => {
    setTrimRange(value as [number, number]);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{song.title}</h1>
      <div className="mb-4">
        <p>Artist: {song.artist || "匿名"}</p>
        <p>Duration: {duration.toFixed(2)}s</p>
      </div>
      <audio ref={audioRef} src={song.audio_url} />
      <div className="flex items-center mb-4">
        <Button onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <div className="ml-4">
          {currentTime.toFixed(2)} / {duration.toFixed(2)}
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
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Edit Song</h2>
        <div className="flex items-center mb-2">
          <span className="mr-2">Start: {trimRange[0].toFixed(2)}s</span>
          <span className="ml-4 mr-2">End: {trimRange[1].toFixed(2)}s</span>
        </div>
        <Button onClick={handleTrimPreview} className="mt-2">
          Preview Trim
        </Button>
      </div>
    </div>
  );
}
