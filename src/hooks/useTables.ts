import { useCallback, useEffect, useState } from "react";
import { client } from "../lib/supabaseClient";
import { RestaurantTable, TableAssignment } from "../types/table";

export function useTables(orgId: string) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from("restaurant_tables")
        .select("*")
        .eq("org_id", orgId)
        .order("table_number", { ascending: true });

      if (error) {
        setError(error.message);
        return;
      }

      setTables((data as RestaurantTable[]) || []);
      setError(null);
    } catch (err) {
      setError("Failed to load tables: " + err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const loadAssignments = useCallback(async () => {
    try {
      const { data, error } = await client
        .from("table_assignments")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error loading assignments:", error.message);
        return;
      }

      setAssignments((data as TableAssignment[]) || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
    }
  }, []);

  const addTable = useCallback(
    async (tableData: {
      table_number: string;
      capacity: number;
      status: "available" | "occupied" | "reserved";
    }) => {
      const { error } = await client.from("restaurant_tables").insert({
        org_id: orgId,
        ...tableData,
        current_occupancy: 0, // New tables start empty
      });

      if (error) {
        return { error: error.message };
      } else {
        await loadTables();
        return { error: null };
      }
    },
    [orgId, loadTables]
  );

  const updateTable = useCallback(
    async (
      id: string,
      updates: Partial<{
        table_number: string;
        capacity: number;
        status: "available" | "occupied" | "reserved";
        current_occupancy: number;
      }>
    ) => {
      const { error } = await client
        .from("restaurant_tables")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        return { error: error.message };
      } else {
        await loadTables();
        return { error: null };
      }
    },
    [loadTables]
  );

  const deleteTable = useCallback(
    async (id: string) => {
      const { error } = await client
        .from("restaurant_tables")
        .delete()
        .eq("id", id);

      if (error) {
        return { error: error.message };
      } else {
        await loadTables();
        return { error: null };
      }
    },
    [loadTables]
  );

  // NEW: Assign a customer to a table (with partial occupancy support)
  const assignTokenToTable = useCallback(
    async (tableId: string, tokenId: string, partySize: number) => {
      try {
        // Get current table info
        const { data: table, error: tableError } = await client
          .from("restaurant_tables")
          .select("*")
          .eq("id", tableId)
          .single();

        if (tableError) {
          return { error: tableError.message };
        }

        const currentTable = table as RestaurantTable;
        const availableSeats =
          currentTable.capacity - (currentTable.current_occupancy || 0);

        // Check if party fits
        if (partySize > availableSeats) {
          return {
            error: `Not enough seats! Only ${availableSeats} seats available.`,
          };
        }

        // Create assignment record
        const { error: assignError } = await client
          .from("table_assignments")
          .insert({
            table_id: tableId,
            token_id: tokenId,
            party_size: partySize,
          });

        if (assignError) {
          return { error: assignError.message };
        }

        // Update table occupancy
        const newOccupancy = (currentTable.current_occupancy || 0) + partySize;
        const { error: updateError } = await client
          .from("restaurant_tables")
          .update({
            current_occupancy: newOccupancy,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tableId);

        if (updateError) {
          return { error: updateError.message };
        }

        await loadTables();
        await loadAssignments();
        return { error: null };
      } catch (err) {
        return { error: "Failed to assign table: " + err };
      }
    },
    [loadTables, loadAssignments]
  );

  // NEW: Release a specific customer from a table
  const releaseTokenFromTable = useCallback(
    async (tokenId: string) => {
      try {
        // Get the assignment
        const { data: assignment, error: assignError } = await client
          .from("table_assignments")
          .select("*")
          .eq("token_id", tokenId)
          .single();

        if (assignError) {
          return { error: assignError.message };
        }

        const tableAssignment = assignment as TableAssignment;

        // Get current table info
        const { data: table, error: tableError } = await client
          .from("restaurant_tables")
          .select("*")
          .eq("id", tableAssignment.table_id)
          .single();

        if (tableError) {
          return { error: tableError.message };
        }

        const currentTable = table as RestaurantTable;

        // Delete assignment
        const { error: deleteError } = await client
          .from("table_assignments")
          .delete()
          .eq("token_id", tokenId);

        if (deleteError) {
          return { error: deleteError.message };
        }

        // Update table occupancy
        const newOccupancy = Math.max(
          0,
          (currentTable.current_occupancy || 0) - tableAssignment.party_size
        );
        const { error: updateError } = await client
          .from("restaurant_tables")
          .update({
            current_occupancy: newOccupancy,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tableAssignment.table_id);

        if (updateError) {
          return { error: updateError.message };
        }

        await loadTables();
        await loadAssignments();
        return { error: null };
      } catch (err) {
        return { error: "Failed to release table: " + err };
      }
    },
    [loadTables, loadAssignments]
  );

  // OLD: Keep for backwards compatibility (releases entire table)
  const releaseTable = useCallback(
    async (tableId: string) => {
      try {
        // Delete all assignments for this table
        const { error: deleteError } = await client
          .from("table_assignments")
          .delete()
          .eq("table_id", tableId);

        if (deleteError) {
          return { error: deleteError.message };
        }

        // Reset table occupancy
        const { error: updateError } = await client
          .from("restaurant_tables")
          .update({
            current_occupancy: 0,
            current_token_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tableId);

        if (updateError) {
          return { error: updateError.message };
        }

        await loadTables();
        await loadAssignments();
        return { error: null };
      } catch (err) {
        return { error: "Failed to release table: " + err };
      }
    },
    [loadTables, loadAssignments]
  );

  // Get assignments for a specific table
  const getTableAssignments = useCallback(
    (tableId: string) => {
      return assignments.filter((a) => a.table_id === tableId);
    },
    [assignments]
  );

  // Get assignment for a specific token
  const getTokenAssignment = useCallback(
    (tokenId: string) => {
      return assignments.find((a) => a.token_id === tokenId);
    },
    [assignments]
  );

  // Real-time subscription for tables
  useEffect(() => {
    const subscription = client
      .channel("table-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_tables" },
        () => {
          loadTables();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe()?.catch?.(() => {});
    };
  }, [loadTables]);

  // Real-time subscription for assignments
  useEffect(() => {
    const subscription = client
      .channel("assignment-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_assignments" },
        () => {
          loadAssignments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe()?.catch?.(() => {});
    };
  }, [loadAssignments]);

  // Initial load
  useEffect(() => {
    loadTables();
    loadAssignments();
  }, [loadTables, loadAssignments]);

  return {
    tables,
    assignments,
    loading,
    error,
    loadTables,
    addTable,
    updateTable,
    deleteTable,
    assignTokenToTable,
    releaseTokenFromTable,
    releaseTable,
    getTableAssignments,
    getTokenAssignment,
  } as const;
}
