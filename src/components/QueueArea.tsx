import { QueueToken } from "../types/queue";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import QueueList from "./QueueList";

interface Props {
  queue: QueueToken[];
  loading: boolean;
  service: string;
  onAction: (
    action: string,
    id: string
  ) => Promise<{ error: string | null } | void>;
}

export function QueueArea({
  queue,
  loading,
  service,
  onAction,
}: Readonly<Props>) {
  if (loading) {
    return <LoadingState message="Loading queue..." />;
  }

  if (!loading && queue.length === 0) {
    return <EmptyState serviceLabel={service} />;
  }

  return (
    <div className="overflow-x-auto">
      <div className="max-w-6xl mx-auto px-4">
        <QueueList queue={queue} onAction={onAction} />
      </div>
    </div>
  );
}
