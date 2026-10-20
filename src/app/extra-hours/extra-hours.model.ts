export interface TeamMember {
  id: string;
  name: string;
  created_at: string;
}

// 'worked' adds to a member's balance, 'requested' is time off taken from it
export type OvertimeKind = 'worked' | 'requested';

export interface OvertimeEntry {
  id: string;
  member_id: string;
  kind: OvertimeKind;
  hours: number;
  date: string;
  note: string;
  created_at: string;
}
