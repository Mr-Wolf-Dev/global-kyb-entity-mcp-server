import type {
  EuVatResult,
  FrenchCompanyRecord,
  GleifEntity,
  GleifParentRef,
} from './kyb-schema.js';

export interface RawGleifRecord {
  id: string;
  attributes?: {
    lei?: string;
    entity?: {
      legalName?: { name?: string };
      legalAddress?: {
        addressLines?: string[];
        city?: string;
        country?: string;
        postalCode?: string;
      };
      status?: string;
      legalForm?: { id?: string };
      category?: string;
    };
    registration?: {
      status?: string;
    };
  };
}

/**
 * Normalizes a single GLEIF JSON:API LEI record.
 */
export function parseGleifRecord(
  raw: RawGleifRecord,
  parents?: { directParent?: GleifParentRef | null; ultimateParent?: GleifParentRef | null },
): GleifEntity {
  const lei = raw.attributes?.lei ?? raw.id;
  const entity = raw.attributes?.entity;
  const addr = entity?.legalAddress;

  return {
    recordType: 'gleif_entity',
    recordId: `lei:${lei}`,
    lei,
    legalName: entity?.legalName?.name?.trim() || lei,
    country: addr?.country ?? null,
    city: addr?.city ?? null,
    addressLines: Array.isArray(addr?.addressLines) ? addr.addressLines : [],
    postalCode: addr?.postalCode ?? null,
    entityStatus: entity?.status ?? null,
    registrationStatus: raw.attributes?.registration?.status ?? null,
    legalFormId: entity?.legalForm?.id ?? null,
    category: entity?.category ?? null,
    ...(parents?.directParent !== undefined ? { directParent: parents.directParent } : {}),
    ...(parents?.ultimateParent !== undefined ? { ultimateParent: parents.ultimateParent } : {}),
    gleifUrl: `https://search.gleif.org/#/record/${lei}`,
  };
}

export function toGleifParentRef(raw: RawGleifRecord | null): GleifParentRef | null {
  if (!raw) return null;
  const lei = raw.attributes?.lei ?? raw.id;
  return {
    lei,
    legalName: raw.attributes?.entity?.legalName?.name?.trim() ?? null,
    country: raw.attributes?.entity?.legalAddress?.country ?? null,
  };
}

export interface RawEuVatResponse {
  countryCode?: string;
  vatNumber?: string;
  requestDate?: string;
  valid?: boolean;
  name?: string;
  address?: string;
}

function cleanViesField(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '---') return null;
  return trimmed;
}

/**
 * Normalizes an EU Commission VIES REST VAT check response.
 */
export function parseEuVatResponse(
  raw: RawEuVatResponse,
  fallback: { countryCode: string; vatNumber: string },
): EuVatResult {
  const countryCode = raw.countryCode ?? fallback.countryCode;
  const vatNumber = raw.vatNumber ?? fallback.vatNumber;

  return {
    recordType: 'eu_vat',
    recordId: `vat:${countryCode}${vatNumber}`,
    countryCode,
    vatNumber,
    valid: raw.valid === true,
    name: cleanViesField(raw.name),
    address: cleanViesField(raw.address),
    requestDate: raw.requestDate ?? null,
  };
}

export interface RawFrenchCompany {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  nature_juridique?: string;
  tranche_effectif_salarie?: string | null;
  etat_administratif?: string;
  date_creation?: string | null;
  siege?: {
    siret?: string;
    activite_principale?: string;
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
  };
  dirigeants?: Array<{
    nom?: string;
    prenoms?: string;
    denomination?: string;
  }>;
}

/**
 * Normalizes a French SIRENE (recherche-entreprises.api.gouv.fr) company record.
 */
export function parseFrenchCompanyRecord(raw: RawFrenchCompany): FrenchCompanyRecord {
  const siren = raw.siren ?? '';
  const directors = (raw.dirigeants ?? [])
    .map((d) => {
      if (d.denomination) return d.denomination.trim();
      return [d.prenoms, d.nom].filter(Boolean).join(' ').trim();
    })
    .filter(Boolean);

  return {
    recordType: 'french_company',
    recordId: `fr:${siren}`,
    siren,
    siretSiege: raw.siege?.siret ?? null,
    legalName: raw.nom_complet?.trim() || raw.nom_raison_sociale?.trim() || siren,
    nafCode: raw.siege?.activite_principale ?? null,
    legalNatureCode: raw.nature_juridique ?? null,
    employeeRange: raw.tranche_effectif_salarie ?? null,
    address: raw.siege?.adresse ?? null,
    postalCode: raw.siege?.code_postal ?? null,
    city: raw.siege?.libelle_commune ?? null,
    active: raw.etat_administratif === 'A',
    creationDate: raw.date_creation ?? null,
    directors,
    annuaireUrl: `https://annuaire-entreprises.data.gouv.fr/entreprise/${siren}`,
  };
}
