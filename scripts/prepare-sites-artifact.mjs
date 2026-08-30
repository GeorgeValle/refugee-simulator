import { cp, mkdir } from "node:fs/promises";

const clientDirectory = "dist/client";
const workerDirectory = "dist/refugee_simulator";

await cp(clientDirectory, "dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await cp(`${workerDirectory}/index.js`, "dist/server/index.js");
