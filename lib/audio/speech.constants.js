/**
 * Speech Service Constants & Configuration
 */

export const SPEECH_LOCALES = {
  US: {
    code: "en-US",
    label: "US English",
    flag: "🇺🇸",
  },
  UK: {
    code: "en-GB",
    label: "UK English",
    flag: "🇬🇧",
  },
};

export const PLAYBACK_SPEEDS = [
  { value: 0.75, label: "0.75x", description: "Luyện nghe chậm & phát âm" },
  { value: 1.0, label: "1.0x", description: "Tốc độ tự nhiên chuẩn" },
  { value: 1.25, label: "1.25x", description: "Luyện phản xạ nghe nhanh" },
];

export const DEFAULT_SPEECH_CONFIG = {
  locale: "en-US",
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};
