
import React from 'react';
import { Shield, AlertCircle, CheckCircle2, Clock, Users, FileText } from 'lucide-react';

export const DEADLINE_DAYS = 7;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEPARTMENTS = [
  'Infrastructure & Roads',
  'Public Safety',
  'Electricity & Power',
  'Water & Sanitation',
  'Administration'
];

export const STATUS_COLORS: Record<string, string> = {
  'Assigned': 'bg-blue-100 text-blue-800',
  'Viewed': 'bg-purple-100 text-purple-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  'Closed': 'bg-green-100 text-green-800',
  'Escalated': 'bg-red-100 text-red-800',
};

export const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  OFFICER_L1: 'Officer Level 1',
  OFFICER_L2: 'Officer Level 2',
  OFFICER_L3: 'Final Authority (L3)',
};
