export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  isPopular?: boolean;
  features: string[];
  unsupportedFeatures?: string[];
  buttonText: string;
}

export interface CapabilityItem {
  category: 'Consulting' | 'Innovation' | 'Telecoms' | 'All';
  title: string;
  description: string;
  imageAlt: string;
  imageUrl: string;
  isFeatured?: boolean;
}

export interface SchoolNomination {
  schoolName: string;
  email: string;
  primaryNeed: string;
}

export interface OnboardingModules {
  sis: boolean;
  attendance: boolean;
  timetable: boolean;
  exams: boolean;
  finance: boolean;
  transport: boolean;
  behavior: boolean;
}

export interface SchoolOnboardingData {
  schoolName: string;
  emisNumber: string;
  physicalAddress: string;
  schoolType: 'Public' | 'Private' | '';
  principalName: string;
  email: string;
  phone: string;
  
  // Modules
  modules: OnboardingModules;
  
  // Communication
  communicationChannels: string[]; // SMS, Email, Push
  
  // Operational
  specializedPrograms: string;
  emergencyProcedures: string;
  
  // Compliance
  popiaAgreement: boolean;
  authorizedSignature: string;
  submissionDate: string;
}

export interface CustomerAttachment {
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  address: string;
  taxNumber: string;
  phone: string;
  email: string;
  website: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityDate?: string;
  attachments?: CustomerAttachment[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  isPrimary: boolean;
}

export interface Note {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  type: "product" | "service";
  sku?: string;
  unitPrice: number;
  unit: string; // e.g. "hour", "license", "project", "month", "each"
  taxable: boolean;
  active: boolean;
  category: string; // e.g. "Development", "Design", "Support"
  createdAt: string;
  updatedAt: string;
}

export type DealStage = 'Lead' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';

export interface Deal {
  id: string;
  customerId: string;
  customerName?: string; // Cache or join customer name for rendering in cards
  title: string;
  stage: DealStage;
  value: number;
  probability: number;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  expectedCloseDate: string;
  createdAt: string;
  updatedAt: string;
  lostReason?: string;
}

export interface DealActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  notes: string;
  dueDate?: string;
  completed: boolean;
  createdBy: string;
  createdByEmail?: string;
  createdAt: string;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface QuoteLineItem {
  catalogItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export interface Quote {
  id: string;
  customerId: string;
  customerName?: string;
  dealId?: string;
  dealTitle?: string;
  quoteNumber: string; // e.g., Q-2026-0001
  status: QuoteStatus;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  notes?: string;
  validUntil: string;
  createdBy: string;
  createdByEmail?: string;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
  version: number;
  isLatest: boolean;
  parentQuoteId?: string; // To cluster versions
}

export interface Target {
  id: string;
  ownerId: string; // sales_rep's uid, or "team"
  period: string; // e.g., "2026-07" or "2026-Q3"
  targetAmount: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}


