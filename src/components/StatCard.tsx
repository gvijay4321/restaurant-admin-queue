interface StatCardProps {
  value: number | string;
  label: string;
  valueClass?: string;
}

export function StatCard({
  value,
  label,
  valueClass,
}: Readonly<StatCardProps>) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className={`text-2xl font-bold ${valueClass ?? "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
