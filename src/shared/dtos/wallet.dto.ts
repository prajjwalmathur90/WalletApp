export interface CreateWalletDTO {
  userId: number;
}

export interface AddMoneyDTO {
  userId: number;
  amount: number;
  transactionId: number;
}

export interface WalletResponseDTO {
  id: string;
  userId: string;
  balance: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
