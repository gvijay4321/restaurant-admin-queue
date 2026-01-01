import { useState } from "react";
import { QueueToken, QueueAction } from "../types/queue";
import { RestaurantTable, TableAssignment } from "../types/table";
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
  getTokenAssignments?: (tokenId: string) => TableAssignment[];
  getTotalAssignedSeats?: (tokenId: string) => number;
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

// Multi-Table Assignment Modal
function AssignTableModal({
  token,
  tables,
  currentAssignments,
  totalAssigned,
  onAssign,
  onClose,
}: Readonly<{
  token: QueueToken;
  tables: RestaurantTable[];
  currentAssignments: { tableNumber: string; count: number }[];
  totalAssigned: number;
  onAssign: (
    tableId: string,
    count: number
  ) => Promise<{ error: string | null } | void>;
  onClose: () => void;
}>) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [assignCount, setAssignCount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const partySize = token.people_count || 2;
  const remaining = partySize - totalAssigned;

  // Get available tables (those with free seats)
  const availableTables = tables
    .map((t) => ({
      ...t,
      availableSeats: t.capacity - (t.current_occupancy || 0),
    }))
    .filter((t) => t.availableSeats > 0);

  const selectedTableData = selectedTable
    ? availableTables.find((t) => t.id === selectedTable)
    : null;

  const handleSelectTable = (tableId: string) => {
    setSelectedTable(tableId);
    const table = availableTables.find((t) => t.id === tableId);
    if (table) {
      // Default to min of remaining people or available seats
      const defaultCount = Math.min(remaining, table.availableSeats);
      setAssignCount(defaultCount.toString());
    }
  };

  const handleAssign = async () => {
    if (!selectedTable || !assignCount) return;

    const count = parseInt(assignCount);
    if (count <= 0) {
      alert("Please enter a valid number of people");
      return;
    }
    if (count > remaining) {
      alert(`Cannot assign more than ${remaining} remaining people`);
      return;
    }

    setSubmitting(true);
    const res = await onAssign(selectedTable, count);
    setSubmitting(false);

    if (res?.error) {
      alert("Error: " + res.error);
    } else {
      // Reset selection for next assignment
      setSelectedTable(null);
      setAssignCount("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
          🪑 Assign Tables for #{token.token_number}
        </h2>
        <p className="text-center text-gray-600 mb-4">
          {token.name} — Party of <strong>{partySize}</strong>
        </p>

        {/* Progress indicator */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-blue-900">
              Seating Progress
            </span>
            <span className="text-blue-700 font-bold">
              {totalAssigned} / {partySize}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${(totalAssigned / partySize) * 100}%` }}
            />
          </div>
          {remaining > 0 ? (
            <p className="text-sm text-blue-800 mt-2 font-medium">
              👥 {remaining} {remaining === 1 ? "person" : "people"} still need
              seats
            </p>
          ) : (
            <p className="text-sm text-green-700 mt-2 font-medium">
              ✅ All {partySize} people have been assigned!
            </p>
          )}
        </div>

        {/* Current assignments */}
        {currentAssignments.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">
              ✓ Assigned to:
            </p>
            <div className="flex flex-wrap gap-2">
              {currentAssignments.map((a, idx) => (
                <span
                  key={idx}
                  className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  Table {a.tableNumber} ({a.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Table selection - only show if remaining > 0 */}
        {remaining > 0 && (
          <>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Select a table:
            </p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {availableTables.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  No tables with free seats available.
                </p>
              ) : (
                availableTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedTable === table.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        Table {table.table_number}
                      </span>
                      <span className="text-sm text-green-700 font-semibold">
                        {table.availableSeats} seats free
                      </span>
                    </div>
                    {(table.current_occupancy || 0) > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {table.current_occupancy}/{table.capacity} seats used
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* People count input - show when table selected */}
            {selectedTable && selectedTableData && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How many people at Table {selectedTableData.table_number}?
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={assignCount}
                    onChange={(e) => setAssignCount(e.target.value)}
                    min="1"
                    max={Math.min(remaining, selectedTableData.availableSeats)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold text-center"
                  />
                  <span className="text-gray-500 text-sm">
                    (max {Math.min(remaining, selectedTableData.availableSeats)}
                    )
                  </span>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={
                    submitting || !assignCount || parseInt(assignCount) <= 0
                  }
                  className="w-full mt-3 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold transition-all"
                >
                  {submitting
                    ? "Assigning..."
                    : `Assign ${assignCount || 0} to Table ${
                        selectedTableData.table_number
                      }`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all"
          >
            {remaining === 0 ? "Done ✓" : "Close"}
          </button>
        </div>

        {remaining > 0 && totalAssigned > 0 && (
          <p className="text-xs text-gray-500 text-center mt-3">
            You can close and continue seating later
          </p>
        )}
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
  getTokenAssignments,
  getTotalAssignedSeats,
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

  // Get all assigned tables for a token with their counts
  const getAssignedTablesInfo = (tokenId: string) => {
    if (!getTokenAssignments) return [];
    const assignments = getTokenAssignments(tokenId);
    return assignments.map((a) => {
      const table = tables.find((t) => t.id === a.table_id);
      return {
        tableNumber: table?.table_number || "?",
        count: a.party_size,
      };
    });
  };

  // Get total assigned for a token
  const getTotalAssigned = (tokenId: string) => {
    if (getTotalAssignedSeats) {
      return getTotalAssignedSeats(tokenId);
    }
    return 0;
  };

  const handleAssignFromModal = async (tableId: string, count: number) => {
    if (!assigningToken) return { error: "No token selected" };
    return await onAssignTable(tableId, assigningToken.id, count);
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

  const getStatusMessage = (
    token: QueueToken,
    assignedTables: { tableNumber: string; count: number }[],
    totalAssigned: number
  ) => {
    const partySize = token.people_count || 0;
    const remaining = partySize - totalAssigned;
    const tablesText = assignedTables
      .map((t) => `${t.tableNumber} (${t.count})`)
      .join(", ");

    if (token.status === "on_hold") {
      return {
        emoji: "⏸️",
        text: "On hold - skipped for now",
        color: "bg-orange-100 text-orange-800",
      };
    }
    if (token.status === "waiting" && totalAssigned === 0) {
      return {
        emoji: "⏳",
        text: "No table assigned yet",
        color: "bg-gray-100 text-gray-700",
      };
    }
    if (token.status === "waiting" && totalAssigned > 0 && remaining > 0) {
      return {
        emoji: "🪑",
        text: `Tables ${tablesText} — ${remaining} more need seats`,
        color: "bg-yellow-100 text-yellow-800",
      };
    }
    if (token.status === "waiting" && remaining === 0) {
      return {
        emoji: "🪑",
        text: `Tables ${tablesText} — Ready to call!`,
        color: "bg-blue-100 text-blue-800",
      };
    }
    if (token.status === "called") {
      return {
        emoji: "📢",
        text: `Called — Tables ${tablesText}`,
        color: "bg-yellow-100 text-yellow-800",
      };
    }
    if (token.status === "seated") {
      return {
        emoji: "🍽️",
        text: `Eating at Tables ${tablesText}`,
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
          const assignedTables = getAssignedTablesInfo(token.id);
          const totalAssigned = getTotalAssigned(token.id);
          const partySize = token.people_count || 0;
          const remaining = partySize - totalAssigned;
          const isFullyAssigned = remaining === 0 && totalAssigned > 0;
          const status = getStatusMessage(token, assignedTables, totalAssigned);

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
                {/* Assign Table - when waiting and NOT fully assigned */}
                {token.status === "waiting" && !isFullyAssigned && (
                  <>
                    <button
                      onClick={() => setAssigningToken(token)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-base sm:text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🪑</span>
                      {totalAssigned > 0
                        ? `ASSIGN MORE (${remaining} left)`
                        : "ASSIGN TABLE"}
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

                {/* Call - when waiting AND fully assigned */}
                {token.status === "waiting" && isFullyAssigned && (
                  <>
                    <button
                      onClick={() => handleCall(token.id)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-4 px-6 rounded-xl text-base sm:text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📢</span> CALL CUSTOMER
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAssigningToken(token)}
                        className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                      >
                        🪑 Change Tables
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

      {/* Multi-Table Assignment Modal */}
      {assigningToken && (
        <AssignTableModal
          token={assigningToken}
          tables={tables}
          currentAssignments={getAssignedTablesInfo(assigningToken.id)}
          totalAssigned={getTotalAssigned(assigningToken.id)}
          onAssign={handleAssignFromModal}
          onClose={() => setAssigningToken(null)}
        />
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
