"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type CallStatus = "idle" | "connecting" | "active" | "ended";

interface TranscriptEntry {
  id: string;
  speaker: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function LiveVoicePage() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (status === "ended") setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startCall = () => {
    setStatus("connecting");
    setTranscript([]);
    setTimeout(() => {
      setStatus("active");
      setTranscript([
        {
          id: "1",
          speaker: "ai",
          text: "Hello! I'm Contact360 AI. How can I assist you today?",
          timestamp: new Date(),
        },
      ]);
    }, 1800);
  };

  const endCall = () => {
    setStatus("ended");
    setTimeout(() => setStatus("idle"), 2000);
  };

  const statusColors: Record<CallStatus, string> = {
    idle: "secondary",
    connecting: "warning",
    active: "success",
    ended: "danger",
  };

  const statusLabels: Record<CallStatus, string> = {
    idle: "Ready",
    connecting: "Connecting…",
    active: "Live",
    ended: "Call Ended",
  };

  return (
    <div className="c360-voice-page">
      <div className="c360-standalone-header">
        <h1 className="c360-standalone-header__title">Live Voice AI</h1>
        <p className="c360-standalone-header__subtitle">
          Talk to the Contact360 AI assistant in real time.
        </p>
      </div>

      <div className="c360-2col-grid">
        {/* Call panel */}
        <Card>
          <div className="c360-voice-panel">
            {/* Status */}
            <div className="c360-voice-status-row">
              <Badge
                color={
                  statusColors[status] as
                    | "success"
                    | "danger"
                    | "warning"
                    | "secondary"
                }
              >
                {statusLabels[status]}
              </Badge>
              {status === "active" && (
                <span className="c360-voice-duration">
                  {formatDuration(duration)}
                </span>
              )}
            </div>

            {/* Avatar */}
            <div
              className={cn(
                "c360-voice-avatar",
                status === "active" && "c360-voice-avatar--active",
              )}
            >
              {status === "connecting" ? (
                <Loader2 size={40} color="#fff" className="c360-spin" />
              ) : (
                <Mic
                  size={40}
                  color={
                    status === "active" ? "#fff" : "var(--c360-text-muted)"
                  }
                />
              )}
            </div>

            {/* Controls */}
            <div className="c360-voice-controls">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                disabled={status !== "active"}
                className={cn(
                  "c360-voice-ctrl",
                  isMuted ? "c360-voice-ctrl--muted" : undefined,
                )}
              >
                {isMuted ? (
                  <MicOff size={20} color="#fff" />
                ) : (
                  <Mic size={20} color="var(--c360-text-secondary)" />
                )}
              </button>

              {status === "idle" || status === "ended" ? (
                <button
                  type="button"
                  onClick={startCall}
                  title="Start call"
                  className="c360-voice-phone c360-voice-phone--start"
                >
                  <Phone size={28} color="#fff" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={endCall}
                  disabled={status === "connecting"}
                  title="End call"
                  className="c360-voice-phone c360-voice-phone--end"
                >
                  <PhoneOff size={28} color="#fff" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                disabled={status !== "active"}
                className={cn(
                  "c360-voice-ctrl",
                  !isSpeakerOn && "c360-voice-ctrl--speaker-off",
                )}
              >
                {isSpeakerOn ? (
                  <Volume2 size={20} color="var(--c360-text-secondary)" />
                ) : (
                  <VolumeX size={20} color="#fff" />
                )}
              </button>
            </div>

            <p className="c360-voice-hint">
              {status === "idle" && "Press the green button to start a call"}
              {status === "connecting" && "Establishing secure connection…"}
              {status === "active" &&
                (isMuted ? "Microphone is muted" : "Microphone is active")}
              {status === "ended" && "Call has ended"}
            </p>
          </div>
        </Card>

        {/* Transcript */}
        <Card title="Live Transcript">
          <div className="c360-transcript-box">
            {transcript.length === 0 ? (
              <div className="c360-transcript-empty">
                <Activity size={32} className="c360-opacity-30" />
                <span className="c360-text-sm">
                  Transcript will appear here during the call
                </span>
              </div>
            ) : (
              <div className="c360-transcript-list">
                {transcript.map((entry) => (
                  <div key={entry.id}>
                    <div className="c360-transcript-speaker">
                      {entry.speaker === "user" ? "You" : "AI"} ·{" "}
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                    <div
                      className={cn(
                        "c360-transcript-bubble",
                        `c360-transcript-bubble--${entry.speaker}`,
                      )}
                    >
                      {entry.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
