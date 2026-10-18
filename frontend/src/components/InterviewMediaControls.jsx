import { useEffect, useRef, useState } from "react";

export default function InterviewMediaControls({
  question,
  onTranscript,
  disabled = false,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  const [cameraOn, setCameraOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  async function toggleCamera() {
    setError("");

    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraOn(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access requires HTTPS or localhost.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser."
          : "Could not access the camera. Check that it is connected and not being used by another application."
      );
    }
  }

 
function speakQuestion() {
  setError("");

  if (!question?.trim()) {
    setError("No interview question is available to read.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    setError("Text-to-speech is not supported by this browser.");
    return;
  }

  const synth = window.speechSynthesis;

  // Cancel any previous speech and clear its queue.
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(question.trim());

  utterance.lang = "en-IN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Prefer an installed English voice when available.
  const voices = synth.getVoices();
  const preferredVoice =
    voices.find((voice) => voice.lang === "en-IN") ||
    voices.find((voice) => voice.lang === "en-US") ||
    voices.find((voice) => voice.lang.startsWith("en-"));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => {
    setError("");
  };

  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event.error);

    if (event.error !== "canceled" && event.error !== "interrupted") {
      setError(
        `Question audio failed (${event.error || "unknown error"}). Check your system audio and browser speech settings.`
      );
    }
  };

  // Speak after the cancellation has taken effect.
  window.setTimeout(() => {
    try {
      synth.speak(utterance);
    } catch (err) {
      console.error("Could not start speech:", err);
      setError("Could not start question audio. Please try again.");
    }
  }, 150);
}


  function startListening() {
    setError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported here. Try a recent version of Chrome or Edge, or type your answer."
      );
      return;
    }

    // Prevent multiple simultaneous recognition sessions.
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    finalTranscriptRef.current = "";
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();

        if (result.isFinal && text) {
          finalTranscriptRef.current +=
            `${finalTranscriptRef.current ? " " : ""}${text}`;
        } else {
          interimTranscript += `${interimTranscript ? " " : ""}${text}`;
        }
      }

      const completeText = [
        finalTranscriptRef.current,
        interimTranscript,
      ]
        .filter(Boolean)
        .join(" ");

      setTranscript(completeText);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone permission was denied. Allow microphone access.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Try speaking a little louder.");
      } else if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);

      // Send only finalized speech to the answer field.
      const finalText = finalTranscriptRef.current.trim();

      if (finalText) {
        onTranscript?.(finalText);
      }

      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setError("Could not start the microphone. Please try again.");
      setListening(false);
      recognitionRef.current = null;
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();

      streamRef.current?.getTracks().forEach((track) => track.stop());

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <section className="mt-4 sm:mt-6 space-y-3.5 sm:space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-3.5 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm sm:text-base font-semibold text-white">Voice & Camera</h3>

        <span
          className={`text-xs ${
            listening ? "text-red-400" : "text-slate-400"
          }`}
        >
          {listening ? "● Listening..." : "Microphone idle"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Your camera preview"
          className={`aspect-video max-h-48 sm:max-h-64 w-full object-cover ${
            cameraOn ? "block" : "hidden"
          }`}
        />

        {!cameraOn && (
          <div className="flex aspect-video max-h-48 sm:max-h-64 items-center justify-center text-xs sm:text-sm text-slate-500">
            Camera is off
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={toggleCamera}
          disabled={disabled}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 text-center"
        >
          {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
        </button>

        <button
          type="button"
          onClick={speakQuestion}
          disabled={disabled || !question}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 text-center"
        >
          Read Question Aloud
        </button>

        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          disabled={disabled}
          className={`col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white disabled:opacity-50 text-center ${
            listening
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {listening ? "Stop & Add Answer" : "Answer by Voice"}
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-300">
          Live Transcript
        </p>

        <div
          aria-live="polite"
          className="min-h-16 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm leading-relaxed text-slate-300"
        >
          {transcript || "Your recognized speech will appear here."}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Stop speaking to add the recognized answer to your answer box.
          Review it before submitting.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
