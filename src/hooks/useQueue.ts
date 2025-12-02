import { useCallback, useEffect, useState } from "react";
import { client } from "../lib/supabaseClient";
import { QueueToken, QueueAction } from "../types/queue";
import { Status } from "../types/status";

const today = () => new Date().toISOString().slice(0, 10);

export function useQueue(orgId: string) {
  const [queue, setQueue] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<QueueAction | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from("queue_tokens")
        .select(
          "id, token_number, name, phone, people_count, status, notes, created_at, called_at, seated_at"
        )
        .eq("org_id", orgId)
        .eq("service_date", today())
        .in("status", ["waiting", "called", "seated", "on_hold"])
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
        return;
      }

      // Sort: on_hold at bottom, rest by created_at
      const sorted = (data as QueueToken[]) || [];
      sorted.sort((a, b) => {
        if (a.status === "on_hold" && b.status !== "on_hold") return 1;
        if (a.status !== "on_hold" && b.status === "on_hold") return -1;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setQueue(sorted);
      setError(null);
    } catch (err) {
      setError("Failed to load queue " + err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const handleAction = useCallback(
    async (action: string, id: string) => {
      const now = new Date().toISOString();

      // Get current status for undo
      const currentToken = queue.find((t) => t.id === id);
      const previousStatus = currentToken?.status;

      let patch: Record<string, unknown> = {};
      let newStatus: Status | null = null;

      switch (action) {
        case "call":
          patch = { status: "called", called_at: now };
          newStatus = "called";
          break;
        case "seat":
          patch = { status: "seated", seated_at: now };
          newStatus = "seated";
          break;
        case "done":
          patch = { status: "done", done_at: now };
          newStatus = "done";
          break;
        case "cancel":
          patch = { status: "cancelled" };
          newStatus = "cancelled";
          break;
        case "no_show":
          patch = { status: "no_show" };
          newStatus = "no_show";
          break;
        case "hold":
          patch = { status: "on_hold" };
          newStatus = "on_hold";
          break;
        case "unhold":
          patch = { status: "waiting" };
          newStatus = "waiting";
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
        // Save for undo (only for certain actions)
        if (
          previousStatus &&
          newStatus &&
          ["call", "seat", "done", "no_show", "hold", "cancel"].includes(action)
        ) {
          setLastAction({
            token_id: id,
            previous_status: previousStatus,
            new_status: newStatus,
            timestamp: now,
          });
        }
        await loadQueue();
        return { error: null };
      }
    },
    [loadQueue, queue]
  );

  const undoLastAction = useCallback(async () => {
    if (!lastAction) return { error: "Nothing to undo" };

    const { error } = await client
      .from("queue_tokens")
      .update({ status: lastAction.previous_status })
      .eq("id", lastAction.token_id);

    if (error) {
      return { error: error.message };
    } else {
      setLastAction(null);
      await loadQueue();
      return { error: null };
    }
  }, [lastAction, loadQueue]);

  const updateCustomer = useCallback(
    async (
      id: string,
      updates: {
        people_count?: number;
        notes?: string;
        name?: string;
        phone?: string;
      }
    ) => {
      const { error } = await client
        .from("queue_tokens")
        .update(updates)
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

  const checkDuplicate = useCallback(
    async (phone: string) => {
      if (!phone || phone.length < 5) return { isDuplicate: false };

      const { data, error } = await client
        .from("queue_tokens")
        .select("id, name, token_number")
        .eq("org_id", orgId)
        .eq("service_date", today())
        .eq("phone", phone)
        .in("status", ["waiting", "called", "seated", "on_hold"])
        .limit(1);

      if (error) {
        return { isDuplicate: false, error: error.message };
      }

      if (data && data.length > 0) {
        return { isDuplicate: true, existing: data[0] };
      }

      return { isDuplicate: false };
    },
    [orgId]
  );

  const resetQueue = useCallback(async () => {
    const { error } = await client
      .from("queue_tokens")
      .delete()
      .eq("org_id", orgId)
      .eq("service_date", today());

    if (error) {
      return { error: error.message };
    } else {
      setLastAction(null);
      await loadQueue();
      return { error: null };
    }
  }, [orgId, loadQueue]);

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
    lastAction,
    loadQueue,
    handleAction,
    undoLastAction,
    updateCustomer,
    checkDuplicate,
    resetQueue,
  } as const;
}
