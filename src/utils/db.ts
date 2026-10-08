export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  merchant: string;
  description?: string | null;
  date: string;
}

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number; // in cents
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  type: 'sales' | 'purchase';
  amount: number; // in cents
  status: 'paid' | 'unpaid' | 'overdue';
  issueDate: string;
  dueDate: string;
  items: string; // JSON string of InvoiceItem[]
}

