import { describe, it, expect } from 'vitest';
import { analyzeWorkflow } from '../src/analyzer.js';

const SIMPLE_WORKFLOW = `
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`;

const COMPLEX_WORKFLOW = `
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    needs: [lint]
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4
      - uses: depot/setup-action@v1
      - uses: depot/bake-action@v1
        with:
          token: \${{ secrets.DEPOT_TOKEN }}
          project: \${{ secrets.DEPOT_PROJECT }}
          files: docker-bake.hcl
          save: true
`;

const UNSUPPORTED_WORKFLOW = `
name: Release
on:
  release:
    types: [published]
  issue_comment:
    types: [created]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - run: echo "deploying"
`;

describe('analyzeWorkflow', () => {
  it('should analyze a simple compatible workflow', () => {
    const report = analyzeWorkflow(SIMPLE_WORKFLOW);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.unsupported).toBe(0);
    expect(report.rules).toHaveLength(5);
  });

  it('should analyze a complex workflow with all supported features', () => {
    const report = analyzeWorkflow(COMPLEX_WORKFLOW);
    expect(report.unsupported).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(80);

    const triggerRule = report.rules.find((r) => r.category === 'Triggers');
    expect(triggerRule?.features).toHaveLength(3);
    expect(triggerRule?.features.every((f) => f.status === 'supported')).toBe(true);

    const jobRule = report.rules.find((r) => r.category === 'Jobs');
    expect(jobRule?.features.some((f) => f.name.includes('matrix'))).toBe(true);
    expect(jobRule?.features.some((f) => f.name.includes('needs'))).toBe(true);
  });

  it('should detect unsupported triggers and features', () => {
    const report = analyzeWorkflow(UNSUPPORTED_WORKFLOW);
    expect(report.unsupported).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(100);

    const triggerRule = report.rules.find((r) => r.category === 'Triggers');
    const releaseTrigger = triggerRule?.features.find((f) => f.name === 'release');
    expect(releaseTrigger?.status).toBe('unsupported');

    const jobRule = report.rules.find((r) => r.category === 'Jobs');
    const envFeature = jobRule?.features.find((f) => f.name.includes('environment'));
    expect(envFeature?.status).toBe('unsupported');
    expect(envFeature?.workaround).toBeTruthy();

    const oidcFeature = jobRule?.features.find((f) => f.name.includes('id-token'));
    expect(oidcFeature?.status).toBe('unsupported');
    expect(oidcFeature?.workaround).toBeTruthy();
  });

  it('should identify affected jobs and provide job-aware summary', () => {
    const report = analyzeWorkflow(UNSUPPORTED_WORKFLOW);
    expect(report.totalJobs).toBe(1);
    expect(report.affectedJobs).toContain('deploy');
  });

  it('should throw on invalid YAML', () => {
    expect(() => analyzeWorkflow('not: [valid: yaml: {')).toThrow();
  });

  it('should throw on non-object YAML', () => {
    expect(() => analyzeWorkflow('just a string')).toThrow('Invalid workflow');
  });
});
