import dotenv from "dotenv";
import { createApp } from "./app.js";
import {
  closePrimsaClient,
  getShard1Client,
  getShard2Client,
} from "./shared/database/prisma-client.js";

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 3000;
const app = createApp();

async function initializeDatabase(): Promise<void> {
  try {
    getShard1Client();
    getShard2Client();
  } catch (err) {
    console.error("Failed to initialze database : ", err);
    process.exit(1); // terminate process with code 1 : 1 -> something went wrong
  }
}

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on the port : ${PORT}`);
  });
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received");
  await closePrimsaClient();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received");
  await closePrimsaClient();
  process.exit(0); // terminate the process with code 0 : 0 -> success
});
