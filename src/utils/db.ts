import { createCollection } from '@tanstack/react-db';
import { localOnlyCollectionOptions } from '@tanstack/db';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  merchant: string;
  description?: string;
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

export const transactionsCollection = createCollection(
  localOnlyCollectionOptions<Transaction>({
    id: 'transactions',
    getKey: (tx) => tx.id,
    initialData: [],
  })
);

export const invoicesCollection = createCollection(
  localOnlyCollectionOptions<Invoice>({
    id: 'invoices',
    getKey: (inv) => inv.id,
    initialData: [],
  })
);

export const upsertTransactions = (items: Transaction[]) => {
  for (const item of items) {
    if (transactionsCollection.has(item.id)) {
      transactionsCollection.update(item.id, (draft) => {
        draft.accountId = item.accountId;
        draft.amount = item.amount;
        draft.category = item.category;
        draft.merchant = item.merchant;
        draft.description = item.description;
        draft.date = item.date;
      });
    } else {
      transactionsCollection.insert(item);
    }
  }
};

export const upsertInvoices = (items: Invoice[]) => {
  for (const item of items) {
    if (invoicesCollection.has(item.id)) {
      invoicesCollection.update(item.id, (draft) => {
        draft.invoiceNumber = item.invoiceNumber;
        draft.clientName = item.clientName;
        draft.type = item.type;
        draft.amount = item.amount;
        draft.status = item.status;
        draft.issueDate = item.issueDate;
        draft.dueDate = item.dueDate;
        draft.items = item.items;
      });
    } else {
      invoicesCollection.insert(item);
    }
  }
};

