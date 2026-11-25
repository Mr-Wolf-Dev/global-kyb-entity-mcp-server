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
