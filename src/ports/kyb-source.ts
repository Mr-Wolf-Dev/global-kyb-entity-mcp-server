import type {
  RawEuVatResponse,
  RawFrenchCompany,
  RawGleifRecord,
} from '../domain/kyb-parsers.js';

export interface KybSource {
  searchGleifEntities(query: string, country?: string, limit?: number): Promise<RawGleifRecord[]>;
  getGleifEntityByLei(lei: string): Promise<RawGleifRecord | null>;
  getGleifParents(lei: string): Promise<{
    directParent: RawGleifRecord | null;
    ultimateParent: RawGleifRecord | null;
  }>;
  checkEuVat(countryCode: string, vatNumber: string): Promise<RawEuVatResponse>;
  searchFrenchCompanies(query: string, limit?: number): Promise<RawFrenchCompany[]>;
}
