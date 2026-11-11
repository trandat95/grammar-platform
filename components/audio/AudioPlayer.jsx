import React, { useState, useEffect } from "react";
import { speechService } from "../../lib/audio/speech.service";
import { SPEECH_LOCALES, PLAYBACK_SPEEDS } from "../../lib/audio/speech.constants";

export default function AudioPlayer({
  text = "",
  compact = false,
  isLight = false,
  onPlay = null,
  onEnd = null,
}) {
  const [speechState, setSpeechState] = useState(speechService.getState());

  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setSpeechState(state);
    });
    return unsubscribe;
  }, []);

  const isCurrentPlaying = speechState.isSpeaking && speechState.currentText === text;
  const isCurrentPaused = isCurrentPlaying && speechState.isPaused;

  const handleTogglePlay = () => {
    if (isCurrentPaused) {
      speechService.resume();
    } else if (isCurrentPlaying) {
      speechService.pause();
    } else {
      if (onPlay) onPlay();
      speechService.speak(text, { onEnd });
    }
  };

  const handleStop = () => {
    speechService.stop();
  };

  const handleChangeLocale = (locale) => {
    speechService.setLocale(locale);
  };

  const handleChangeRate = (rate) => {
    speechService.setRate(rate);
  };

  // Compact Inline Variant (for sentence rows & formula examples)
  if (compact) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
        <button
          type="button"
          onClick={handleTogglePlay}
          title={isCurrentPlaying ? (isCurrentPaused ? "Tiếp tục đọc" : "Tạm dừng") : `Nghe phát âm (${speechState.locale === "en-GB" ? "Anh - Anh" : "Anh - Mỹ"} ${speechState.rate}x)`}
          aria-label={isCurrentPlaying ? "Pause audio" : "Play English pronunciation"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.2rem 0.55rem",
            backgroundColor: isCurrentPlaying ? (isLight ? "#ecfdf5" : "rgba(16, 185, 129, 0.15)") : (isLight ? "#ffffff" : "#181820"),
            border: `1px solid ${isCurrentPlaying ? "#10b981" : (isLight ? "#cbd5e1" : "#2e2e3a")}`,
            borderRadius: "6px",
            color: isCurrentPlaying ? (isLight ? "#047857" : "#34d399") : (isLight ? "#2563eb" : "#38bdf8"),
            fontSize: "0.72rem",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>{isCurrentPlaying ? (isCurrentPaused ? "▶️" : "⏸️") : "🔊"}</span>
          <span>{isCurrentPlaying ? (isCurrentPaused ? "Tiếp tục" : "Dừng") : "Nghe"}</span>
        </button>

        {isCurrentPlaying && (
          <button
            type="button"
            onClick={handleStop}
            title="Dừng phát âm"
            aria-label="Stop audio"
            style={{
              padding: "0.2rem 0.45rem",
              backgroundColor: isLight ? "#fef2f2" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${isLight ? "#fecaca" : "#ef444450"}`,
              borderRadius: "6px",
              color: isLight ? "#dc2626" : "#f87171",
              fontSize: "0.72rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ⏹
          </button>
        )}
      </div>
    );
  }

  // Full Control Card Variant (for Detail Panels & Learning Modules)
  return (
    <div
      style={{
        backgroundColor: isLight ? "#f8fafc" : "#121217",
        border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        {/* Left: Playback Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.85rem",
              backgroundColor: isCurrentPlaying ? (isCurrentPaused ? "#f59e0b" : "#10b981") : "#2563eb",
              border: "none",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <span>{isCurrentPlaying ? (isCurrentPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng") : "🔊 Phát âm"}</span>
          </button>

          {isCurrentPlaying && (
            <button
              type="button"
              onClick={handleStop}
              title="Dừng phát âm"
              style={{
                padding: "0.35rem 0.6rem",
                backgroundColor: isLight ? "#fef2f2" : "#27272a",
                border: `1px solid ${isLight ? "#fecaca" : "#ef444450"}`,
                borderRadius: "6px",
                color: isLight ? "#dc2626" : "#f87171",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ⏹ Dừng
            </button>
          )}

          {isCurrentPlaying && !isCurrentPaused && (
            <span style={{ fontSize: "0.72rem", color: isLight ? "#059669" : "#34d399", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", animation: "pulse 1.5s infinite" }} />
              Đang đọc...
            </span>
          )}
        </div>

        {/* Right: Accent & Speed Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Accent Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <span style={{ fontSize: "0.7rem", color: isLight ? "#64748b" : "#a1a1aa", fontWeight: "600" }}>Giọng:</span>
            {Object.values(SPEECH_LOCALES).map((loc) => {
              const isSelected = speechState.locale === loc.code;
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => handleChangeLocale(loc.code)}
                  style={{
                    padding: "0.2rem 0.45rem",
                    borderRadius: "4px",
                    border: `1px solid ${isSelected ? (isLight ? "#bfdbfe" : "#38bdf880") : (isLight ? "#e2e8f0" : "#272733")}`,
                    backgroundColor: isSelected ? (isLight ? "#eff6ff" : "#0c4a6e40") : "transparent",
                    color: isSelected ? (isLight ? "#1d4ed8" : "#38bdf8") : (isLight ? "#64748b" : "#a1a1aa"),
                    fontSize: "0.7rem",
                    fontWeight: isSelected ? "700" : "500",
                    cursor: "pointer",
                  }}
                >
                  {loc.flag} {loc.code === "en-GB" ? "UK" : "US"}
                </button>
              );
            })}
          </div>

          {/* Speed Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <span style={{ fontSize: "0.7rem", color: isLight ? "#64748b" : "#a1a1aa", fontWeight: "600" }}>Tốc độ:</span>
            {PLAYBACK_SPEEDS.map((sp) => {
              const isSelected = speechState.rate === sp.value;
              return (
                <button
                  key={sp.value}
                  type="button"
                  onClick={() => handleChangeRate(sp.value)}
                  title={sp.description}
                  style={{
                    padding: "0.2rem 0.45rem",
                    borderRadius: "4px",
                    border: `1px solid ${isSelected ? (isLight ? "#bbf7d0" : "#34d39980") : (isLight ? "#e2e8f0" : "#272733")}`,
                    backgroundColor: isSelected ? (isLight ? "#f0fdf4" : "#064e3b40") : "transparent",
                    color: isSelected ? (isLight ? "#15803d" : "#34d399") : (isLight ? "#64748b" : "#a1a1aa"),
                    fontSize: "0.7rem",
                    fontWeight: isSelected ? "700" : "500",
                    cursor: "pointer",
                  }}
                >
                  {sp.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
