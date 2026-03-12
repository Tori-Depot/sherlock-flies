import type { FeatureCheck, RuleResult } from '../types.js';

interface Step {
  uses?: string;
  [key: string]: unknown;
}

interface Job {
  steps?: Step[];
  [key: string]: unknown;
}

// Well-known Docker container actions
const DOCKER_ACTIONS = new Set([
  'docker://',
]);

// Reusable workflow pattern: .github/workflows/*.yml@ref or org/repo/.github/workflows/*.yml@ref
const REUSABLE_WORKFLOW_PATTERN = /\.github\/workflows\/.*\.ya?ml@/;
const EXTERNAL_REUSABLE_PATTERN = /^[^./].*\.github\/workflows\/.*\.ya?ml@/;

export function checkActions(workflow: Record<string, unknown>): RuleResult {
  const jobs = (workflow.jobs ?? {}) as Record<string, Job>;
  const features: FeatureCheck[] = [];
  const seen = new Set<string>();

  for (const [jobName, job] of Object.entries(jobs)) {
    // Check for reusable workflow calls (job-level "uses")
    const jobUses = (job as Record<string, unknown>).uses as string | undefined;
    if (jobUses && !seen.has(jobUses)) {
      seen.add(jobUses);
      if (EXTERNAL_REUSABLE_PATTERN.test(jobUses)) {
        features.push({
          name: `${jobName}: reusable workflow (${jobUses})`,
          status: 'warning',
          notes: 'External reusable workflows may have limitations',
        });
      } else {
        features.push({
          name: `${jobName}: reusable workflow (${jobUses})`,
          status: 'supported',
          notes: 'Local reusable workflows are supported',
        });
      }
    }

    const steps = job.steps ?? [];
    for (const step of steps) {
      if (!step.uses || seen.has(step.uses)) continue;
      seen.add(step.uses);

      // Docker container actions
      if (step.uses.startsWith('docker://')) {
        features.push({
          name: `Docker action (${step.uses})`,
          status: 'supported',
          notes: 'Docker container actions are supported',
        });
        continue;
      }

      // Local actions
      if (step.uses.startsWith('./')) {
        features.push({
          name: `Local action (${step.uses})`,
          status: 'supported',
          notes: 'Local composite/JS actions are supported',
        });
        continue;
      }

      // Standard marketplace / GitHub actions
      features.push({
        name: `Action (${step.uses})`,
        status: 'supported',
        notes: 'JavaScript and composite actions are supported',
      });
    }
  }

  if (features.length === 0) {
    features.push({
      name: 'Actions',
      status: 'supported',
      notes: 'No action references found',
    });
  }

  return { category: 'Actions', features };
}
