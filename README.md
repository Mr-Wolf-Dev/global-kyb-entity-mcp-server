# Global KYB Entity, LEI & EU VAT Registry + MCP

[![Glama MCP Server](https://glama.ai/mcp/servers/Mr-Wolf-Dev/global-kyb-entity-mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/Mr-Wolf-Dev/global-kyb-entity-mcp-server)

**Keyless, HTTP-only (< 512 MB RAM) Apify Actor & Standby Streamable HTTP MCP Server** for automated Know-Your-Business (KYB), legal entity verification, corporate parent trees, and real-time EU VAT validation.

- **Apify Store:** `https://apify.com/mr.wolf/global-kyb-entity-mcp-server`
- **Standby MCP Endpoint:** `https://mr-wolf-1--global-kyb-entity-mcp-server.apify.actor/mcp`
- **Source Code:** `https://github.com/Mr-Wolf-Dev/global-kyb-entity-mcp-server`

## Official Keyless Data Sources

1. **GLEIF LEI Registry (`api.gleif.org`):** Global 20-character Legal Entity Identifiers, legal addresses, entity/registration status, plus direct & ultimate parent LEI resolution.
2. **EU Commission VIES (`ec.europa.eu`):** Real-time European Union VAT number verification returning validity, registered trader name, and address.
3. **French SIRENE Registry (`recherche-entreprises.api.gouv.fr`):** Official French business registry returning SIREN, SIRET, NAF/APE code, HQ address, directors, and active status.

## MCP Tools (Streamable HTTP)

- `search_gleif_entities` — Search GLEIF by company name/country or exact LEI (including parent entities).
- `verify_eu_vat` — Verify one or more EU VAT numbers in real time via VIES.
- `search_fr_companies` — Search the official French SIRENE registry.

---

## Quick REST API Call

```bash
curl -X POST "https://api.apify.com/v2/acts/mr.wolf~global-kyb-entity-mcp-server/run-sync-get-dataset-items?token=YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d {}
```

## Related HTTP-Only MCP Actors by Mr. Wolf

All Actors run HTTP-only (< 512 MB RAM, zero headless browsers) with Pay-Per-Event pricing and Streamable HTTP Standby MCP endpoints:

| Actor | Use Case | Apify Store | Source |
| --- | --- | --- | --- |
| **Shopify Store Intel, Apps & Catalog** | Themes, 28+ apps & pixels, BNPL payments, /products.json | [Apify Store](https://apify.com/mr.wolf/shopify-store-intel-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/shopify-store-intel-mcp-server) |
| **FDA Recalls, 510(k) & Clinical Trials** | openFDA recalls, 510(k) clearances, ClinicalTrials.gov v2 | [Apify Store](https://apify.com/mr.wolf/pharma-regulatory-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/pharma-regulatory-mcp-server) |
| **SEC EDGAR Filings & XBRL Financials** | 10-K, 10-Q, 8-K, Form 4 & US-GAAP XBRL metrics | [Apify Store](https://apify.com/mr.wolf/sec-edgar-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/sec-edgar-mcp-server) |
| **Tech & Startup Jobs (4 ATS APIs)** | Greenhouse, Lever, Ashby, SmartRecruiters + hiring signals | [Apify Store](https://apify.com/mr.wolf/ats-jobs-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/ats-jobs-mcp-server) |
| **B2B Domain Intel & Email Verifier** | DNS/MX/SPF/DMARC deliverability, tech stack & contacts | [Apify Store](https://apify.com/mr.wolf/domain-intel-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/domain-intel-mcp-server) |
| **EU Public Tenders & Grants (TED Europa)** | European procurement notices by CPV, country & budget | [Apify Store](https://apify.com/mr.wolf/eu-tenders-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/eu-tenders-mcp-server) |
| **SAM.gov US Federal Contracts** | Keyless US federal RFPs, NAICS & contracting officers | [Apify Store](https://apify.com/mr.wolf/us-sam-tenders-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/us-sam-tenders-mcp-server) |
