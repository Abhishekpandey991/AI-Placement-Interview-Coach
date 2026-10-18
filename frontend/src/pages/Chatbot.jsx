
import { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { sendMentorMessage } from "../services/api";

const SUGGESTIONS = [
  {
    title: "DSA Help",
    prompt: "Help me understand how to approach a medium-level DSA problem.",
    icon: "⌘",
  },
  {
    title: "Interview Preparation",
    prompt: "Create a practical software engineering placement preparation plan.",
    icon: "◷",
  },
  {
    title: "System Design",
    prompt: "Teach me how to approach a URL shortener system design interview.",
    icon: "▦",
  },
  {
    title: "Improve My Answer",
    prompt: "How can I structure a strong answer to a technical interview question?",
    icon: "✧",
  },
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm your AI Placement Mentor. I can help you with DSA, technical interviews, System Design, and placement preparation. What would you like to work on today?",
};

export default function Chatbot() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text = input) {
    const content = text.trim();

    if (!content || loading) return;

    const userMessage = {
      role: "user",
      content,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const result = await sendMentorMessage(
        nextMessages.filter((message) =>
          ["user", "assistant"].includes(message.role)
        )
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");

      // Keep the user's message visible so they can retry.
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function startNewChat() {
    if (loading) return;

    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        <Sidebar />

        <main className="min-w-0 flex-1 px-2.5 py-4 sm:px-6 sm:py-8">
          <div className="mx-auto flex min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-140px)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b border-slate-800 p-3.5 sm:p-5">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-xl sm:text-2xl text-blue-400">
                  ✧
                </div>

                <div className="min-w-0">
                  <h1 className="font-bold text-sm sm:text-lg truncate">
                    AI Placement Mentor
                  </h1>
                  <p className="text-xs text-slate-400 truncate sm:text-sm">
                    Your personal interview preparation assistant
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startNewChat}
                disabled={loading}
                className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 sm:py-2 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-50 sm:text-sm"
              >
                New chat
              </button>
            </header>

            {/* Messages */}
            <section
              className="flex-1 space-y-4 sm:space-y-5 overflow-y-auto p-3 sm:p-6"
              aria-live="polite"
            >
              {messages.length === 1 && (
                <div className="mx-auto max-w-2xl py-6 sm:py-10">
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-4xl text-blue-400">
                      ✧
                    </div>

                    <h2 className="text-2xl font-bold">
                      Let's prepare for placements.
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Ask questions, understand concepts, and plan
                      your next step toward becoming placement-ready.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.title}
                        type="button"
                        onClick={() => sendMessage(suggestion.prompt)}
                        disabled={loading}
                        className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-blue-500 hover:bg-slate-800 disabled:opacity-50"
                      >
                        <span className="text-xl text-blue-400">
                          {suggestion.icon}
                        </span>

                        <h3 className="mt-3 font-semibold">
                          {suggestion.title}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {suggestion.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className={`flex gap-3 ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-lg text-blue-400">
                      ✧
                    </div>
                  )}

                  <div
                    className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "border border-slate-800 bg-slate-950 text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 sm:leading-7">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                    ✧
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                    Thinking
                    <span className="ml-2 inline-block animate-pulse">
                      ...
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="ml-12 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={() => {
                      const lastUserMessage = [...messages]
                        .reverse()
                        .find((message) => message.role === "user");

                      if (lastUserMessage) {
                        // Remove the previous attempt from the visible
                        // conversation before retrying the same message.
                        setMessages((current) => {
                          const index = current.lastIndexOf(lastUserMessage);
                          return index >= 0
                            ? current.filter((_, i) => i !== index)
                            : current;
                        });

                        sendMessage(lastUserMessage.content);
                      }
                    }}
                    disabled={loading}
                    className="mt-2 font-semibold underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </section>

            {/* Composer */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-800 bg-slate-950/70 p-2.5 sm:p-5"
            >
              <div className="flex items-end gap-1.5 sm:gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-1.5 sm:p-2 focus-within:border-blue-500">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  placeholder="Ask about DSA, interviews, or System Design..."
                  rows={1}
                  maxLength={6000}
                  disabled={loading}
                  className="max-h-36 min-h-10 sm:min-h-11 flex-1 resize-y bg-transparent px-2.5 sm:px-3 py-2 sm:py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="mb-0.5 sm:mb-1 rounded-xl bg-blue-600 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                </button>
              </div>

              <p className="mt-2 text-center text-xs text-slate-500">
                AI responses can contain mistakes. Verify important
                technical information.
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
