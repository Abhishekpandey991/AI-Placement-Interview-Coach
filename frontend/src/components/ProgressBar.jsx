export default function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-800">
      <div
        className="h-full rounded-full bg-blue-600 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}