# MCP Client Integrations

Connect any Streamable HTTP MCP client to:

```text
https://mr-wolf-1--global-kyb-entity-mcp-server.apify.actor/mcp
```

## Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "global-kyb-entity-mcp-server": {
      "url": "https://mr-wolf-1--global-kyb-entity-mcp-server.apify.actor/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_APIFY_TOKEN"
      }
    }
  }
}
```

## Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "global-kyb-entity-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mr-wolf-1--global-kyb-entity-mcp-server.apify.actor/mcp",
        "--header",
        "Authorization:Bearer YOUR_APIFY_TOKEN"
      ]
    }
  }
}
```
