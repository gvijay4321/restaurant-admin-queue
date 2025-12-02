// src/App.tsx
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useQueue } from "./hooks/useQueue";
import { useTables } from "./hooks/useTables";
import { Header } from "./components/Header";
import { CustomersTab } from "./components/CustomersTab";
import { TablesSetupTab } from "./components/TablesSetupTab";

type TabType = "customers" | "tables";

function App() {
  const [service, setService] = useState("lunch");
  const [orgId, setOrgId] = useState("default");
  const [activeTab, setActiveTab] = useState<TabType>("customers");

  const { queue, loading, error, handleAction, resetQueue } = useQueue(orgId);

  const {
    tables,
    loading: tablesLoading,
    error: tablesError,
    addTable,
    updateTable,
    deleteTable,
    assignTokenToTable,
    releaseTokenFromTable,
    releaseTable,
    getTokenAssignment,
  } = useTables(orgId);

  // Initial load of URL params (org and svc)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlOrgId = params.get("org") || "default";
    const urlService = params.get("svc") || "lunch";

    setOrgId(urlOrgId);
    setService(urlService);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div>
          <Header
            orgId={orgId}
            service={service}
            setService={setService}
            resetQueue={resetQueue}
          />

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab("customers")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-xl text-base sm:text-lg transition-all ${
                activeTab === "customers"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span className="text-xl">👥</span>
              <span className="hidden sm:inline">Manage </span>Customers
            </button>
            <button
              onClick={() => setActiveTab("tables")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-xl text-base sm:text-lg transition-all ${
                activeTab === "tables"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span className="text-xl">🪑</span>
              <span className="hidden sm:inline">Manage </span>Tables
            </button>
          </div>
        </div>

        {/* Error */}
        {(error || tablesError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error: {error || tablesError}</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "customers" ? (
          <CustomersTab
            queue={queue}
            tables={tables}
            loading={loading}
            service={service}
            onAction={handleAction}
            onAssignTable={assignTokenToTable}
            onReleaseTable={releaseTokenFromTable}
            getTokenAssignment={getTokenAssignment}
          />
        ) : (
          <TablesSetupTab
            tables={tables}
            loading={tablesLoading}
            onAdd={addTable}
            onUpdate={updateTable}
            onDelete={deleteTable}
            onRelease={releaseTable}
          />
        )}
      </div>
    </div>
  );
}

export default App;
