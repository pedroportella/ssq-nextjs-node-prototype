import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

async function start() {
  const config = loadConfig();
  const app = await buildApp({ config });

  try {
    await app.listen({
      host: config.HOST,
      port: config.PORT
    });
  } catch (error) {
    app.log.error({ error }, "Backend failed to start");
    process.exitCode = 1;
  }
}

await start();
