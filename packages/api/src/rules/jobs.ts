import type { FeatureCheck, RuleResult } from '../types.js';

interface Job {
  'runs-on'?: string | string[];
  environment?: unknown;
  permissions?: Record<string, string>;
  strategy?: { matrix?: unknown };
  needs?: string | string[];
  concurrency?: unknown;
  snapshot?: unknown;
  [key: string]: unknown;
}

const DEPOT_LABELS = new Set([
  'ubuntu-latest',
  'ubuntu-22.04',
  'ubuntu-24.04',
  'depot-ubuntu-latest',
  'depot-ubuntu-22.04',
  'depot-ubuntu-24.04',
  'depot-ubuntu-latest-arm',
  'depot-ubuntu-22.04-arm',
  'depot-ubuntu-24.04-arm',
]);

function normalizeLabel(label: string): boolean {
  return DEPOT_LABELS.has(label);
}

export function checkJobs(workflow: Record<string, unknown>): RuleResult {
  const jobs = (workflow.jobs ?? {}) as Record<string, Job>;
  const features: FeatureCheck[] = [];

  for (const [jobName, job] of Object.entries(jobs)) {
    // runs-on
    const runsOn = job['runs-on'];
    if (runsOn) {
      const labels = Array.isArray(runsOn) ? runsOn : [String(runsOn)];
      for (const label of labels) {
        // Skip expression references like ${{ matrix.os }}
        if (label.includes('${{')) {
          features.push({
            name: `${jobName}: runs-on (${label})`,
            status: 'warning',
            notes: 'Dynamic label — will be mapped to depot-ubuntu-latest at runtime',
          });
        } else if (normalizeLabel(label)) {
          features.push({
            name: `${jobName}: runs-on (${label})`,
            status: 'supported',
            notes: 'Supported runner label',
          });
        } else {
          features.push({
            name: `${jobName}: runs-on (${label})`,
            status: 'warning',
            notes: `Non-standard label "${label}" — will be treated as depot-ubuntu-latest`,
          });
        }
      }
    }

    // environment
    if (job.environment !== undefined) {
      features.push({
        name: `${jobName}: environment`,
        status: 'unsupported',
        notes: 'Environments are not supported by Depot CI',
        workaround: 'Use Depot CI secrets and variables for environment-specific configuration',
      });
    }

    // OIDC
    if (job.permissions?.['id-token'] === 'write') {
      features.push({
        name: `${jobName}: permissions.id-token`,
        status: 'unsupported',
        notes: 'OIDC token (id-token: write) is not yet supported',
        workaround: 'Use static credentials stored as Depot CI secrets instead of OIDC federation',
      });
    }

    // snapshot
    if (job.snapshot !== undefined) {
      features.push({
        name: `${jobName}: snapshot`,
        status: 'unsupported',
        notes: 'Snapshots are not supported by Depot CI',
        workaround: 'Use caching strategies or artifact storage as an alternative',
      });
    }

    // matrix strategy (supported)
    if (job.strategy?.matrix) {
      features.push({
        name: `${jobName}: strategy.matrix`,
        status: 'supported',
        notes: 'Matrix strategies are fully supported',
      });
    }

    // job dependencies (supported)
    if (job.needs) {
      features.push({
        name: `${jobName}: needs`,
        status: 'supported',
        notes: 'Job dependencies are fully supported',
      });
    }

    // concurrency (supported)
    if (job.concurrency) {
      features.push({
        name: `${jobName}: concurrency`,
        status: 'supported',
        notes: 'Concurrency controls are supported',
      });
    }
  }

  return { category: 'Jobs', features };
}
