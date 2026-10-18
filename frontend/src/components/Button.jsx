export default function Button({
  children,
  type = "button",
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 ${className}`}
    >
      {children}
    </button>
  );
}