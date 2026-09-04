export interface TransferDTO {
  fromUser: number;
  toUser: number;
  amount: number;
}

export interface TransactionResponseDTO {
  id: string;
  fromUser: string;
  toUser: string;
  amount: string;
  status: string;
  idempotencyKey: string;
  createdAt: string;
}
