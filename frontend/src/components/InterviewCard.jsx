export default function InterviewCard({
  title,
  type,
  difficulty,
  score,
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 last:border-b-0">

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">
          {title}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">
          {type} • {difficulty}
        </p>
      </div>

     
      <span
        className={`font-semibold ${
          score >= 80
            ? "text-green-400"
            : score >= 70
            ? "text-yellow-400"
            : "text-red-400"
        }`}
      >
        {score}%
      </span>

    </div>
  );
}