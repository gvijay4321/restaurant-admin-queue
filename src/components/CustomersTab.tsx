import { useState } from "react";
import { QueueToken, QueueAction } from "../types/queue";
import { RestaurantTable } from "../types/table";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

interface Props {
  queue: QueueToken[];
  tables: RestaurantTable[];
  loading: boolean;
  service: string;
  lastAction: QueueAction | null;
  onAction: (
    action: string,
    id: string
  ) => Promise<{ error: string | null } | void>;
  onAssignTable: (
    tableId: string,
    tokenId: string,
    partySize: number
  ) => Promise<{ error: string | null } | void>;
  onReleaseTable: (tokenId: string) => Promise<{ error: string | null } | void>;
  onUpdateCustomer: (
    id: string,
    updates: { people_count?: number; notes?: string; name?: string }
  ) => Promise<{ error: string | null } | void>;
  onUndo: () => Promise<{ error: string | null } | void>;
  getTokenAssignment?: (
    tokenId: string
  ) => { table_id: string; party_size: number } | undefined;
}

// Edit Customer Modal
function EditCustomerModal({
  token,
  onClose,
  onSave,
}: Readonly<{
  token: QueueToken;
  onClose: () => void;
  onSave: (updates: {
    people_count?: number;
    notes?: string;
    name?: string;
  }) => Promise<{ error: string | null } | void>;
}>) {
  const [name, setName] = useState(token.name);
  const [peopleCount, setPeopleCount] = useState(
    token.people_count?.toString() || "2"
  );
  const [notes, setNotes] = useState(token.notes || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await onSave({
      name,
      people_count: parseInt(peopleCount),
      notes: notes || undefined,
    });

    setSubmitting(false);

    if (res?.error) {
      alert("Error: " + res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
          ✏️ Edit Customer #{token.token_number}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Party Size
            </label>
            <input
              type="number"
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
              min="1"
              max="50"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Window seat, birthday, high chair needed..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold transition-all"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomersTab({
  queue,
  tables,
  loading,
  service,
  lastAction,
  onAction,
  onAssignTable,
  onReleaseTable,
  onUpdateCustomer,
  onUndo,
  getTokenAssignment,
}: Readonly<Props>) {
  const [assigningToken, setAssigningToken] = useState<QueueToken | null>(null);
  const [editingToken, setEditingToken] = useState<QueueToken | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <LoadingState message="Loading customers..." />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <EmptyState serviceLabel={service} />
      </div>
    );
  }

  // Filter tables that have enough seats for the current customer
  const getAvailableTables = () => {
    return tables
      .map((t) => ({
        ...t,
        availableSeats: t.capacity - (t.current_occupancy || 0),
      }))
      .filter((t) => t.availableSeats > 0);
  };

  const handleAssignTable = async (token: QueueToken) => {
    setAssigningToken(token);
  };

  const handleAssign = async (tableId: string) => {
    if (!assigningToken) return;
    const partySize = assigningToken.people_count || 2;

    const table = tables.find((t) => t.id === tableId);
    const availableSeats = table
      ? table.capacity - (table.current_occupancy || 0)
      : 0;

    const seatsToAssign = Math.min(partySize, Math.max(0, availableSeats));

    if (seatsToAssign < partySize) {
      const ok = confirm(
        `Table ${
          table?.table_number ?? tableId
        } has only ${availableSeats} free seat(s). ` +
          `We'll assign ${seatsToAssign} seat(s) to this table (party is ${partySize}). Proceed?`
      );
      if (!ok) return;
    }

    const assignRes = await onAssignTable(
      tableId,
      assigningToken.id,
      seatsToAssign
    );

    if (assignRes?.error) {
      alert("Error assigning table: " + assignRes.error);
    } else {
      setAssigningToken(null);
    }
  };

  const handleCall = async (tokenId: string) => {
    const res = await onAction("call", tokenId);
    if (res?.error) alert("Error: " + res.error);
  };

  const handleSeat = async (tokenId: string) => {
    const res = await onAction("seat", tokenId);
    if (res?.error) alert("Error: " + res.error);
  };

  const handleDone = async (tokenId: string) => {
    const doneRes = await onAction("done", tokenId);
    if (doneRes?.error) {
      alert("Error: " + doneRes.error);
      return;
    }

    const releaseRes = await onReleaseTable(tokenId);
    if (releaseRes?.error) {
      alert("Error releasing table: " + releaseRes.error);
    }
  };

  const handleCancel = async (tokenId: string) => {
    if (!confirm("Cancel this customer?")) return;
    const res = await onAction("cancel", tokenId);
    if (res?.error) alert("Error: " + res.error);
  };

  const handleNoShow = async (tokenId: string) => {
    if (!confirm("Mark as no-show? Customer didn't respond to call.")) return;
    const res = await onAction("no_show", tokenId);
    if (res?.error) alert("Error: " + res.error);
  };

  const handleHold = async (tokenId: string) => {
    const res = await onAction("hold", tokenId);
    if (res?.error) alert("Error: " + res.error);
  };

  const handleUnhold = async (tokenId: string) => {
    const res = await onAction("unhold", tokenId);
    if (res?.error) alert("Error: " + res.error);
  };

  const handleUndo = async () => {
    const res = await onUndo();
    if (res?.error) alert("Error: " + res.error);
  };

  const getAssignedTable = (tokenId: string) => {
    if (!getTokenAssignment) return undefined;
    const assignment = getTokenAssignment(tokenId);
    if (!assignment) return undefined;
    return tables.find((t) => t.id === assignment.table_id);
  };

  const getStatusMessage = (
    token: QueueToken,
    assignedTable?: RestaurantTable
  ) => {
    if (token.status === "on_hold") {
      return {
        emoji: "⏸️",
        text: "On hold - skipped for now",
        color: "bg-orange-100 text-orange-800",
      };
    }
    if (token.status === "waiting" && !assignedTable) {
      return {
        emoji: "⏳",
        text: "No table assigned yet",
        color: "bg-gray-100 text-gray-700",
      };
    }
    if (token.status === "waiting" && assignedTable) {
      return {
        emoji: "🪑",
        text: `Table ${assignedTable.table_number} assigned`,
        color: "bg-blue-100 text-blue-800",
      };
    }
    if (token.status === "called") {
      return {
        emoji: "📢",
        text: `Customer called - Table ${assignedTable?.table_number} ready`,
        color: "bg-yellow-100 text-yellow-800",
      };
    }
    if (token.status === "seated") {
      return {
        emoji: "🍽️",
        text: `Eating at Table ${assignedTable?.table_number}`,
        color: "bg-green-100 text-green-800",
      };
    }
    return {
      emoji: "❓",
      text: "Unknown status",
      color: "bg-gray-100 text-gray-700",
    };
  };

  // Separate on_hold customers
  const activeQueue = queue.filter((t) => t.status !== "on_hold");
  const onHoldQueue = queue.filter((t) => t.status === "on_hold");

  return (
    <>
      {/* Undo Button */}
      {lastAction && (
        <div className="mb-4">
          <button
            onClick={handleUndo}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>↩️</span> Undo Last Action
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-3xl font-bold text-yellow-600">
            {queue.filter((t) => t.status === "waiting").length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Waiting</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-3xl font-bold text-blue-600">
            {queue.filter((t) => t.status === "called").length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Called</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-3xl font-bold text-green-600">
            {queue.filter((t) => t.status === "seated").length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Seated</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-3xl font-bold text-orange-600">
            {onHoldQueue.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">On Hold</div>
        </div>
      </div>

      {/* Active Customer Cards */}
      <div className="space-y-4">
        {activeQueue.map((token) => {
          const assignedTable = getAssignedTable(token.id);
          const status = getStatusMessage(token, assignedTable);

          return (
            <div
              key={token.id}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-3">
                <div className="bg-blue-600 text-white text-xl sm:text-2xl font-bold px-4 sm:px-5 py-2 sm:py-3 rounded-xl">
                  #{token.token_number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {token.name}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 flex items-center gap-2 flex-wrap">
                    <span>👥 {token.people_count ?? "-"} people</span>
                    {token.phone && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">📞 {token.phone}</span>
                      </>
                    )}
                  </div>
                </div>
                {/* Edit Button */}
                <button
                  onClick={() => setEditingToken(token)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Edit customer"
                >
                  ✏️
                </button>
              </div>

              {/* Notes */}
              {token.notes && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg mb-3 text-sm">
                  📝 {token.notes}
                </div>
              )}

              {/* Status */}
              <div
                className={`${status.color} px-4 py-3 rounded-xl mb-4 text-sm sm:text-base font-medium flex items-center gap-2`}
              >
                <span className="text-lg">{status.emoji}</span>
                <span>{status.text}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {/* Assign Table - only when waiting and NO table */}
                {token.status === "waiting" && !assignedTable && (
                  <>
                    <button
                      onClick={() => handleAssignTable(token)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-base sm:text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🪑</span> ASSIGN TABLE
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleHold(token.id)}
                        className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                      >
                        ⏸️ Hold
                      </button>
                      <button
                        onClick={() => handleCancel(token.id)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </>
                )}

                {/* Call - only when waiting WITH table */}
                {token.status === "waiting" && assignedTable && (
                  <>
                    <button
                      onClick={() => handleCall(token.id)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-4 px-6 rounded-xl text-base sm:text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📢</span> CALL CUSTOMER
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleHold(token.id)}
                        className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                      >
                        ⏸️ Hold
                      </button>
                      <button
                        onClick={() => handleCancel(token.id)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </>
                )}

                {/* Seat or No-Show - only when called */}
                {token.status === "called" && (
                  <>
                    <button
                      onClick={() => handleSeat(token.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl text-base sm:text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">✅</span> SEAT CUSTOMER
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNoShow(token.id)}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                      >
                        🚫 No-Show
                      </button>
                      <button
                        onClick={() => handleCall(token.id)}
                        className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                      >
                        📢 Call Again
                      </button>
                    </div>
                  </>
                )}

                {/* Done - only when seated */}
                {token.status === "seated" && (
                  <button
                    onClick={() => handleDone(token.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-base sm:text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">✔️</span> MARK DONE
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* On Hold Section */}
      {onHoldQueue.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span>⏸️</span> On Hold ({onHoldQueue.length})
          </h3>
          <div className="space-y-3">
            {onHoldQueue.map((token) => (
              <div
                key={token.id}
                className="bg-orange-50 rounded-xl p-4 border border-orange-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500 text-white font-bold px-3 py-1 rounded-lg text-sm">
                      #{token.token_number}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {token.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        👥 {token.people_count} people
                        {token.notes && (
                          <span className="ml-2">• 📝 {token.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnhold(token.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all"
                  >
                    ▶️ Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Table Modal */}
      {assigningToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Pick a Table for Customer #{assigningToken.token_number}
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Party of <strong>{assigningToken.people_count || 2}</strong>{" "}
              people
            </p>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {(() => {
                const availableTables = getAvailableTables();

                if (availableTables.length === 0) {
                  return (
                    <p className="text-gray-600 text-center py-8">
                      No tables currently have any free seats.
                      <br />
                      Please wait for a table to free up.
                    </p>
                  );
                }

                return availableTables.map((table) => {
                  const availableSeats = table.availableSeats;
                  const isTooSmall =
                    availableSeats < (assigningToken?.people_count || 2);
                  const isPartiallyOccupied =
                    (table.current_occupancy || 0) > 0;

                  return (
                    <button
                      key={table.id}
                      onClick={() => handleAssign(table.id)}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-lg text-gray-900">
                          🪑 Table {table.table_number}
                        </div>
                        <div className="flex items-center gap-2">
                          {isTooSmall && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-semibold">
                              Too small — will squeeze
                            </span>
                          )}
                          {isPartiallyOccupied && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                              Shared
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-600 text-sm">
                        <strong className="text-green-600">
                          {availableSeats} seats available
                        </strong>
                        {isPartiallyOccupied && (
                          <span className="text-gray-500">
                            {" "}
                            • {table.current_occupancy}/{table.capacity} used
                          </span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            <button
              onClick={() => setAssigningToken(null)}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingToken && (
        <EditCustomerModal
          token={editingToken}
          onClose={() => setEditingToken(null)}
          onSave={(updates) => onUpdateCustomer(editingToken.id, updates)}
        />
      )}
    </>
  );
}
