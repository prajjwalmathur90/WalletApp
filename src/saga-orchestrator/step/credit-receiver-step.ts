import { ConnectionManager } from "../../shared/database/connection-manager.js";
import { WalletService } from "../../wallet-service/wallet.services.js";
import { SagaContext } from "../types/saga-context.js";
import { SagaStep } from "../types/saga-step.js";

export class CreditReceiverStep implements SagaStep {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  getName(): string {
    return "CreditReceiverStep";
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if (!context.transaction) {
      throw new Error("Transaction not found");
    }

    await ConnectionManager.executeTransaction(
      context.fromShardId,
      async (tx) => {
        await this.walletService.credit(
          context.fromUser,
          context.amount,
          context.transaction!.id,
          tx,
        );
      },
    );

    context.creditCommited = true;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if (!context.transaction) {
      return;
    }

    if (context.creditCommited) {
      await ConnectionManager.executeTransaction(
        context.fromShardId,
        async (tx) => {
          const debitWallet = await this.walletService.debit(
            context.toUser,
            context.amount,
            context.transaction!.id,
            tx,
          );

          if (!debitWallet) {
            throw new Error(
              "Failed compensate credit - manual intervention required",
            );
          }
        },
      );
    }
  }
}
