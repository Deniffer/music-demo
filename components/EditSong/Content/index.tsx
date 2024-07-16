"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Song } from "@/types/song";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayCircle, PauseCircle, Scissors, Download } from "lucide-react";
import { bufferToWav, formatTime } from "@/lib/utils";

export function Content({ song }: { song: Song }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setIsPreviewMode(false);
      });
    }
    return () => {
      if (audio) {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", () => {
          setIsPlaying(false);
          setIsPreviewMode(false);
        });
      }
    };
  }, [handleTimeUpdate]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (isPreviewMode) {
          handleTrimPreview();
        } else {
          audioRef.current.currentTime = trimRange[0];
          audioRef.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, trimRange, isPreviewMode]);

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

  const handleSliderChange = useCallback(
    (value: number[]) => {
      setTrimRange(value as [number, number]);
      if (audioRef.current && !isPlaying) {
        audioRef.current.currentTime = value[0];
        setCurrentTime(value[0]);
      }
    },
    [isPlaying]
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

      // Convert AudioBuffer to WAV
      const wavBuffer = bufferToWav(trimmedBuffer);
      const blob = new Blob([wavBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
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
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <div className="text-lg font-semibold">
            {formatTime(currentTime)} / {formatTime(duration)}
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

        <div className="flex justify-between text-sm text-gray-600">
          <span>Start: {formatTime(trimRange[0])}</span>
          <span>End: {formatTime(trimRange[1])}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          onClick={() => {
            setIsPreviewMode(true);
            handleTrimPreview();
          }}
          className="flex items-center text-lg"
        >
          <Scissors className="mr-2" />
          Preview Trim
        </Button>
        <Button
          onClick={handleTrimAndDownload}
          className="flex items-center text-lg"
          disabled={isProcessing}
        >
          <Download className="mr-2" />
          {isProcessing ? "Processing..." : "Download Trimmed Audio"}
        </Button>
        <Button
          onClick={() => {
            setIsPreviewMode(false);
            if (audioRef.current) {
              audioRef.current.currentTime = trimRange[0];
            }
          }}
          className="flex items-center text-lg"
          variant="outline"
        >
          Reset to Original
        </Button>
      </div>

      <audio ref={audioRef} src={song.audio_url} style={{ display: "none" }} />
    </div>
  );
}
