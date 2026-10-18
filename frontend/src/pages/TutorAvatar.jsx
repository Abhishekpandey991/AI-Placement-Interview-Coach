
import { useEffect, useRef, useState } from "react";
import { TalkingHead } from "@met4citizen/talkinghead";

export default function TutorAvatar({ question = "" }) {
  const containerRef = useRef(null);
  const headRef = useRef(null);
  const lastQuestionRef = useRef("");

  const [avatarReady, setAvatarReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState("Loading AI interviewer...");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAvatar() {
      try {
        const head = new TalkingHead(containerRef.current, {
          cameraView: "upper",
          cameraRotateEnable: false,
          cameraZoomEnable: false,
          modelPixelRatio: 1,
          avatarIdleHeadMove: 0.35,
          avatarIdleEyeContact: 0.8,
          avatarSpeakingHeadMove: 0.5,
          avatarSpeakingEyeContact: 0.8,
        });

        headRef.current = head;

        await head.showAvatar({
          url: "/avatars/interviewer.glb",
          body: "M",
          avatarMood: "neutral",
          avatarIdleHeadMove: 0.35,
          avatarIdleEyeContact: 0.8,
          avatarSpeakingHeadMove: 0.5,
          avatarSpeakingEyeContact: 0.8,
        });

        if (!cancelled) {
          setAvatarReady(true);
          setStatus("AI interviewer ready");
        }
      } catch (err) {
        console.error("Could not load the 3D interviewer:", err);

        if (!cancelled) {
          setAvatarReady(false);
          setStatus("Portrait fallback");
          setError(
            "3D avatar not loaded. Add a compatible model at public/avatars/interviewer.glb."
          );
        }
      }
    }

    loadAvatar();

    return () => {
      cancelled = true;
      window.speechSynthesis?.cancel();
      headRef.current = null;
    };
  }, []);

  function speakQuestion(text) {
    if (!text?.trim()) return;

    if (!("speechSynthesis" in window)) {
      setError("Speech synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 0.96;

    const voices = window.speechSynthesis.getVoices();

    utterance.voice =
      voices.find(
        (voice) => voice.lang.toLowerCase() === "en-in"
      ) ||
      voices.find(
        (voice) => voice.lang.toLowerCase().startsWith("en-in")
      ) ||
      voices.find(
        (voice) => voice.lang.toLowerCase().startsWith("en-")
      ) ||
      null;

    utterance.onstart = () => {
      setSpeaking(true);
      setStatus("Asking the question...");
      setError("");
    };

    utterance.onend = () => {
      setSpeaking(false);
      setStatus("Waiting for your answer");
    };

    utterance.onerror = (event) => {
      setSpeaking(false);

      if (
        event.error !== "canceled" &&
        event.error !== "interrupted"
      ) {
        setError("Could not play the question. Please try again.");
        setStatus("Speech unavailable");
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!question.trim()) return;
    if (lastQuestionRef.current === question) return;

    lastQuestionRef.current = question;
    speakQuestion(question);

    // Speak once whenever the displayed question changes.
  }, [question]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            AI Interviewer
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {status}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            speaking
              ? "bg-blue-500/15 text-blue-300"
              : "bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {speaking ? "Speaking" : "Ready"}
        </span>
      </div>

      <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden bg-slate-950">
        <div
          ref={containerRef}
          className={`absolute inset-0 h-full w-full ${
            avatarReady ? "block" : "hidden"
          }`}
        />

        {!avatarReady && (
          <img
            src="/interviewer.png"
            alt="AI interviewer portrait"
            className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ${
              speaking ? "scale-[1.03]" : "scale-100"
            }`}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 to-transparent p-3 pt-8">
          <p className="text-sm font-semibold text-white">
            Placement Interviewer
          </p>
          <p className="mt-0.5 text-xs text-slate-300">
            Practice your interview with confidence
          </p>
        </div>
      </div>

      <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-3.5">
        {error && (
          <p role="status" className="text-xs leading-5 text-amber-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            speakQuestion(
              question ||
                "Welcome to your placement interview. Please tell me about yourself."
            )
          }
          className="w-full rounded-xl bg-blue-600 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-semibold text-white transition hover:bg-blue-500 text-center"
        >
          {speaking ? "Replay question" : "Ask question aloud"}
        </button>

        <button
          type="button"
          onClick={() => {
            window.speechSynthesis?.cancel();
            setSpeaking(false);
            setStatus("Speech stopped");
          }}
          disabled={!speaking}
          className="w-full rounded-xl border border-slate-700 px-3.5 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 text-center"
        >
          Stop speech
        </button>

        <p className="text-xs leading-5 text-slate-500">
          Uses your browser's built-in speech. Available voices
          depend on your computer.
        </p>
      </div>
    </section>
  );
}
