import { useState } from "react";
import { QueueToken } from "../types/queue";
import { RestaurantTable } from "../types/table";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

interface Props {
  queue: QueueToken[];
  tables: RestaurantTable[];
  loading: boolean;
  service: string;
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
  getTokenAssignment?: (
    tokenId: string
  ) => { table_id: string; party_size: number } | undefined;
}

export function CustomersTab({
  queue,
  tables,
  loading,
  service,
  onAction,
  onAssignTable,
  onReleaseTable,
  getTokenAssignment,
}: Readonly<Props>) {
  const [assigningToken, setAssigningToken] = useState<QueueToken | null>(null);

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
  // allow tables with at least 1 free seat (so we can "squeeze" larger parties)
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

    // find the table to inspect available seats
    const table = tables.find((t) => t.id === tableId);
    const availableSeats = table
      ? table.capacity - (table.current_occupancy || 0)
      : 0;

    // compute seats we'll actually assign (squeeze = assign as many as table can take)
    const seatsToAssign = Math.min(partySize, Math.max(0, availableSeats));

    // Show a clear confirm with how many seats we're assigning
    if (seatsToAssign < partySize) {
      const ok = confirm(
        `Table ${
          table?.table_number ?? tableId
        } has only ${availableSeats} free seat(s). ` +
          `We'll assign ${seatsToAssign} seat(s) to this table (party is ${partySize}). Proceed?`
      );
      if (!ok) return;
    }

    // Call backend with the number of seats we actually allocate
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

    // Release the customer from their table
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
        emoji: "✅",
        text: `Customer called - Table ${assignedTable?.table_number} ready`,
        color: "bg-green-100 text-green-800",
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

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {queue.filter((t) => t.status === "waiting").length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Waiting</div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {queue.filter((t) => t.status === "seated").length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Seated</div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {tables.reduce(
              (sum, t) => sum + (t.capacity - (t.current_occupancy || 0)),
              0
            )}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Free Seats
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="space-y-4">
        {queue.map((token) => {
          const assignedTable = getAssignedTable(token.id);
          const status = getStatusMessage(token, assignedTable);

          return (
            <div
              key={token.id}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
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
              </div>

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
                    <button
                      onClick={() => handleCancel(token.id)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl text-sm sm:text-base transition-all"
                    >
                      ❌ Cancel
                    </button>
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
                    <button
                      onClick={() => handleCancel(token.id)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl text-sm sm:text-base transition-all"
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}

                {/* Seat - only when called */}
                {token.status === "called" && (
                  <button
                    onClick={() => handleSeat(token.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl text-base sm:text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">✅</span> SEAT CUSTOMER
                  </button>
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
                  const availableSeats = table.availableSeats; // because we mapped earlier
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
    </>
  );
}
