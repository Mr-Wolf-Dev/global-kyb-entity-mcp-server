import type { Server } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  parseEuVatResponse,
  parseFrenchCompanyRecord,
  parseGleifRecord,
  toGleifParentRef,
} from '../domain/kyb-parsers.js';
import { normalizeVatNumber } from '../domain/kyb-schema.js';
import type { KybSource } from '../ports/kyb-source.js';
import type { BillingMeter } from '../shared/billing-meter.js';
import { createMcpHttpServer } from '../shared/mcp-http-server.js';
import type { KybBillingEvent } from './apify-actor.js';

export interface McpServerDependencies {
  source: KybSource;
  billing: BillingMeter<KybBillingEvent>;
}

function createConfiguredMcpServer(deps: McpServerDependencies): McpServer {
  const server = new McpServer({
    name: 'global-kyb-entity-mcp-server',
    version: '0.1.0',
  });

  server.registerTool(
    'search_gleif_entities',
    {
      description:
        'Search global legal entities in the official GLEIF LEI registry by company name or exact 20-char LEI (with optional direct/ultimate parent lookup).',
      inputSchema: {
        query: z.string().optional().describe('Company legal name search query'),
        lei: z.string().optional().describe('Exact 20-character LEI code'),
        country: z.string().length(2).optional().describe('Optional 2-letter ISO country code'),
        includeParents: z.boolean().optional().describe('Fetch direct & ultimate parent LEI for exact LEI lookup'),
        maxItems: z.number().int().min(1).max(50).optional().describe('Max results (default 10)'),
      },
    },
    async ({ query, lei, country, includeParents, maxItems }) => {
      const entities = [];
      if (lei) {
        const record = await deps.source.getGleifEntityByLei(lei);
        if (record) {
          const parents =
            includeParents !== false
              ? await deps.source.getGleifParents(record.attributes?.lei ?? record.id)
              : undefined;
          entities.push(
            parseGleifRecord(
              record,
              parents
                ? {
                    directParent: toGleifParentRef(parents.directParent),
                    ultimateParent: toGleifParentRef(parents.ultimateParent),
                  }
                : undefined,
            ),
          );
        }
      } else if (query) {
        const records = await deps.source.searchGleifEntities(query, country, maxItems ?? 10);
        for (const r of records) {
          entities.push(parseGleifRecord(r));
        }
      }

      await deps.billing.charge('mcp-query', 1);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: entities.length, entities }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'verify_eu_vat',
    {
      description:
        'Verify one or more European Union VAT numbers in real time via the official EU Commission VIES REST API.',
      inputSchema: {
        vatNumbers: z
          .array(z.string().min(3))
          .min(1)
          .max(20)
          .describe('List of EU VAT numbers including 2-letter country prefix (e.g. ["IE6388047V"])'),
      },
    },
    async ({ vatNumbers }) => {
      const results = [];
      for (const raw of vatNumbers) {
        const { countryCode, vatNumber } = normalizeVatNumber(raw);
        const res = await deps.source.checkEuVat(countryCode, vatNumber);
        results.push(parseEuVatResponse(res, { countryCode, vatNumber }));
      }
      await deps.billing.charge('mcp-query', 1);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: results.length, results }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'search_fr_companies',
    {
      description:
        'Search the official French SIRENE business registry (SIREN, SIRET, NAF/APE code, HQ address, directors, active status).',
      inputSchema: {
        query: z.string().min(1).describe('Company name, SIREN, or SIRET'),
        maxItems: z.number().int().min(1).max(25).optional().describe('Max companies to return (default 10)'),
      },
    },
    async ({ query, maxItems }) => {
      const rawCompanies = await deps.source.searchFrenchCompanies(query, maxItems ?? 10);
      const companies = rawCompanies.map(parseFrenchCompanyRecord);
      await deps.billing.charge('mcp-query', 1);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: companies.length, companies }, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

/**
 * Creates a stateless Streamable HTTP MCP server compatible with Apify Standby mode.
 */
export function createKybMcpHttpServer(deps: McpServerDependencies): Server {
  return createMcpHttpServer({
    serviceName: 'global-kyb-entity-mcp-server',
    createServer: () => createConfiguredMcpServer(deps),
  });
}
