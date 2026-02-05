# Local n8n Development Environment

This Docker setup provides a local n8n instance for development with the General Chat UX frontend.

**[← Back to Docker Overview](../README.md)** | **[← Back to Project Root](../../../README.md)**

## Quick Start

```bash
# Navigate to this directory
cd src/docker/local-n8n

# Start n8n
docker-compose up -d

# View logs
docker-compose logs -f n8n

# Stop n8n
docker-compose down
```

## Access

- **n8n Editor**: [http://localhost:5678](http://localhost:5678)
- **Webhook Base URL**: `http://localhost:5678/webhook/`

## Data Persistence

All n8n data is persisted to the `./data` directory, including:
- Workflows
- Credentials
- Execution history
- Settings

This directory is gitignored to prevent committing sensitive data.

## Frontend Configuration

Update `src/frontend/public/config.json` with your n8n webhook URL:

```json
{
  "n8n": {
    "webhookUrl": "http://localhost:5678/webhook/your-workflow-id",
    "useProxy": false,
    "proxyUrl": ""
  }
}
```

## Important Notes

1. **First Run**: On first startup, you'll need to create an account in n8n.
2. **Credentials**: Store any API keys within n8n's credential system.
3. **Webhooks**: Create workflows with Webhook triggers to receive messages from the frontend.

## Workflow Management

### Export Workflows
```bash
# Export all workflows to a JSON file
docker exec -it local-n8n-n8n-1 n8n export:workflow --all --output=/home/node/.n8n/backup.json
```

### Import Workflows
```bash
# Import workflows from JSON file
docker exec -it local-n8n-n8n-1 n8n import:workflow --input=/home/node/.n8n/backup.json
```

Pre-built workflows are available in the `./workflows` directory.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Container won't start | Run `docker-compose logs n8n` to check for errors |
| Webhook not receiving | Verify frontend `webhookUrl` matches your workflow's webhook URL |
| Data lost after restart | Ensure `./data` directory exists and has proper permissions |
| Port 5678 in use | Change port mapping in `docker-compose.yml` |
