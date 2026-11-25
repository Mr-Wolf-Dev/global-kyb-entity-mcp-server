import { Actor } from 'apify';
import {
  parseEuVatResponse,
  parseFrenchCompanyRecord,
  parseGleifRecord,
  toGleifParentRef,
} from '../domain/kyb-parsers.js';
import {
  normalizeVatNumber,
  parseActorInput,
  type KybOutputRecord,
} from '../domain/kyb-schema.js';
import type { KybSource } from '../ports/kyb-source.js';
import type { BillingMeter } from '../shared/billing-meter.js';

export type KybBillingEvent = 'entity-checked' | 'mcp-query';

export interface ExtractionDependencies {
  source: KybSource;
  billing: BillingMeter<KybBillingEvent>;
  pushData: (items: KybOutputRecord[]) => Promise<void>;
}

/**
 * Runs batch KYB checks across GLEIF LEI, EU VIES VAT, and optional French SIRENE registry.
 */
export async function runKybExtraction(
  rawInput: unknown,
  deps: ExtractionDependencies,
): Promise<KybOutputRecord[]> {
  const input = parseActorInput(rawInput);
  const results: KybOutputRecord[] = [];

  if (input.lei) {
    const record = await deps.source.getGleifEntityByLei(input.lei);
    if (record) {
      const parents = input.includeParents
        ? await deps.source.getGleifParents(record.attributes?.lei ?? record.id)
        : undefined;
      results.push(
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
  } else if (input.query) {
    const gleifRecords = await deps.source.searchGleifEntities(
      input.query,
      input.country,
      input.maxItems,
    );
    for (const raw of gleifRecords) {
      results.push(parseGleifRecord(raw));
    }

    if (input.includeFrenchRegistry) {
      const frRecords = await deps.source.searchFrenchCompanies(input.query, input.maxItems);
      for (const fr of frRecords) {
        results.push(parseFrenchCompanyRecord(fr));
      }
    }
  }

  for (const rawVat of input.vatNumbers) {
    const { countryCode, vatNumber } = normalizeVatNumber(rawVat);
    const vatRes = await deps.source.checkEuVat(countryCode, vatNumber);
    results.push(parseEuVatResponse(vatRes, { countryCode, vatNumber }));
  }

  if (results.length > 0) {
    await deps.pushData(results);
    await deps.billing.charge('entity-checked', results.length);
  }

  return results;
}

/**
 * Runs the standard batch Apify Actor extraction mode.
 */
export async function runActorBatch(
  source: KybSource,
  billing: BillingMeter<KybBillingEvent>,
): Promise<void> {
  const input = await Actor.getInput();
  await runKybExtraction(input, {
    source,
    billing,
    pushData: async (items) => {
      await Actor.pushData(items);
    },
  });
}
