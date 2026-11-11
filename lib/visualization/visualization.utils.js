/**
 * Visualization Math & Style Utilities
 */

export function getAspectColor(aspect, isLight = false) {
  switch (aspect) {
    case "simple":
      return {
        bg: isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.15)",
        border: isLight ? "#bfdbfe" : "#3b82f670",
        text: isLight ? "#1d4ed8" : "#60a5fa",
        label: "ĐƠN (Simple)",
      };
    case "continuous":
      return {
        bg: isLight ? "#ecfdf5" : "rgba(16, 185, 129, 0.15)",
        border: isLight ? "#a7f3d0" : "#10b98170",
        text: isLight ? "#047857" : "#34d399",
        label: "TIẾP DIỄN (Continuous)",
      };
    case "perfect":
      return {
        bg: isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.15)",
        border: isLight ? "#fde68a" : "#f59e0b70",
        text: isLight ? "#b45309" : "#fbbf24",
        label: "HOÀN THÀNH (Perfect)",
      };
    case "perfect_continuous":
      return {
        bg: isLight ? "#faf5ff" : "rgba(168, 85, 247, 0.15)",
        border: isLight ? "#e9d5ff" : "#a855f770",
        text: isLight ? "#7e22ce" : "#c084fc",
        label: "HT TIẾP DIỄN (Perf Cont)",
      };
    default:
      return {
        bg: isLight ? "#f1f5f9" : "rgba(100, 116, 139, 0.15)",
        border: isLight ? "#cbd5e1" : "#64748b70",
        text: isLight ? "#334155" : "#94a3b8",
        label: aspect,
      };
  }
}

export function getTimeSphereInfo(timeSphere) {
  switch (timeSphere) {
    case "past":
      return { label: "QUÁ KHỨ", color: "#f59e0b", xPercent: 20 };
    case "present":
      return { label: "HIỆN TẠI", color: "#10b981", xPercent: 50 };
    case "future":
      return { label: "TƯƠNG LAI", color: "#3b82f6", xPercent: 80 };
    default:
      return { label: "HIỆN TẠI", color: "#10b981", xPercent: 50 };
  }
}
