import { useCallback, useEffect, useState } from "react";
import { client } from "../lib/supabaseClient";
import { QueueToken } from "../types/queue";

const today = () => new Date().toISOString().slice(0, 10);

export function useQueue(orgId: string) {
  const [queue, setQueue] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from("queue_tokens")
        .select(
          "id, token_number, name, phone, people_count, status, created_at"
        )
        .eq("org_id", orgId)
        .eq("service_date", today())
        // Removed service_tag filter since we no longer use service selector
        .in("status", ["waiting", "called", "seated"])
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
        return;
      }

      setQueue((data as QueueToken[]) || []);
      setError(null);
    } catch (err) {
      setError("Failed to load queue " + err);
    } finally {
      setLoading(false);
    }
  }, [orgId]); // Removed 'service' dependency

  const handleAction = useCallback(
    async (action: string, id: string) => {
      const now = new Date().toISOString();
      let patch: unknown = {};

      switch (action) {
        case "call":
          patch = { status: "called", called_at: now };
          break;
        case "seat":
          patch = { status: "seated", seated_at: now };
          break;
        case "done":
          patch = { status: "done", done_at: now };
          break;
        case "cancel":
          patch = { status: "cancelled" };
          break;
        default:
          return;
      }

      const { error } = await client
        .from("queue_tokens")
        .update(patch)
        .eq("id", id);

      if (error) {
        return { error: error.message };
      } else {
        await loadQueue();
        return { error: null };
      }
    },
    [loadQueue]
  );

  const resetQueue = useCallback(async () => {
    const { error } = await client
      .from("queue_tokens")
      .delete()
      .eq("org_id", orgId)
      .eq("service_date", today());
    // Removed service_tag filter

    if (error) {
      return { error: error.message };
    } else {
      await loadQueue();
      return { error: null };
    }
  }, [orgId, loadQueue]); // Removed 'service' dependency

  useEffect(() => {
    const subscription = client
      .channel("queue-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_tokens" },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe()?.catch?.(() => {});
    };
  }, [loadQueue]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  return {
    queue,
    loading,
    error,
    loadQueue,
    handleAction,
    resetQueue,
  } as const;
}
