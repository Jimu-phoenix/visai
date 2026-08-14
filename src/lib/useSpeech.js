import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Wraps the browser's native SpeechRecognition + SpeechSynthesis APIs.
 * No model to host, no API key — works in Chrome/Edge out of the box.
 */
export function useSpeech({ onFinalResult } = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionImpl = getSpeechRecognition();
    if (!SpeechRecognitionImpl) return;

    setSupported(true);

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          onFinalResult?.(transcript.trim());
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      startedRef.current = false;
      setListening(false);
    };

    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      startedRef.current = false;
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was denied — allow it in the browser and try again.");
      } else if (event.error === "no-speech") {
        setError("No speech was detected. Try again.");
      } else if (event.error !== "aborted") {
        setError("Voice input failed.");
      }
    };

    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      if (startedRef.current) {
        recognition.stop();
      }
      startedRef.current = false;
    };
  }, [onFinalResult]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    setError("");
    setInterimTranscript("");
    try {
      recognition.start();
      startedRef.current = true;
      setListening(true);
    } catch {
      setError("Couldn't start the microphone.");
    }
  }, [listening]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !startedRef.current) return;
    recognition.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  return { supported, listening, interimTranscript, error, start, stop, speak };
}
