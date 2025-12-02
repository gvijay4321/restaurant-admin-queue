import {
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { RestaurantTable } from "../types/table";
import { QueueToken } from "../types/queue";

interface Props {
  tables: RestaurantTable[];
  seatedTokens: QueueToken[];
  onUpdate: (
    id: string,
    updates: Partial<{
      table_number: string;
      capacity: number;
      status: "available" | "occupied" | "reserved";
    }>
  ) => Promise<{ error: string | null } | void>;
  onDelete: (id: string) => Promise<{ error: string | null } | void>;
  onAssignToken: (
    tableId: string,
    tokenId: string
  ) => Promise<{ error: string | null } | void>;
  onReleaseTable: (tableId: string) => Promise<{ error: string | null } | void>;
}

function EditTableModal({
  table,
  onClose,
  onUpdate,
}: Readonly<{
  table: RestaurantTable;
  onClose: () => void;
  onUpdate: Props["onUpdate"];
}>) {
  const [tableNumber, setTableNumber] = useState(table.table_number);
  const [capacity, setCapacity] = useState(table.capacity.toString());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await onUpdate(table.id, {
      table_number: tableNumber,
      capacity: parseInt(capacity),
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Table</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Number
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              max="20"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignTokenModal({
  table,
  tokens,
  onClose,
  onAssign,
}: Readonly<{
  table: RestaurantTable;
  tokens: QueueToken[];
  onClose: () => void;
  onAssign: (tableId: string, tokenId: string) => Promise<{ error: string | null } | void>;
}>) {
  const [selectedToken, setSelectedToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken) return;

    setSubmitting(true);
    const res = await onAssign(table.id, selectedToken);
    setSubmitting(false);

    if (res?.error) {
      alert("Error: " + res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Assign Customer to Table {table.table_number}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a customer...</option>
              {tokens.map((token) => (
                <option key={token.id} value={token.id}>
                  #{token.token_number} - {token.name} ({token.people_count}{" "}
                  people)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedToken}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {submitting ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TableList({
  tables,
  seatedTokens,
  onUpdate,
  onDelete,
  onAssignToken,
  onReleaseTable,
}: Readonly<Props>) {
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(
    null
  );
  const [assigningTable, setAssigningTable] = useState<RestaurantTable | null>(
    null
  );

  const handleDelete = async (id: string, tableNumber: string) => {
    if (!confirm(`Delete table ${tableNumber}?`)) return;

    const res = await onDelete(id);
    if (res?.error) {
      alert("Error: " + res.error);
    }
  };

  const handleRelease = async (tableId: string, tableNumber: string) => {
    if (!confirm(`Release table ${tableNumber}?`)) return;

    const res = await onReleaseTable(tableId);
    if (res?.error) {
      alert("Error: " + res.error);
    }
  };

  const getStatusBadge = (status: RestaurantTable["status"]) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Available
          </span>
        );
      case "occupied":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3" />
            Occupied
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-3 h-3" />
            Reserved
          </span>
        );
    }
  };

  const getTokenInfo = (tokenId: string | null | undefined) => {
    if (!tokenId) return null;
    return seatedTokens.find((t) => t.id === tokenId);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const tokenInfo = getTokenInfo(table.current_token_id);

          return (
            <div
              key={table.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Table {table.table_number}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Users className="w-4 h-4" />
                    <span>Seats {table.capacity}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingTable(table)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(table.id, table.table_number)}
                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="mb-3">{getStatusBadge(table.status)}</div>

              {/* Token Info */}
              {tokenInfo && (
                <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium text-gray-900">
                    #{tokenInfo.token_number} - {tokenInfo.name}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {tokenInfo.people_count} people
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {table.status === "available" && (
                  <button
                    onClick={() => setAssigningTable(table)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
                  >
                    Assign
                  </button>
                )}
                {table.status === "occupied" && (
                  <button
                    onClick={() =>
                      handleRelease(table.id, table.table_number)
                    }
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Release
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingTable && (
        <EditTableModal
          table={editingTable}
          onClose={() => setEditingTable(null)}
          onUpdate={onUpdate}
        />
      )}

      {assigningTable && (
        <AssignTokenModal
          table={assigningTable}
          tokens={seatedTokens}
          onClose={() => setAssigningTable(null)}
          onAssign={onAssignToken}
        />
      )}
    </>
  );
}
