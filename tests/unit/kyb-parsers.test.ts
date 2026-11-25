import { describe, expect, it } from 'vitest';
import {
  parseEuVatResponse,
  parseFrenchCompanyRecord,
  parseGleifRecord,
  toGleifParentRef,
} from '../../src/domain/kyb-parsers.js';
import { normalizeVatNumber, parseActorInput } from '../../src/domain/kyb-schema.js';

describe('kyb-schema', () => {
  it('normalizes EU VAT numbers and validates actor input', () => {
    expect(normalizeVatNumber('ie 6388047v')).toEqual({
      countryCode: 'IE',
      vatNumber: '6388047V',
    });
    expect(normalizeVatNumber('DE-123.456.789')).toEqual({
      countryCode: 'DE',
      vatNumber: '123456789',
    });
    expect(() => normalizeVatNumber('12345')).toThrow();

    const parsed = parseActorInput({ query: 'Apple', country: 'us', maxItems: 10 });
    expect(parsed.country).toBe('US');
    expect(parsed.maxItems).toBe(10);
  });
});

describe('kyb-parsers', () => {
  it('parses GLEIF LEI record with parent references', () => {
    const entity = parseGleifRecord(
      {
        id: 'HWUPKR0MPOU8FGXBT394',
        attributes: {
          lei: 'HWUPKR0MPOU8FGXBT394',
          entity: {
            legalName: { name: 'Apple Inc.' },
            legalAddress: {
              addressLines: ['One Apple Park Way'],
              city: 'Cupertino',
              country: 'US',
              postalCode: '95014',
            },
            status: 'ACTIVE',
            legalForm: { id: 'XTIQ' },
            category: 'GENERAL',
          },
          registration: { status: 'ISSUED' },
        },
      },
      {
        directParent: toGleifParentRef({
          id: 'PARENT123',
          attributes: { entity: { legalName: { name: 'Parent Corp' }, legalAddress: { country: 'US' } } },
        }),
        ultimateParent: null,
      },
    );

    expect(entity.recordId).toBe('lei:HWUPKR0MPOU8FGXBT394');
    expect(entity.legalName).toBe('Apple Inc.');
    expect(entity.directParent?.lei).toBe('PARENT123');
    expect(entity.ultimateParent).toBeNull();
  });

  it('parses EU VIES VAT and French SIRENE responses', () => {
    const vat = parseEuVatResponse(
      {
        countryCode: 'IE',
        vatNumber: '6388047V',
        valid: true,
        name: 'GOOGLE IRELAND LIMITED',
        address: '---',
        requestDate: '2026-11-25T08:00:00Z',
      },
      { countryCode: 'IE', vatNumber: '6388047V' },
    );

    expect(vat.valid).toBe(true);
    expect(vat.name).toBe('GOOGLE IRELAND LIMITED');
    expect(vat.address).toBeNull();

    const fr = parseFrenchCompanyRecord({
      siren: '775670417',
      nom_complet: 'LVMH MOET HENNESSY LOUIS VUITTON',
      etat_administratif: 'A',
      date_creation: '1971-01-01',
      siege: {
        siret: '77567041700051',
        activite_principale: '70.10Z',
        adresse: '22 AVENUE MONTAIGNE 75008 PARIS',
        code_postal: '75008',
        libelle_commune: 'PARIS',
      },
      dirigeants: [{ nom: 'ARNAULT', prenoms: 'BERNARD' }],
    });

    expect(fr.recordId).toBe('fr:775670417');
    expect(fr.active).toBe(true);
    expect(fr.directors).toEqual(['BERNARD ARNAULT']);
  });
});
