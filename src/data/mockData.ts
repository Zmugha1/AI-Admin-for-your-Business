import {
  Client, Invoice, Project, Proposal
} from '../types';

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'Sandi Stahl',
    company: 'Franchise Coaching Practice',
    email: 'sandi@gmail.com',
    phone: '(555) 001-0001',
    vertical: 'Coaching',
    status: 'active',
    healthScore: 92,
    monthlyValue: 349,
    startDate: '2026-01-01',
    lastContact: '2026-04-01',
    notes: 'Founding Partner — Vault tier. Coach Bot v0.2.0 delivered.'
  },
  {
    id: 'c2',
    name: 'Jeff Kirk',
    company: 'Up At Dawn LLC',
    email: 'jeff@upatdawn.com',
    phone: '(555) 002-0002',
    vertical: 'Marketing Agency',
    status: 'active',
    healthScore: 78,
    monthlyValue: 199,
    startDate: '2026-02-15',
    lastContact: '2026-03-28',
    notes: 'Pulse tier. Web dashboard live on Netlify.'
  },
  {
    id: 'c3',
    name: 'Fred Webster',
    company: 'Franchise Advisory',
    email: 'fred@boise.com',
    phone: '(555) 003-0003',
    vertical: 'Coaching',
    status: 'prospect',
    healthScore: 65,
    monthlyValue: 0,
    startDate: '',
    lastContact: '2026-03-15',
    notes: 'Referred by Sandi. Mac user. Waiting on Sandi UAT success.'
  },
  {
    id: 'c4',
    name: 'Deepika Sharma',
    company: 'DS Consulting',
    email: 'deepika@dsconsult.com',
    phone: '(555) 004-0004',
    vertical: 'Consulting',
    status: 'active',
    healthScore: 85,
    monthlyValue: 199,
    startDate: '2026-03-01',
    lastContact: '2026-04-01',
    notes: 'Pulse tier. Business Admin dashboard onboarding.'
  },
];

export const invoices: Invoice[] = [
  {
    id: 'inv1',
    clientId: 'c1',
    clientName: 'Sandi Stahl',
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-04-01',
    dueDate: '2026-04-15',
    amount: 349,
    status: 'sent',
    lineItems: [
      { id: 'li1', description: 'Coach Bot Vault — Monthly Retainer April 2026',
        quantity: 1, rate: 349, amount: 349 }
    ],
    notes: 'Thank you for being our Founding Partner.'
  },
  {
    id: 'inv2',
    clientId: 'c2',
    clientName: 'Jeff Kirk',
    invoiceNumber: 'INV-2026-002',
    issueDate: '2026-04-01',
    dueDate: '2026-04-15',
    amount: 199,
    status: 'paid',
    lineItems: [
      { id: 'li2', description: 'Up At Dawn Pulse — Monthly Retainer April 2026',
        quantity: 1, rate: 199, amount: 199 }
    ],
    notes: ''
  },
  {
    id: 'inv3',
    clientId: 'c4',
    clientName: 'Deepika Sharma',
    invoiceNumber: 'INV-2026-003',
    issueDate: '2026-03-01',
    dueDate: '2026-03-15',
    amount: 3500,
    status: 'paid',
    lineItems: [
      { id: 'li3', description: 'Pulse Business Admin — Build Fee',
        quantity: 1, rate: 3500, amount: 3500 }
    ],
    notes: 'Build fee for Pulse Business Admin dashboard.'
  },
  {
    id: 'inv4',
    clientId: 'c3',
    clientName: 'Fred Webster',
    invoiceNumber: 'INV-2026-004',
    issueDate: '2026-03-15',
    dueDate: '2026-03-30',
    amount: 1499,
    status: 'overdue',
    lineItems: [
      { id: 'li4', description: 'The Spark — Decision Intelligence Audit',
        quantity: 1, rate: 1499, amount: 1499 }
    ],
    notes: 'Spark audit — awaiting payment.'
  },
];

