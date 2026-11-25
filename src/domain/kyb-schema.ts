import { z } from 'zod';

/**
 * Splits a European VAT string (e.g. "IE 6388047V" or "DE-123456789") into countryCode + vatNumber.
 */
export function normalizeVatNumber(raw: string): { countryCode: string; vatNumber: string } {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = cleaned.match(/^([A-Z]{2})([A-Z0-9]{2,20})$/);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid EU VAT number format: "${raw}". Expected e.g. "IE6388047V".`);
  }
  return {
    countryCode: match[1],
    vatNumber: match[2],
  };
}

export const ActorInputSchema = z.object({
  query: z.string().trim().optional(),
  lei: z.string().trim().optional(),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  vatNumbers: z.array(z.string().min(1)).default([]),
  includeFrenchRegistry: z.boolean().default(false),
  includeParents: z.boolean().default(true),
  maxItems: z.number().int().min(1).max(100).default(20),
});

export type ActorInput = z.infer<typeof ActorInputSchema>;

export function parseActorInput(raw: unknown): ActorInput {
  return ActorInputSchema.parse(raw ?? {});
}

export interface GleifParentRef {
  lei: string;
  legalName: string | null;
  country: string | null;
}

export interface GleifEntity {
  recordType: 'gleif_entity';
  recordId: string;
  lei: string;
  legalName: string;
  country: string | null;
  city: string | null;
  addressLines: string[];
  postalCode: string | null;
  entityStatus: string | null;
  registrationStatus: string | null;
  legalFormId: string | null;
  category: string | null;
  directParent?: GleifParentRef | null;
  ultimateParent?: GleifParentRef | null;
  gleifUrl: string;
}

export interface EuVatResult {
  recordType: 'eu_vat';
  recordId: string;
  countryCode: string;
  vatNumber: string;
  valid: boolean;
  name: string | null;
  address: string | null;
  requestDate: string | null;
}

export interface FrenchCompanyRecord {
  recordType: 'french_company';
  recordId: string;
  siren: string;
  siretSiege: string | null;
  legalName: string;
  nafCode: string | null;
  legalNatureCode: string | null;
  employeeRange: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  active: boolean;
  creationDate: string | null;
  directors: string[];
  annuaireUrl: string;
}

export type KybOutputRecord = GleifEntity | EuVatResult | FrenchCompanyRecord;
