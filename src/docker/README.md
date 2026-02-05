# n8n Chat UX - Docker Environments

Container configurations for running the n8n Chat UX stack.

**[← Back to Project Root](../../README.md)**

## Available Environments

| Environment | Purpose | Status |
|-------------|---------|--------|
| [local-n8n](local-n8n/README.md) | Local development with n8n | ✅ Available |

## Common Commands

```bash
# Start environment
docker-compose up -d

# Stop environment
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

## Adding New Environments

To add a new environment (e.g., production, staging):

1. Create directory: `src/docker/<environment-name>/`
2. Add `docker-compose.yml` with required services
3. Add `README.md` with environment-specific documentation
4. Update the table above
