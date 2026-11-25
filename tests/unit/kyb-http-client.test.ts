import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { KybHttpClient } from '../../src/adapters/kyb-http-client.js';

const server = setupServer();

describe('KybHttpClient', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('queries GLEIF, handles 404 parent records, checks EU VIES VAT, and searches French SIRENE', async () => {
    server.use(
      http.get('https://api.gleif.org/api/v1/lei-records', () =>
        HttpResponse.json({
          data: [{ id: 'LEI1', attributes: { lei: 'LEI1', entity: { legalName: { name: 'Acme SA' } } } }],
        }),
      ),
      http.get('https://api.gleif.org/api/v1/lei-records/LEI1/direct-parent', () =>
        HttpResponse.json({ errors: [{ status: '404' }] }, { status: 404 }),
      ),
      http.get('https://api.gleif.org/api/v1/lei-records/LEI1/ultimate-parent', () =>
        HttpResponse.json({
          data: { id: 'ULT1', attributes: { lei: 'ULT1', entity: { legalName: { name: 'Holding SA' } } } },
        }),
      ),
      http.post('https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number', () =>
        HttpResponse.json({ countryCode: 'IE', vatNumber: '6388047V', valid: true, name: 'GOOGLE IRELAND LIMITED' }),
      ),
      http.get('https://recherche-entreprises.api.gouv.fr/search', () =>
        HttpResponse.json({ results: [{ siren: '123456789', nom_complet: 'ACME FRANCE' }] }),
      ),
    );

    const client = new KybHttpClient();
    const gleif = await client.searchGleifEntities('Acme', 'FR', 5);
    const parents = await client.getGleifParents('LEI1');
    const vat = await client.checkEuVat('IE', '6388047V');
    const fr = await client.searchFrenchCompanies('ACME', 5);

    expect(gleif).toHaveLength(1);
    expect(parents.directParent).toBeNull();
    expect(parents.ultimateParent?.id).toBe('ULT1');
    expect(vat.valid).toBe(true);
    expect(fr[0]?.siren).toBe('123456789');
  });
});
