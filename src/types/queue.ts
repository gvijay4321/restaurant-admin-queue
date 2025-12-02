import { Status } from "./status";
export interface QueueToken {
  id: string;
  token_number: number;
  name: string;
  phone: string;
  people_count: number;
  status: Status;
  created_at: string;
}
