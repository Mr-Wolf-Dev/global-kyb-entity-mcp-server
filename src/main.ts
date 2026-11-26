import { pathToFileURL } from 'node:url';
import { runActorBatch, type KybBillingEvent } from './adapters/apify-actor.js';
import { KybHttpClient } from './adapters/kyb-http-client.js';
import { createConfiguredMcpServer, createKybMcpHttpServer } from './adapters/mcp-server.js';
import { runDualModeActor } from './shared/actor-runner.js';
import { createApifyBillingMeter } from './shared/billing-meter.js';

export async function main(): Promise<void> {
  const source = new KybHttpClient();
  const billing = createApifyBillingMeter<KybBillingEvent>();

  await runDualModeActor({
    runBatch: () => runActorBatch(source, billing),
    createMcpServer: () => createKybMcpHttpServer({ source, billing }),
    createStdioMcpServer: () => createConfiguredMcpServer({ source, billing }),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
