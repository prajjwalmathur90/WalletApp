import { Router, Request, Response } from "express";
import { WalletController } from "../../wallet-service/wallet.controller.js";
import { idempotencyMiddleware } from "../../shared/middleware/idempotency-middleware.js";

const walletRouter = Router();
const walletController = new WalletController();

walletRouter.post("/", (req: Request, res: Response) =>
  walletController.createWallet(req, res),
);
walletRouter.get("/:userId", (req: Request, res: Response) =>
  walletController.getWallet(req, res),
);
walletRouter.post(
  "/:userId/add-money",
  idempotencyMiddleware,
  (req: Request, res: Response) => walletController.addMoney(req, res),
);

export default walletRouter;
