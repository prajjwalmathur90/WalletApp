import { Router, Request, Response } from "express";
import { WalletController } from "../../wallet-service/wallet.controller.js";

const walletRouter = Router();
const walletController = new WalletController();

walletRouter.post("/", (_req: Request, _res: Response) =>
  walletController.createWallet.bind(walletController),
);
walletRouter.get("/:userId", (_req: Request, _res: Response) =>
  walletController.getWallet.bind(walletController),
);
walletRouter.post("/:userId/add-money", (_req: Request, _res: Response) =>
  walletController.addMoney.bind(walletController),
);

export default walletRouter;
