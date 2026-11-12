import React, { useState, useEffect } from "react";
import { speechService } from "../../lib/audio/speech.service";
import { SPEECH_LOCALES, PLAYBACK_SPEEDS } from "../../lib/audio/speech.constants";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import KitIcon from "../ui-2026/KitIcon";

export default function AudioPlayer({
  text = "",
  compact = false,
  isLight = false,
  onPlay = null,
  onEnd = null,
}) {
  const [speechState, setSpeechState] = useState(speechService.getState());
  const T = getThemeTokens(isLight);

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
          title={
            isCurrentPlaying
              ? isCurrentPaused
                ? "Tiếp tục đọc"
                : "Tạm dừng"
              : `Nghe phát âm (${speechState.locale === "en-GB" ? "Anh - Anh" : "Anh - Mỹ"} ${speechState.rate}x)`
          }
          aria-label={isCurrentPlaying ? "Pause audio" : "Play English pronunciation"}
          className="ds-focusable"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.22rem 0.58rem",
            backgroundColor: isCurrentPlaying ? T.successBg : T.card,
            border: `1px solid ${isCurrentPlaying ? T.successBorder : T.border}`,
            borderRadius: "6px",
            color: isCurrentPlaying ? T.success : T.accent,
            fontSize: "0.72rem",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {isCurrentPlaying ? (
            <span>{isCurrentPaused ? "▶️" : "⏸️"}</span>
          ) : (
            <KitIcon name="tool-audio" size={13} />
          )}
          <span>{isCurrentPlaying ? (isCurrentPaused ? "Tiếp tục" : "Dừng") : "Nghe"}</span>
        </button>

        {isCurrentPlaying && (
          <button
            type="button"
            onClick={handleStop}
            title="Dừng phát âm"
            aria-label="Stop audio"
            className="ds-focusable"
            style={{
              padding: "0.2rem 0.45rem",
              backgroundColor: T.dangerBg,
              border: `1px solid ${T.dangerBorder}`,
              borderRadius: "6px",
              color: T.danger,
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
        backgroundColor: T.bgElevated,
        border: `1px solid ${T.cardBorder}`,
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
            className="ds-btn ds-focusable"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.85rem",
              backgroundColor: isCurrentPlaying
                ? isCurrentPaused
                  ? "var(--ds-btn-warning)"
                  : "var(--ds-btn-success)"
                : "var(--ds-btn-primary)",
              border: "none",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: T.shadow,
            }}
          >
            <span>{isCurrentPlaying ? (isCurrentPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng") : "🔊 Phát âm"}</span>
          </button>

          {isCurrentPlaying && (
            <button
              type="button"
              onClick={handleStop}
              title="Dừng phát âm"
              className="ds-btn ds-focusable"
              style={{
                padding: "0.35rem 0.6rem",
                backgroundColor: T.dangerBg,
                border: `1px solid ${T.dangerBorder}`,
                borderRadius: "6px",
                color: T.danger,
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ⏹ Dừng
            </button>
          )}

          {isCurrentPlaying && !isCurrentPaused && (
            <span style={{ fontSize: "0.72rem", color: T.success, fontWeight: "600", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: T.success }} />
              Đang đọc...
            </span>
          )}
        </div>

        {/* Right: Accent & Speed Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Accent Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <span style={{ fontSize: "0.7rem", color: T.textMuted, fontWeight: "600" }}>Giọng:</span>
            {Object.values(SPEECH_LOCALES).map((loc) => {
              const isSelected = speechState.locale === loc.code;
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => handleChangeLocale(loc.code)}
                  className="ds-focusable"
                  style={{
                    padding: "0.2rem 0.45rem",
                    borderRadius: "4px",
                    border: `1px solid ${isSelected ? T.accentBorder : T.cardBorder}`,
                    backgroundColor: isSelected ? T.accentBg : "transparent",
                    color: isSelected ? T.accent : T.textMuted,
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
            <span style={{ fontSize: "0.7rem", color: T.textMuted, fontWeight: "600" }}>Tốc độ:</span>
            {PLAYBACK_SPEEDS.map((sp) => {
              const isSelected = speechState.rate === sp.value;
              return (
                <button
                  key={sp.value}
                  type="button"
                  onClick={() => handleChangeRate(sp.value)}
                  title={sp.description}
                  className="ds-focusable"
                  style={{
                    padding: "0.2rem 0.45rem",
                    borderRadius: "4px",
                    border: `1px solid ${isSelected ? T.successBorder : T.cardBorder}`,
                    backgroundColor: isSelected ? T.successBg : "transparent",
                    color: isSelected ? T.success : T.textMuted,
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
