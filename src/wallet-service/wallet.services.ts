import { LedgerType, Wallet } from "../shared/types/shared-types.js";
import { ShardResolver } from "../shared/database/shard-resolver.js";
import { WalletRepository } from "../shared/repositories/wallet.repository.js";
import { LedgerRepository } from "../shared/repositories/ledger.repository.js";
import { ConnectionManager } from "../shared/database/connection-manager.js";

export class WalletService {
  private walletRepository: WalletRepository;
  private ledgerRepository: LedgerRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.ledgerRepository = new LedgerRepository();
  }

  async createWallet(userId: bigint): Promise<Wallet> {
    const shardId = ShardResolver.getShardId(userId);

    return await ConnectionManager.executeTransaction(shardId, async (tx) => {
      const existingWallet = await this.walletRepository.findByUserId(
        userId,
        tx,
      );

      if (existingWallet) {
        throw new Error("Wallet already exist");
      }

      return await this.walletRepository.create(userId, tx);
    });
  }

  async getWallet(userId: bigint): Promise<Wallet | null> {
    const shardId = ShardResolver.getShardId(userId);
    const client = ConnectionManager.getClient(shardId);

    return await this.walletRepository.findByUserId(userId, client);
  }

  async addMoney(
    userId: bigint,
    amount: bigint,
    transactionId?: bigint,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new Error("Amount has to be positive");
    }

    const shardId = ShardResolver.getShardId(userId);

    return await ConnectionManager.executeTransaction(shardId, async (tx) => {
      const wallet = await this.walletRepository.findByUserIdWithLock(
        userId,
        tx,
      );

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const newBalance = wallet.balance + amount;
      const updateWallet = await this.walletRepository.updateBalance(
        wallet.id,
        newBalance,
        wallet.version,
        tx,
      );

      if (!updateWallet) {
        throw new Error("Concurrent Modification Detected");
      }

      if (transactionId) {
        await this.ledgerRepository.create(
          userId,
          transactionId,
          amount,
          LedgerType.CREDIT,
          tx,
        );
      }

      return updateWallet;
    });
  }

  async debit(
    userId: bigint,
    amount: bigint,
    transactionId: bigint,
    tx: any,
  ): Promise<Wallet | null> {
    const updatedWallet = await this.walletRepository.debit(userId, amount, tx);

    if (updatedWallet) {
      await this.ledgerRepository.create(
        userId,
        transactionId,
        amount,
        LedgerType.DEBIT,
        tx,
      );
    }

    return updatedWallet;
  }

  async credit(
    userId: bigint,
    amount: bigint,
    transactionId: bigint,
    tx: any,
  ): Promise<Wallet> {
    const wallet = await this.walletRepository.findByUserIdWithLock(userId, tx);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const updatedWallet = await this.walletRepository.credit(
      userId,
      amount,
      tx,
    );
    if (!updatedWallet) {
      throw new Error("Concurrent Modification Detected");
    }

    await this.ledgerRepository.create(
      userId,
      transactionId,
      amount,
      LedgerType.CREDIT,
      tx,
    );

    return updatedWallet;
  }
}
