export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  vertical: string;
  status: 'active' | 'prospect' | 'paused' | 'closed';
  healthScore: number;
  monthlyValue: number;
  startDate: string;
  lastContact: string;
  notes: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  lineItems: LineItem[];
  notes: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  type: 'pulse_build' | 'vault_build' |
    'consulting' | 'workshop' | 'retainer';
  status: 'scoping' | 'active' | 'review' |
    'delivered' | 'complete';
  startDate: string;
  endDate: string;
  value: number;
  milestones: Milestone[];
  tasks: Task[];
  healthScore: number;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'complete' | 'overdue';
  payment: number;
}

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
}

export interface Proposal {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  type: 'spark' | 'pulse' | 'vault' | 'scale';
  status: 'draft' | 'sent' | 'viewed' |
    'accepted' | 'declined';
  value: number;
  sentDate: string;
  expiryDate: string;
  buildFee: number;
  monthlyFee: number;
}

export interface Document {
  id: string;
  clientId: string;
  clientName: string;
  type: 'proposal' | 'sow' | 'invoice' |
    'project_plan' | 'status_update' |
    'meeting_agenda' | 'engagement_letter';
  title: string;
  status: 'draft' | 'sent' | 'approved';
  createdAt: string;
  content: string;
}
