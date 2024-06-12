import { onRequest } from "firebase-functions/v1/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import programWebhook from "./programWebhook";
import { sweepFees } from "./sweepFees";
import cors = require("cors");

exports.programWebhook = onRequest(async (req, res) =>
  cors({ origin: true })(req, res, async () => await programWebhook(req, res))
);

exports.sweepFees = onSchedule("every 15 mins", async (_) => {
  sweepFees();
});
