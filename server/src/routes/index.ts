import { Router } from "express";
import charityRouter from "./charity.routes.js";
import drawRouter from "./draw.routes.js";
import healthRouter from "./health.routes.js";
import payoutRouter from "./payout.routes.js";
import scoreRouter from "./score.routes.js";
import subscriptionRouter from "./subscription.routes.js";
import userRouter from "./user.routes.js";
import webhookRouter from "./webhook.routes.js";

const apiRouter = Router();

apiRouter.use("/", healthRouter);
apiRouter.use("/", userRouter);
apiRouter.use("/", scoreRouter);
apiRouter.use("/", charityRouter);
apiRouter.use("/", subscriptionRouter);
apiRouter.use("/", webhookRouter);
apiRouter.use("/", drawRouter);
apiRouter.use("/", payoutRouter);

export default apiRouter;
