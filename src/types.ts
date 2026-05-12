export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'client';
  dni?: string;
  createdAt: string;
}

export interface AmortizationTableEntry {
  installment: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  dueDate: string;
  status: 'pending' | 'paid';
}

export interface Loan {
  id?: string;
  clientId: string;
  clientName: string;
  clientDni: string;
  amount: number;
  interestRate: number; // annual percentage
  termMonths: number;
  status: 'pending' | 'approved' | 'signed' | 'active' | 'closed' | 'rejected';
  amortizationTable: AmortizationTableEntry[];
  contractUrl?: string;
  signatureRequestId?: string;
  signatureStatus?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Payment {
  id?: string;
  loanId: string;
  clientId: string;
  amount: number;
  date: string;
  transactionId: string;
  voucherUrl?: string;
  installmentNumber: number;
  notes?: string;
}

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  details: string;
  entityId: string;
  timestamp: string;
}
