import { ConnectionManager } from "../../shared/database/connection-manager.js";
import { WalletService } from "../../wallet-service/wallet-services.js";
import { SagaContext } from "../types/saga-context.js";
import { SagaStep } from "../types/saga-step.js";

export class DebitSenderStep implements SagaStep {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  getName(): string {
    return "DebitSenderStep";
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if (!context.transaction) {
      throw new Error("Transaction not found");
    }

    await ConnectionManager.executeTransaction(
      context.fromShardId,
      async (tx) => {
        const debitWallet = await this.walletService.debit(
          context.fromUser,
          context.amount,
          context.transaction!.id,
          tx,
        );

        if (!debitWallet) {
          throw new Error(
            "Insufficient balance or concurrent modification detected",
          );
        }
      },
    );

    context.debitCommited = true;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if (!context.transaction) {
      return;
    }

    // check if debit was commited;
    // fromQueryRunner is treated as a live DB transaction Client

    // if the debit ran inside a transaction and it has not been commit yet, you dont maually "credit back"
    // you rollback so that the debit never becomes durable
    // then clear query runner so that nothing tries to use it again

    if (context.fromQueryRunner) {
      await (context.fromQueryRunner as any).$rollback();
      context.fromQueryRunner = undefined;
      return;
    }

    if (context.debitCommited) {
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
    }
  }
}
