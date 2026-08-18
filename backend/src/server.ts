process.env.TZ = 'America/Los_Angeles'
import express, { Express } from "express";
import swaggerUi from "swagger-ui-express";

import rootRouter from "routes";
import generateSwaggerSpec from "routes/swaggerSpec";

import { NODE_ENV, PORT, RUN_ON_CLUSTER } from "config";

import connectDB from "config/database";
import { applyBaseSetup } from "./baseSetup/ExpressSetup";
import initializeServices from "baseSetup/initilizeServices";
import { runCluster } from "./utils/runCluster";
import { createServer } from "node:http";
const app: Express = express();
const httpServer = createServer(app);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    applyBaseSetup(app);
    console.log("🚀 Initializing services...");
    await initializeServices();

    const swaggerSpec = await generateSwaggerSpec();

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      })
    );

    app.get("/swagger.json", (_req, res) => res.json(swaggerSpec));

    app.use(rootRouter);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
    });

  } catch (err) {
    console.error("❌ Error establishing server", err);
  }
};

runCluster(startServer, {
  runOnCluster: RUN_ON_CLUSTER === "true",
  restartOnExit: true,
});
console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Offset:', new Date().getTimezoneOffset());
console.log('Now:', new Date());