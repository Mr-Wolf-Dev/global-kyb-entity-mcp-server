import { gotScraping } from 'got-scraping';
import type {
  RawEuVatResponse,
  RawFrenchCompany,
  RawGleifRecord,
} from '../domain/kyb-parsers.js';
import type { KybSource } from '../ports/kyb-source.js';
import { fetchJsonWithRetry } from '../shared/http-client.js';

async function fetchOptionalJson<T>(url: string): Promise<T | null> {
  const response = await gotScraping({
    url,
    http2: false,
    timeout: { request: 15000 },
    throwHttpErrors: false,
    headers: { Accept: 'application/json' },
  });

  if (response.statusCode === 404) {
    return null;
  }
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`HTTP ${response.statusCode} from ${url}`);
  }
  return JSON.parse(response.body) as T;
}

/**
 * HTTP-only KYB client querying official keyless GLEIF, EU VIES, and French SIRENE APIs.
 */
export class KybHttpClient implements KybSource {
  async searchGleifEntities(
    query: string,
    country?: string,
    limit = 20,
  ): Promise<RawGleifRecord[]> {
    const params = new URLSearchParams({
      'filter[entity.legalName]': query,
      'page[size]': String(Math.max(1, Math.min(100, limit))),
    });
    if (country) {
      params.set('filter[entity.legalAddress.country]', country.toUpperCase());
    }
    const url = `https://api.gleif.org/api/v1/lei-records?${params.toString()}`;
    const res = await fetchJsonWithRetry<{ data?: RawGleifRecord[] }>(url);
    return Array.isArray(res.data) ? res.data : [];
  }

  async getGleifEntityByLei(lei: string): Promise<RawGleifRecord | null> {
    const cleanLei = encodeURIComponent(lei.trim().toUpperCase());
    const url = `https://api.gleif.org/api/v1/lei-records/${cleanLei}`;
    const res = await fetchOptionalJson<{ data?: RawGleifRecord }>(url);
    return res?.data ?? null;
  }

  async getGleifParents(lei: string): Promise<{
    directParent: RawGleifRecord | null;
    ultimateParent: RawGleifRecord | null;
  }> {
    const cleanLei = encodeURIComponent(lei.trim().toUpperCase());
    const [directRes, ultimateRes] = await Promise.all([
      fetchOptionalJson<{ data?: RawGleifRecord }>(
        `https://api.gleif.org/api/v1/lei-records/${cleanLei}/direct-parent`,
      ),
      fetchOptionalJson<{ data?: RawGleifRecord }>(
        `https://api.gleif.org/api/v1/lei-records/${cleanLei}/ultimate-parent`,
      ),
    ]);

    return {
      directParent: directRes?.data ?? null,
      ultimateParent: ultimateRes?.data ?? null,
    };
  }

  async checkEuVat(countryCode: string, vatNumber: string): Promise<RawEuVatResponse> {
    return fetchJsonWithRetry<RawEuVatResponse>(
      'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number',
      {
        method: 'POST',
        json: {
          countryCode: countryCode.toUpperCase(),
          vatNumber,
        },
      },
    );
  }

  async searchFrenchCompanies(query: string, limit = 10): Promise<RawFrenchCompany[]> {
    const params = new URLSearchParams({
      q: query,
      per_page: String(Math.max(1, Math.min(25, limit))),
    });
    const url = `https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`;
    const res = await fetchJsonWithRetry<{ results?: RawFrenchCompany[] }>(url);
    return Array.isArray(res.results) ? res.results : [];
  }
}
