import "dotenv/config";
import { runDueJobs } from "../src/services/jobs";

async function main() {
  const result = await runDueJobs(100);
  console.log(
    `[jobs:process] processed=${result.processed} failed=${result.failed} skipped=${result.skipped}`
  );
}

main().catch((error) => {
  console.error("[jobs:process] failed", error);
  process.exitCode = 1;
});
