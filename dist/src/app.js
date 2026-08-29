import express from "express";
import cors from "cors";
import helmet from "helmet";
import walletRouter from "./api-gateway/routes/wallet-route.js";
import txnRouter from "./api-gateway/routes/transaction.route.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
export function createApp() {
    const app = express();
    app.use(cors());
    app.use(helmet());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            time: new Date().toISOString(),
        });
    });
    app.use("/api/v1/wallets", walletRouter);
    app.use("/api/v1/transactions", txnRouter);
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map