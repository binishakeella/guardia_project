
export enum ComplaintStatus {
  ASSIGNED = 'Assigned',
  VIEWED = 'Viewed',
  IN_PROGRESS = 'In Progress',
  CLOSED = 'Closed',
  ESCALATED = 'Escalated'
}

export enum UserRole {
  CITIZEN = 'CITIZEN',
  OFFICER_L1 = 'OFFICER_L1',
  OFFICER_L2 = 'OFFICER_L2',
  OFFICER_L3 = 'OFFICER_L3'
}

export interface ActionLog {
  id: string;
  complaintId: string;
  officerId: string;
  actionType: string;
  description: string;
  createdAt: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  department: string;
  userId: string;
  currentLevel: 1 | 2 | 3;
  assignedOfficerId: string;
  status: ComplaintStatus;
  progress: number;
  createdAt: number;
  deadline: number;
  escalated: boolean;
  viewedAt?: number;
  respondedAt?: number;
  actionLogs: ActionLog[];
}

export interface Officer {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  department: string;
  activeComplaints: number;
  warnings: number;
  score: number;
}
