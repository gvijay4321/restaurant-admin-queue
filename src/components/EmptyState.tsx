import { Users } from "lucide-react";

interface Props {
  serviceLabel?: string;
}

export function EmptyState({ serviceLabel = "service" }: Readonly<Props>) {
  return (
    <div className="p-12 text-center">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No tokens in queue
      </h3>
      <p className="text-gray-600">
        The queue is empty for today's {serviceLabel}.
      </p>
    </div>
  );
}
