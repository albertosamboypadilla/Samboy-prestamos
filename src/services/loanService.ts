import { format, addMonths } from 'date-fns';
import { AmortizationTableEntry, Loan } from '../types';

export const calculateAmortization = (
  amount: number,
  annualRate: number,
  months: number,
  startDate: Date = new Date()
): AmortizationTableEntry[] => {
  const table: AmortizationTableEntry[] = [];
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  
  let balance = amount;
  
  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance -= principal;
    
    table.push({
      installment: i,
      payment: Number(monthlyPayment.toFixed(2)),
      principal: Number(principal.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      balance: Math.max(0, Number(balance.toFixed(2))),
      dueDate: format(addMonths(startDate, i), 'yyyy-MM-dd'),
      status: 'pending'
    });
  }
  
  return table;
};

export const LOAN_STATUS_LABELS: Record<Loan['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  signed: 'Firmado',
  active: 'Activo',
  closed: 'Pagado',
  rejected: 'Rechazado'
};

export const LOAN_STATUS_COLORS: Record<Loan['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  signed: 'bg-purple-100 text-purple-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800'
};
