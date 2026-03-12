# Depot CI Workflow Compatibility Checker

A web app that analyzes GitHub Actions workflow YAML files and generates a Depot CI compatibility report.

## What it checks

- **Triggers** — supported vs unsupported event triggers
- **Jobs** — runner labels, environments, OIDC, matrix strategies
- **Steps** — action references, shell commands, conditionals
- **Expressions** — context variables and functions
- **Actions** — JS, composite, Docker, and reusable workflows

## Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Hono + `yaml` parser
- **Builds**: `depot bake` with multi-target, multi-platform builds
- **Registry**: Depot Registry

## Development

```bash
pnpm install
pnpm dev        # starts API (port 3001) + web (port 5173)
pnpm test       # runs API tests
pnpm lint       # type-check both packages
```

## Container builds

```bash
depot bake      # builds api + web images in parallel
```

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **lint** — type-check
2. **test** — vitest with Node 20 + 22 matrix
3. **build** — `depot bake` multi-platform images to Depot Registry

### Migrating to Depot CI

```bash
depot ci migrate
depot ci secrets add DEPOT_TOKEN
depot ci secrets add DEPOT_PROJECT
git add .depot/ && git commit -m "Add Depot CI workflows" && git push
```
