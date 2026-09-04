export enum ShardId {
  SHARD_1 = 1,
  SHARD_2 = 2,
}

export interface Wallet {
  id: bigint;
  user_id: bigint;
  balance: bigint;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export enum LedgerType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export interface LedgerEntry {
  id: bigint;
  user_id: bigint;
  transaction_id: bigint;
  amount: bigint;
  type: LedgerType;
  created_at: Date;
}

export enum TransactionStatus {
  PENDING = "PENDING",
  DEBITED = "DEBITED",
  CREDITED = "CREDITED",
  FAILED = "FAILED",
}

export interface Transaction {
  id: bigint;
  from_user: bigint;
  to_user: bigint;
  amount: bigint;
  status: TransactionStatus;
  indempotency_key: string;
  created_at: Date;
}
