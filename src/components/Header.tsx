interface Props {
  orgId: string;
  service: string;
  setService: (v: string) => void;
  resetQueue: () => Promise<{ error: string | null } | void>;
}

export function Header({ orgId, resetQueue }: Readonly<Props>) {
  const today = () => new Date().toISOString().slice(0, 10);

  const handleReset = async () => {
    const confirmed = confirm("Are you sure you want to reset today's queue?");
    if (!confirmed) return;
    const res = await resetQueue();
    if (res?.error) {
      alert("Error resetting: " + res.error);
    } else {
      alert("✅ Queue reset successfully!");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">🍽️</span>
            Queue Admin
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {orgId} • {today()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm sm:text-base"
          >
            🔄 Reset Queue
          </button>
        </div>
      </div>
    </div>
  );
}
