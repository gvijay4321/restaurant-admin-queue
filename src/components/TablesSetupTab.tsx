import { useState } from "react";
import { RestaurantTable } from "../types/table";
import { LoadingState } from "./LoadingState";

interface Props {
  tables: RestaurantTable[];
  loading: boolean;
  onAdd: (data: {
    table_number: string;
    capacity: number;
    status: "available" | "occupied" | "reserved";
  }) => Promise<{ error: string | null } | void>;
  onUpdate: (
    id: string,
    updates: Partial<{
      table_number: string;
      capacity: number;
    }>
  ) => Promise<{ error: string | null } | void>;
  onDelete: (id: string) => Promise<{ error: string | null } | void>;
}

function AddTableModal({
  onClose,
  onAdd,
}: Readonly<{
  onClose: () => void;
  onAdd: Props["onAdd"];
}>) {
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await onAdd({
      table_number: tableNumber,
      capacity: parseInt(capacity),
      status: "available",
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
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          ➕ Add New Table
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Table Number
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g., 1, 2, 3..."
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Seats
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              max="20"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              {submitting ? "Adding..." : "Add Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTableModal({
  table,
  onClose,
  onUpdate,
  onDelete,
}: Readonly<{
  table: RestaurantTable;
  onClose: () => void;
  onUpdate: Props["onUpdate"];
  onDelete: Props["onDelete"];
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

  const handleDelete = async () => {
    if (!confirm(`Delete Table ${table.table_number}?`)) return;

    const res = await onDelete(table.id);
    if (res?.error) {
      alert("Error: " + res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          ✏️ Edit Table {table.table_number}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Table Number
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Seats
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              max="20"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>

          <div className="flex gap-3 pt-4">
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

          <button
            type="button"
            onClick={handleDelete}
            className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-semibold transition-all border-2 border-red-200"
          >
            🗑️ Delete Table
          </button>
        </form>
      </div>
    </div>
  );
}

export function TablesSetupTab({
  tables,
  loading,
  onAdd,
  onUpdate,
  onDelete,
}: Readonly<Props>) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(
    null
  );

  const getStatusBadge = (status: RestaurantTable["status"]) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            ✓ Available
          </span>
        );
      case "occupied":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            ● Occupied
          </span>
        );
      case "reserved":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            ⊙ Reserved
          </span>
        );
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Add Table Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <span className="text-xl">➕</span> ADD NEW TABLE
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {tables.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              Total Tables
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {tables.reduce(
                (sum, t) => sum + (t.capacity - (t.current_occupancy || 0)),
                0
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              Free Seats
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">
              {tables.reduce((sum, t) => sum + (t.current_occupancy || 0), 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              Occupied Seats
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {tables.reduce((sum, t) => sum + t.capacity, 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              Total Seats
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <LoadingState message="Loading tables..." />
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🪑</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No tables added yet
            </h3>
            <p className="text-gray-600 mb-6">
              Click "Add New Table" above to create your first table
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {tables.map((table) => {
              const availableSeats =
                table.capacity - (table.current_occupancy || 0);
              const isPartiallyOccupied =
                (table.current_occupancy || 0) > 0 && availableSeats > 0;
              const isFull = availableSeats === 0;

              return (
                <button
                  key={table.id}
                  onClick={() => setEditingTable(table)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left"
                >
                  <div className="text-center mb-3">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      Table {table.table_number}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      🪑 {table.capacity} total seats
                    </div>

                    {/* Occupancy Info */}
                    {(table.current_occupancy || 0) > 0 && (
                      <div className="text-xs font-semibold mb-2">
                        {isPartiallyOccupied && (
                          <span className="text-yellow-700">
                            {availableSeats} seats free •{" "}
                            {table.current_occupancy} used
                          </span>
                        )}
                        {isFull && (
                          <span className="text-red-700">
                            All {table.capacity} seats occupied
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    {isFull ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        ● Full
                      </span>
                    ) : isPartiallyOccupied ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        ⊙ Partially Full
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Available
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddTableModal onClose={() => setShowAddModal(false)} onAdd={onAdd} />
      )}

      {/* Edit Modal */}
      {editingTable && (
        <EditTableModal
          table={editingTable}
          onClose={() => setEditingTable(null)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