export const projects: Project[] = [
  {
    id: 'p1',
    clientId: 'c1',
    clientName: 'Sandi Stahl',
    name: 'Coach Bot v0.2.0',
    type: 'vault_build',
    status: 'delivered',
    startDate: '2026-01-15',
    endDate: '2026-04-04',
    value: 7500,
    healthScore: 95,
    milestones: [
      { id: 'm1', name: 'v0.1.0 Installer Delivered',
        dueDate: '2026-03-27', status: 'complete', payment: 3750 },
      { id: 'm2', name: 'v0.2.0 Full Delivery',
        dueDate: '2026-04-04', status: 'complete', payment: 3750 },
    ],
    tasks: [
      { id: 't1', description: 'Morning Brief page',
        dueDate: '2026-04-01', status: 'done', priority: 'high' },
      { id: 't2', description: 'Business Goals KPI cards',
        dueDate: '2026-04-01', status: 'done', priority: 'high' },
      { id: 't3', description: 'Local RAG — Sequence 12',
        dueDate: '2026-04-15', status: 'in_progress', priority: 'high' },
      { id: 't4', description: 'How to Use updates',
        dueDate: '2026-04-05', status: 'todo', priority: 'medium' },
    ]
  },
  {
    id: 'p2',
    clientId: 'c2',
    clientName: 'Jeff Kirk',
    name: 'Up At Dawn Pulse Web',
    type: 'pulse_build',
    status: 'complete',
    startDate: '2026-02-15',
    endDate: '2026-03-30',
    value: 3500,
    healthScore: 88,
    milestones: [
      { id: 'm3', name: 'Pulse Web Delivered',
        dueDate: '2026-03-30', status: 'complete', payment: 3500 },
    ],
    tasks: [
      { id: 't5', description: 'J-1 through J-12 complete',
        dueDate: '2026-03-30', status: 'done', priority: 'high' },
    ]
  },
  {
    id: 'p3',
    clientId: 'c4',
    clientName: 'Deepika Sharma',
    name: 'Pulse Business Admin',
    type: 'pulse_build',
    status: 'active',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    value: 3500,
    healthScore: 80,
    milestones: [
      { id: 'm4', name: 'Dashboard skeleton delivered',
        dueDate: '2026-04-10', status: 'pending', payment: 1750 },
      { id: 'm5', name: 'Full delivery',
        dueDate: '2026-04-30', status: 'pending', payment: 1750 },
    ],
    tasks: [
      { id: 't6', description: 'Five Pulse pages built',
        dueDate: '2026-04-07', status: 'in_progress', priority: 'high' },
      { id: 't7', description: 'Invoice generator',
        dueDate: '2026-04-15', status: 'todo', priority: 'high' },
      { id: 't8', description: 'Document generator',
        dueDate: '2026-04-20', status: 'todo', priority: 'medium' },
    ]
  },
];

export const proposals: Proposal[] = [
  {
    id: 'pr1',
    clientId: 'c3',
    clientName: 'Fred Webster',
    title: 'Coach Bot — The Vault',
    type: 'vault',
    status: 'sent',
    value: 11339,
    sentDate: '2026-03-20',
    expiryDate: '2026-04-20',
    buildFee: 7500,
    monthlyFee: 349,
  },
];

export const revenueByMonth = [
  { month: 'Jan', actual: 7500 },
  { month: 'Feb', actual: 11000 },
  { month: 'Mar', actual: 5547 },
  { month: 'Apr', actual: 747 },
  { month: 'May', proj: 2000 },
  { month: 'Jun', proj: 4500 },
  { month: 'Jul', proj: 6000 },
  { month: 'Aug', proj: 8000 },
  { month: 'Sep', proj: 10000 },
  { month: 'Oct', proj: 13000 },
  { month: 'Nov', proj: 16000 },
  { month: 'Dec', proj: 20000 },
];
