import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_PREFIX = "ge_question_state_v1";
const memoryFallbackStore = new Map();

/**
 * Builds deterministic session storage key scoped by learning context and question ID.
 * @param {string} scope
 * @param {string} questionId
 * @returns {string}
 */
export function buildQuestionStateKey(scope = "study", questionId = "") {
  const safeScope = String(scope || "study").trim() || "study";
  const safeId = String(questionId || "").trim();
  return `${STORAGE_PREFIX}:${safeScope}:${safeId}`;
}

function getStorageAdapter() {
  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage) return window.sessionStorage;
    } catch {
      // Ignore private browsing / storage quota exceptions
    }
  }
  return null;
}

/**
 * Reads persisted question session state safely.
 * @param {string} scope
 * @param {string} questionId
 * @returns {{ draftValue: string, attempts: number, lastAttemptAt: number | null }}
 */
export function readPersistedQuestionState(scope, questionId) {
  const defaultState = { draftValue: "", attempts: 0, lastAttemptAt: null };
  if (!questionId) return defaultState;

  const key = buildQuestionStateKey(scope, questionId);
  const storage = getStorageAdapter();

  try {
    const raw = storage ? storage.getItem(key) : memoryFallbackStore.get(key);
    if (!raw) return defaultState;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      draftValue: typeof parsed?.draftValue === "string" ? parsed.draftValue : "",
      attempts: Number.isFinite(Number(parsed?.attempts)) ? Math.max(0, Number(parsed.attempts)) : 0,
      lastAttemptAt: Number.isFinite(Number(parsed?.lastAttemptAt)) ? Number(parsed.lastAttemptAt) : null,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Persists question draft value and attempt counter safely.
 * @param {string} scope
 * @param {string} questionId
 * @param {object} nextState
 */
export function writePersistedQuestionState(scope, questionId, nextState) {
  if (!questionId) return;
  const key = buildQuestionStateKey(scope, questionId);
  const payload = JSON.stringify({
    draftValue: typeof nextState?.draftValue === "string" ? nextState.draftValue : "",
    attempts: Number.isFinite(Number(nextState?.attempts)) ? Math.max(0, Number(nextState.attempts)) : 0,
    lastAttemptAt: Number.isFinite(Number(nextState?.lastAttemptAt)) ? Number(nextState.lastAttemptAt) : null,
  });

  const storage = getStorageAdapter();
  try {
    if (storage) {
      storage.setItem(key, payload);
    } else {
      memoryFallbackStore.set(key, payload);
    }
  } catch {
    memoryFallbackStore.set(key, payload);
  }
}

/**
 * Clears persisted state for a question within a scope.
 * @param {string} scope
 * @param {string} questionId
 */
export function clearPersistedQuestionState(scope, questionId) {
  if (!questionId) return;
  const key = buildQuestionStateKey(scope, questionId);
  const storage = getStorageAdapter();
  try {
    if (storage) storage.removeItem(key);
  } catch {
    // Ignore
  }
  memoryFallbackStore.delete(key);
}

/**
 * Lightweight client session persistence hook keyed by scope (`study`/`quiz`) + `questionId`.
 * Keeps unsubmitted answers and attempt counts across drawer toggles and reloads
 * without breaking parent-controlled `value` / `onChange`.
 */
export function useQuestionState({
  scope = "study",
  questionId = "",
  value: controlledValue,
  onChange,
}) {
  const isControlled = controlledValue !== undefined;
  const [internalState, setInternalState] = useState(() =>
    readPersistedQuestionState(scope, questionId)
  );
  const restoredKeyRef = useRef("");

  // Sync persisted draft on mount or when scope/questionId changes
  useEffect(() => {
    const key = buildQuestionStateKey(scope, questionId);
    const persisted = readPersistedQuestionState(scope, questionId);
    setInternalState(persisted);

    if (
      questionId &&
      restoredKeyRef.current !== key &&
      isControlled &&
      !controlledValue &&
      persisted.draftValue &&
      typeof onChange === "function"
    ) {
      restoredKeyRef.current = key;
      onChange(persisted.draftValue);
    } else {
      restoredKeyRef.current = key;
    }
  }, [scope, questionId]);

  // Mirror parent-controlled changes into session persistence
  useEffect(() => {
    if (!questionId || !isControlled) return;
    const normalizedVal = typeof controlledValue === "string" ? controlledValue : String(controlledValue ?? "");
    setInternalState((prev) => {
      if (prev.draftValue === normalizedVal) return prev;
      const next = { ...prev, draftValue: normalizedVal };
      writePersistedQuestionState(scope, questionId, next);
      return next;
    });
  }, [scope, questionId, isControlled, controlledValue]);

  const setValue = useCallback(
    (nextVal) => {
      const normalizedVal = typeof nextVal === "string" ? nextVal : String(nextVal ?? "");
      setInternalState((prev) => {
        const next = { ...prev, draftValue: normalizedVal };
        writePersistedQuestionState(scope, questionId, next);
        return next;
      });
      if (typeof onChange === "function") {
        onChange(normalizedVal);
      }
    },
    [scope, questionId, onChange]
  );

  const recordAttempt = useCallback(() => {
    setInternalState((prev) => {
      const next = {
        ...prev,
        attempts: prev.attempts + 1,
        lastAttemptAt: Date.now(),
      };
      writePersistedQuestionState(scope, questionId, next);
      return next;
    });
  }, [scope, questionId]);

  const clearState = useCallback(() => {
    clearPersistedQuestionState(scope, questionId);
    setInternalState({ draftValue: "", attempts: 0, lastAttemptAt: null });
    if (typeof onChange === "function") {
      onChange("");
    }
  }, [scope, questionId, onChange]);

  const currentValue = isControlled
    ? typeof controlledValue === "string"
      ? controlledValue
      : String(controlledValue ?? "")
    : internalState.draftValue;

  return {
    value: currentValue,
    setValue,
    attempts: internalState.attempts,
    lastAttemptAt: internalState.lastAttemptAt,
    recordAttempt,
    clearState,
  };
}

export default useQuestionState;
