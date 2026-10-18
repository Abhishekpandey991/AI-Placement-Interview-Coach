export default function Loading({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500"></div>

      <p className="text-sm text-slate-400">
        {text}
      </p>
    </div>
  );
}