import { Status } from "./status";

export interface QueueToken {
  id: string;
  token_number: number;
  name: string;
  phone: string;
  people_count: number;
  status: Status;
  notes?: string | null;
  created_at: string;
  called_at?: string | null;
  seated_at?: string | null;
}

// For undo functionality
export interface QueueAction {
  token_id: string;
  previous_status: Status;
  new_status: Status;
  timestamp: string;
}
