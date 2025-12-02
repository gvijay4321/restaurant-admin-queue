import { QueueToken } from "../types/queue";
import { StatCard } from "./StatCard";

interface Props {
  queue: QueueToken[];
}

export function StatsPanel({ queue }: Readonly<Props>) {
  const total = queue.length;
  const waiting = queue.filter((t) => t.status === "waiting").length;
  const called = queue.filter((t) => t.status === "called").length;
  const seated = queue.filter((t) => t.status === "seated").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard value={total} label="Total Active" />
      <StatCard value={waiting} label="Waiting" valueClass="text-yellow-600" />
      <StatCard value={called} label="Called" valueClass="text-blue-600" />
      <StatCard value={seated} label="Seated" valueClass="text-green-600" />
    </div>
  );
}
