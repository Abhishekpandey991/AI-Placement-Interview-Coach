import Card from "./Card";
import ProgressBar from "./ProgressBar";

export default function SkillCard({ name, score }) {
  return (
    <Card className="flex flex-col justify-between">

      <div className="flex items-start justify-between">
        <p className="font-semibold text-slate-300">{name}</p>
        <span className="text-lg font-bold text-blue-500">{score}%</span>
      </div>

      <div className="mt-6">
        <ProgressBar value={score} />
      </div>

    </Card>
  );
}