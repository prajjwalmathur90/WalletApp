import { Router, Request, Response } from "express";
import { TransactionController } from "../../transaction-service/transaction-controller.js";
import { idempotencyMiddleware } from "../../shared/middleware/idempotency-middleware.js";

const txnRouter = Router();
const transactionController = new TransactionController();

txnRouter.post(
  "/transfer",
  idempotencyMiddleware,
  (req: Request, res: Response) => transactionController.transfer(req, res),
);
txnRouter.get("/:transactionId", (req: Request, res: Response) =>
  transactionController.getTransaction(req, res),
);
txnRouter.get("/history/:userId", (req: Request, res: Response) =>
  transactionController.getHistory(req, res),
);

export default txnRouter;
