import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runKybExtraction, type KybBillingEvent } from '../../src/adapters/apify-actor.js';
import { createKybMcpHttpServer } from '../../src/adapters/mcp-server.js';
import type { KybSource } from '../../src/ports/kyb-source.js';
import type { BillingMeter } from '../../src/shared/billing-meter.js';

const fakeSource: KybSource = {
  async searchGleifEntities(query) {
    return [
      {
        id: 'LEI-APPLE',
        attributes: {
          lei: 'LEI-APPLE',
          entity: {
            legalName: { name: `${query} Inc.` },
            legalAddress: { country: 'US', city: 'Cupertino' },
            status: 'ACTIVE',
          },
        },
      },
    ];
  },
  async getGleifEntityByLei(lei) {
    return {
      id: lei,
      attributes: {
        lei,
        entity: { legalName: { name: 'Exact Entity Ltd' }, legalAddress: { country: 'GB' } },
      },
    };
  },
  async getGleifParents() {
    return { directParent: null, ultimateParent: null };
  },
  async checkEuVat(countryCode, vatNumber) {
    return { countryCode, vatNumber, valid: true, name: 'TEST TRADER LTD', address: 'DUBLIN' };
  },
  async searchFrenchCompanies(query) {
    return [
      {
        siren: '919781021',
        nom_complet: `${query} FRANCE`,
        etat_administratif: 'A',
        siege: { siret: '91978102100010', activite_principale: '68.20B' },
      },
    ];
  },
};

describe('Global KYB Actor & Streamable HTTP MCP Server', () => {
  const charges: Array<{ eventName: KybBillingEvent; count: number }> = [];
  const billing: BillingMeter<KybBillingEvent> = {
    async charge(eventName, count = 1) {
      charges.push({ eventName, count });
    },
  };

  let baseUrl = '';
  let closeServer: () => Promise<void>;

  beforeAll(async () => {
    const server = createKybMcpHttpServer({ source: fakeSource, billing });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    closeServer = () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
  });

  afterAll(async () => {
    await closeServer();
  });

  it('runs batch KYB extraction and charges entity-checked', async () => {
    charges.length = 0;
    const pushed: unknown[] = [];

    const results = await runKybExtraction(
      { query: 'Apple', vatNumbers: ['IE6388047V'], includeFrenchRegistry: true },
      {
        source: fakeSource,
        billing,
        pushData: async (items) => {
          pushed.push(...items);
        },
      },
    );

    expect(results).toHaveLength(3);
    expect(pushed).toHaveLength(3);
    expect(charges).toEqual([{ eventName: 'entity-checked', count: 3 }]);
  });

  it('serves /mcp/.well-known/glama.json and all 3 KYB MCP tools', async () => {
    charges.length = 0;
    const glamaRes = await fetch(`${baseUrl}/mcp/.well-known/glama.json`);
    expect(glamaRes.status).toBe(200);

    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);

    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual([
      'search_gleif_entities',
      'verify_eu_vat',
      'search_fr_companies',
    ]);

    const gleifRes = await client.callTool({
      name: 'search_gleif_entities',
      arguments: { lei: 'LEI-EXACT' },
    });
    expect(
      JSON.parse((gleifRes.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}').count,
    ).toBe(1);

    const vatRes = await client.callTool({
      name: 'verify_eu_vat',
      arguments: { vatNumbers: ['IE6388047V'] },
    });
    expect(
      JSON.parse((vatRes.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}').results[0]
        ?.valid,
    ).toBe(true);

    const frRes = await client.callTool({
      name: 'search_fr_companies',
      arguments: { query: 'LVMH' },
    });
    expect(
      JSON.parse((frRes.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}').count,
    ).toBe(1);

    expect(charges).toEqual([
      { eventName: 'mcp-query', count: 1 },
      { eventName: 'mcp-query', count: 1 },
      { eventName: 'mcp-query', count: 1 },
    ]);

    await transport.close();
  });
});
