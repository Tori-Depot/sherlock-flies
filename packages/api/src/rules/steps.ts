import type { FeatureCheck, RuleResult } from '../types.js';

interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, unknown>;
  if?: string;
  'continue-on-error'?: boolean;
  'timeout-minutes'?: number;
  [key: string]: unknown;
}

interface Job {
  steps?: Step[];
  [key: string]: unknown;
}

export function checkSteps(workflow: Record<string, unknown>): RuleResult {
  const jobs = (workflow.jobs ?? {}) as Record<string, Job>;
  const features: FeatureCheck[] = [];

  for (const [jobName, job] of Object.entries(jobs)) {
    const steps = job.steps ?? [];

    for (const step of steps) {
      const stepLabel = step.name ?? step.uses ?? step.run?.slice(0, 40) ?? 'unnamed step';

      // run commands — supported
      if (step.run) {
        features.push({
          name: `${jobName}: run (${stepLabel})`,
          status: 'supported',
          notes: 'Shell commands are fully supported',
        });
      }

      // uses actions — supported (with note about Docker actions)
      if (step.uses) {
        features.push({
          name: `${jobName}: uses (${step.uses})`,
          status: 'supported',
          notes: 'Action references are supported',
        });
      }

      // conditional steps
      if (step.if) {
        features.push({
          name: `${jobName}: if (${stepLabel})`,
          status: 'supported',
          notes: 'Conditional steps are supported',
        });
      }

      // continue-on-error
      if (step['continue-on-error'] !== undefined) {
        features.push({
          name: `${jobName}: continue-on-error (${stepLabel})`,
          status: 'supported',
          notes: 'continue-on-error is supported',
        });
      }

      // timeout-minutes
      if (step['timeout-minutes'] !== undefined) {
        features.push({
          name: `${jobName}: timeout-minutes (${stepLabel})`,
          status: 'supported',
          notes: 'Step timeouts are supported',
        });
      }
    }
  }

  return { category: 'Steps', features };
}
