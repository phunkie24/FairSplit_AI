export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Receipt {
  id: string;
  imageUrl: string;
  merchant: string | null;
  total: number;
  date: Date;
  currency: string;
  parsed: boolean;
  uploadedBy: string;
  groupId: string | null;
  createdAt: Date;
}

export interface Debt {
  id: string;
  amount: number;
  settled: boolean;
  debtorId: string;
  creditorId: string;
  debtor?: User;
  creditor?: User;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  memberCount?: number;
  totalSpent?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  fromUserId: string;
  toUserId: string;
  fromUser?: User;
  description: string | null;
  createdAt: Date;
}
