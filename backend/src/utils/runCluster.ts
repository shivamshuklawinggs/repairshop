import cluster, { Worker } from "node:cluster";
import os from "node:os";

export interface ClusterOptions {
  workers?: number;
  restartOnExit?: boolean;
  runOnCluster?: boolean;
  onWorkerStart?: (worker: Worker) => void;
}

export function runCluster(
  startWorker: () => void,
  options: ClusterOptions = {}
) {
  const {
    workers = os.cpus().length,
    restartOnExit = true,
    runOnCluster = false,
    onWorkerStart,
  } = options;

  // Run normally without cluster
  if (!runOnCluster) {
    console.log("Running without cluster mode");
    startWorker();
    return;
  }

  // Cluster mode
  if (cluster.isPrimary) {
    console.log(`Master ${process.pid} running`);
    console.log(`Starting ${workers} workers`);

    for (let i = 0; i < workers; i++) {
      const worker = cluster.fork();
      onWorkerStart?.(worker);
    }

    cluster.on("exit", (worker, code, signal) => {
      console.warn(
        `Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`
      );

      if (restartOnExit) {
        console.log("Restarting worker...");
        cluster.fork();
      }
    });

  } else {
    console.log(`Worker ${process.pid} started`);
    startWorker();
  }
}