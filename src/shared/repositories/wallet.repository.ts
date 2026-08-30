import { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import { Wallet } from "../types/shared-types.js";

// we are using client.wallet... because it is saying that use that prisma client that is
// passed inside the params because we have two prisma clients in this project

// Prisma.TransactionClient is a temperory client provided by prisma to do txn ops

export class WalletRepository {
  async create(userId: bigint, tx: Prisma.TransactionClient): Promise<Wallet> {
    const walletEntitiy = await tx.wallet.create({
      data: {
        user_id: userId,
        balance: BigInt(0),
        version: 0,
      },
    });

    return this.mapToWallet(walletEntitiy);
  }

  async findById(
    walletId: bigint,
    client: PrismaClient | Prisma.TransactionClient,
  ): Promise<Wallet | null> {
    const walletEntity = await client.wallet.findUnique({
      where: {
        id: walletId,
      },
    });

    return walletEntity ? this.mapToWallet(walletEntity) : null;
  }

  async findByUserId(
    userId: bigint,
    client: PrismaClient | Prisma.TransactionClient,
  ): Promise<Wallet | null> {
    const walletEntity = await client.wallet.findUnique({
      where: {
        user_id: userId,
      },
    });

    return walletEntity ? this.mapToWallet(walletEntity) : null;
  }

  // find wallet by userid with row level lock (SELECT FOR UPDATE)
  // We want to prevent concurrent updates

  async findByUserIdWithLock(
    userId: bigint,
    tx: Prisma.TransactionClient,
  ): Promise<Wallet | null> {
    // prism doesnt support SELECT ... FOR UPDATE
    // so we are using raw queries

    const result = await tx.$queryRaw<
      Array<{
        id: bigint;
        user_id: bigint;
        balance: bigint;
        version: number;
        createdAt: Date;
        updatedAt: Date;
      }>
    >`
      SELECT id, user_id, balance, version, createdAt, updatedAt 
      FROM wallets
      where user_id = ${userId}
      FOR UPDATE
    `;

    if (result.length == 0) {
      return null;
    }

    const walletEntry = result[0];
    return this.mapToWallet(walletEntry);
  }

  async updateBalance(
    walletId: bigint,
    newBalance: bigint,
    expectedVersion: number,
    tx: Prisma.TransactionClient,
  ): Promise<Wallet | null> {
    const result = await tx.wallet.updateMany({
      where: {
        id: walletId,
        version: expectedVersion,
      },
      data: {
        balance: newBalance,
        version: { increment: 1 },
      },
    });

    if (result.count == 0) {
      return null;
    }

    return await this.findById(walletId, tx);
  }

  async debit(
    userId: bigint,
    amount: bigint,
    tx: Prisma.TransactionClient,
  ): Promise<Wallet | null> {
    const wallet = await this.findByUserIdWithLock(userId, tx);

    if (!wallet) {
      return null;
    }

    if (wallet.balance < amount) {
      return null;
    }

    const newBalance = wallet.balance - amount;
    return await this.updateBalance(wallet.id, newBalance, wallet.version, tx);
  }

  async credit(
    userId: bigint,
    amount: bigint,
    tx: Prisma.TransactionClient,
  ): Promise<Wallet | null> {
    const wallet = await this.findByUserIdWithLock(userId, tx);
    if (!wallet) {
      return null;
    }

    const newBalance = wallet.balance + amount;
    return await this.updateBalance(wallet.id, newBalance, wallet.version, tx);
  }

  private mapToWallet(entity: {
    id: bigint;
    user_id: bigint;
    balance: bigint;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Wallet {
    return {
      id: BigInt(entity.id.toString()),
      user_id: BigInt(entity.user_id.toString()),
      balance: BigInt(entity.balance.toString()),
      version: entity.version,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
