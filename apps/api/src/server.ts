import "dotenv/config";
import { buildApp } from "./app.js";

const PORT = Number(process.env.API_PORT ?? 8787);

async function main() {
  const app = await buildApp();
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`TestHive API listening on http://0.0.0.0:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
