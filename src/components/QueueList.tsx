import {
  Phone,
  Users,
  CheckCircle,
  UserCheck,
  PhoneCall,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { QueueToken } from "../types/queue";

type OnActionFn = (
  action: "seat" | "done" | "call" | "cancel",
  id: string
) => Promise<{ error: string | null } | void>;

function ActionButtons({
  token,
  onAction,
}: Readonly<{
  token: QueueToken;
  onAction: OnActionFn;
}>) {
  async function run(action: "seat" | "done" | "call" | "cancel") {
    const res = await onAction(action, token.id);
    if (res && res.error) alert("Error: " + res.error);
  }

  const btnBase =
    "inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium";

  return (
    <div className="flex flex-wrap gap-2">
      {token.status === "called" && (
        <button
          type="button"
          onClick={() => run("seat")}
          className={`${btnBase} bg-green-600 text-white hover:bg-green-700`}
        >
          <CheckCircle className="w-3 h-3" /> Seat
        </button>
      )}

      {token.status === "seated" && (
        <button
          type="button"
          onClick={() => run("done")}
          className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}
        >
          <UserCheck className="w-3 h-3" /> Done
        </button>
      )}

      {token.status === "waiting" && (
        <button
          type="button"
          onClick={() => run("call")}
          className={`${btnBase} bg-yellow-600 text-white hover:bg-yellow-700`}
        >
          <PhoneCall className="w-3 h-3" /> Call
        </button>
      )}

      {(token.status === "waiting" || token.status === "called") && (
        <button
          type="button"
          onClick={() => run("cancel")}
          className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}
        >
          <Trash2 className="w-3 h-3" /> Cancel
        </button>
      )}
    </div>
  );
}

export default function QueueList({
  queue,
  onAction,
}: Readonly<{
  queue: QueueToken[];
  onAction: OnActionFn;
}>) {
  return (
    <div role="list">
      <div className="hidden md:grid grid-cols-12 gap-4 md:px-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
        <div className="col-span-1">Token</div>
        <div className="col-span-5">Customer</div>
        <div className="col-span-2">Party Size</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Actions</div>
      </div>

      <div className="divide-y divide-gray-200" role="list">
        {queue.map((token) => (
          <div
            key={token.id}
            role="listitem"
            className="p-4 md:p-3 md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-4"
          >
            <div className="md:col-span-1 mb-3 md:mb-0">
              <div className="text-xl md:text-lg font-bold text-blue-600">
                #{token.token_number}
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="font-medium text-gray-900">{token.name}</div>
              {token.phone && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {token.phone}
                </div>
              )}
            </div>

            <div className="mt-3 md:mt-0 md:col-span-2">
              <div className="flex items-center gap-1 text-gray-900">
                <Users className="w-4 h-4" />
                <span className="font-medium">{token.people_count ?? "-"}</span>
              </div>
            </div>

            <div className="mt-3 md:mt-0 md:col-span-2">
              <StatusBadge status={token.status} />
            </div>

            <div className="mt-3 md:mt-0 md:col-span-2">
              <ActionButtons token={token} onAction={onAction} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
