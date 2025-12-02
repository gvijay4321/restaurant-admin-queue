import { useTables } from "../hooks/useTables";
import { AddTableForm } from "./AddTableForm";
import { TableList } from "./TableList";
import { LoadingState } from "./LoadingState";
import { AlertCircle, Layout } from "lucide-react";
import { QueueToken } from "../types/queue";

interface Props {
  orgId: string;
  seatedTokens: QueueToken[];
}

export function TablesTab({ orgId, seatedTokens }: Readonly<Props>) {
  const {
    tables,
    loading,
    error,
    addTable,
    updateTable,
    deleteTable,
    assignTokenToTable,
    releaseTable,
  } = useTables(orgId);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layout className="w-6 h-6 text-blue-600" />
            Tables Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage restaurant tables and seat customers
          </p>
        </div>
        <AddTableForm onSubmit={addTable} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {tables.length}
          </div>
          <div className="text-sm text-gray-600">Total Tables</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {tables.filter((t) => t.status === "available").length}
          </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {tables.filter((t) => t.status === "occupied").length}
          </div>
          <div className="text-sm text-gray-600">Occupied</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {tables.reduce((sum, t) => sum + t.capacity, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Capacity</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Tables List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <LoadingState message="Loading tables..." />
        ) : tables.length === 0 ? (
          <div className="text-center py-12">
            <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tables added yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first table to start managing seating
            </p>
          </div>
        ) : (
          <TableList
            tables={tables}
            seatedTokens={seatedTokens}
            onUpdate={updateTable}
            onDelete={deleteTable}
            onAssignToken={assignTokenToTable}
            onReleaseTable={releaseTable}
          />
        )}
      </div>
    </div>
  );
}
