export interface RestaurantTable {
  id: string;
  org_id: string;
  table_number: string;
  capacity: number;
  current_occupancy: number; // NEW: Track how many seats are currently used
  status: "available" | "occupied" | "reserved";
  current_token_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type TableFormData = Omit<
  RestaurantTable,
  "id" | "org_id" | "created_at" | "updated_at" | "current_occupancy"
>;

// NEW: Interface for table assignments (multiple customers per table)
export interface TableAssignment {
  id: string;
  table_id: string;
  token_id: string;
  party_size: number;
  assigned_at: string;
}
