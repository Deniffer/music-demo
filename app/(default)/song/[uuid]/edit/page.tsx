"use client";
import React, { useState, useEffect, useRef } from "react";
import { findByUuid } from "@/models/song";
import { Song } from "@/types/song";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function EditSongPage({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  const [song, setSong] = useState<Song | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    async function fetchSong() {
      const fetchedSong = await findByUuid(uuid);
      setSong(fetchedSong);
      if (fetchedSong && fetchedSong.duration) {
        setTrimEnd(fetchedSong.duration);
      }
    }
    fetchSong();
  }, [uuid]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setTrimEnd(audioRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTrimAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const response = await fetch(song!.audio_url!);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(
      arrayBuffer
    );

    const trimmedBuffer = audioContextRef.current.createBuffer(
      audioBuffer.numberOfChannels,
      (trimEnd - trimStart) * audioBuffer.sampleRate,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      for (let i = 0; i < trimmedBuffer.length; i++) {
        trimmedData[i] =
          channelData[i + Math.floor(trimStart * audioBuffer.sampleRate)];
      }
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }

    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = trimmedBuffer;
    sourceNodeRef.current.connect(audioContextRef.current.destination);
    sourceNodeRef.current.start();
  };

  if (!song) {
    return <div>Loading...</div>;
  }

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
        value={[currentTime]}
        onValueChange={(value) => {
          if (audioRef.current) {
            audioRef.current.currentTime = value[0];
          }
        }}
        className="mb-4"
      />
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Edit Song</h2>
        <div className="flex items-center mb-2">
          <span className="mr-2">Start:</span>
          <Slider
            min={0}
            max={duration}
            value={[trimStart]}
            onValueChange={(value) => setTrimStart(value[0])}
            className="w-1/3 mr-4"
          />
          <span>{trimStart.toFixed(2)}s</span>
        </div>
        <div className="flex items-center mb-2">
          <span className="mr-2">End:</span>
          <Slider
            min={0}
            max={duration}
            value={[trimEnd]}
            onValueChange={(value) => setTrimEnd(value[0])}
            className="w-1/3 mr-4"
          />
          <span>{trimEnd.toFixed(2)}s</span>
        </div>
        <Button onClick={handleTrimAudio} className="mt-2">
          Edit Song
        </Button>
      </div>
    </div>
  );
}
