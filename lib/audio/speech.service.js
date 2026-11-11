/**
 * Centralized Speech Service (Web Speech API Wrapper)
 * Supports UK/US Voice Selection, Playback Speeds (0.75x, 1.0x, 1.25x),
 * Overlap Prevention, and Persistent User Preferences.
 */

import { DEFAULT_SPEECH_CONFIG, SPEECH_LOCALES, PLAYBACK_SPEEDS } from "./speech.constants";
import { sanitizeSpeechText, matchBestVoice } from "./speech.utils";

class SpeechService {
  constructor() {
    this.voices = [];
    this.locale = DEFAULT_SPEECH_CONFIG.locale;
    this.rate = DEFAULT_SPEECH_CONFIG.rate;
    this.pitch = DEFAULT_SPEECH_CONFIG.pitch;
    this.volume = DEFAULT_SPEECH_CONFIG.volume;

    this.isSpeaking = false;
    this.isPaused = false;
    this.currentText = "";
    this.listeners = new Set();
    this.activeUtterance = null;

    if (typeof window !== "undefined") {
      this.init();
    }
  }

  init() {
    // 1. Load persisted preferences
    try {
      const savedLocale = localStorage.getItem("grammar_audio_locale");
      if (savedLocale && (savedLocale === "en-US" || savedLocale === "en-GB")) {
        this.locale = savedLocale;
      }

      const savedRate = parseFloat(localStorage.getItem("grammar_audio_rate"));
      if (savedRate && [0.75, 1.0, 1.25].includes(savedRate)) {
        this.rate = savedRate;
      }
    } catch (e) {}

    // 2. Load voices asynchronously
    if ("speechSynthesis" in window) {
      const updateVoices = () => {
        this.voices = window.speechSynthesis.getVoices() || [];
        this.notifyState();
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notifyState() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.warn("Speech listener error:", err);
      }
    });
  }

  getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      locale: this.locale,
      rate: this.rate,
      currentText: this.currentText,
      voices: this.voices,
    };
  }

  setLocale(locale) {
    if (locale === "en-US" || locale === "en-GB") {
      this.locale = locale;
      try {
        localStorage.setItem("grammar_audio_locale", locale);
      } catch (e) {}
      this.notifyState();
    }
  }

  setRate(rate) {
    const val = Number(rate);
    if ([0.75, 1.0, 1.25].includes(val)) {
      this.rate = val;
      try {
        localStorage.setItem("grammar_audio_rate", String(val));
      } catch (e) {}
      this.notifyState();
    }
  }

  /**
   * Speak English text with overlap prevention & voice selection
   */
  speak(text, options = {}) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (options.onEnd) options.onEnd();
      return;
    }

    const clean = sanitizeSpeechText(text);
    if (!clean) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Stop any existing speech to prevent overlapping voices
    this.stop();

    const targetLocale = options.locale || this.locale;
    const targetRate = options.rate || this.rate;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = targetLocale;
    utterance.rate = targetRate;
    utterance.pitch = options.pitch || this.pitch;
    utterance.volume = options.volume || this.volume;

    // Pick best matching voice
    const matched = matchBestVoice(this.voices, targetLocale);
    if (matched) {
      utterance.voice = matched;
    }

    this.isSpeaking = true;
    this.isPaused = false;
    this.currentText = clean;
    this.activeUtterance = utterance;
    this.notifyState();

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.notifyState();
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentText = "";
      this.activeUtterance = null;
      this.notifyState();
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentText = "";
      this.activeUtterance = null;
      this.notifyState();
      if (options.onError) options.onError(e);
      if (options.onEnd) options.onEnd();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isSpeaking = false;
      this.notifyState();
      if (options.onEnd) options.onEnd();
    }
  }

  pause() {
    if (typeof window !== "undefined" && "speechSynthesis" in window && this.isSpeaking && !this.isPaused) {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.notifyState();
    }
  }

  resume() {
    if (typeof window !== "undefined" && "speechSynthesis" in window && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.notifyState();
    }
  }

  stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentText = "";
    this.activeUtterance = null;
    this.notifyState();
  }

  getAvailableVoices() {
    return this.voices;
  }
}

export const speechService = new SpeechService();
