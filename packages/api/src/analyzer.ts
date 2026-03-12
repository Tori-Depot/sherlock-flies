import YAML from 'yaml';
import type { CompatibilityReport, RuleResult } from './types.js';
import { checkTriggers } from './rules/triggers.js';
import { checkJobs } from './rules/jobs.js';
import { checkSteps } from './rules/steps.js';
import { checkExpressions } from './rules/expressions.js';
import { checkActions } from './rules/actions.js';

function extractAffectedJobs(rules: RuleResult[]): string[] {
  const jobs = new Set<string>();
  for (const rule of rules) {
    for (const feature of rule.features) {
      if (feature.status === 'unsupported') {
        // Job-scoped features have format "jobName: featureName"
        const match = feature.name.match(/^([^:]+):/);
        if (match) {
          jobs.add(match[1]);
        }
      }
    }
  }
  return [...jobs];
}

function countJobs(workflow: Record<string, unknown>): number {
  const jobs = workflow.jobs;
  if (jobs && typeof jobs === 'object') {
    return Object.keys(jobs).length;
  }
  return 0;
}

export function analyzeWorkflow(yamlContent: string): CompatibilityReport {
  const workflow = YAML.parse(yamlContent) as Record<string, unknown>;

  if (!workflow || typeof workflow !== 'object') {
    throw new Error('Invalid workflow: expected a YAML object');
  }

  const rules: RuleResult[] = [
    checkTriggers(workflow),
    checkJobs(workflow),
    checkSteps(workflow),
    checkExpressions(workflow),
    checkActions(workflow),
  ];

  let supported = 0;
  let warnings = 0;
  let unsupported = 0;

  for (const rule of rules) {
    for (const feature of rule.features) {
      switch (feature.status) {
        case 'supported':
          supported++;
          break;
        case 'warning':
          warnings++;
          break;
        case 'unsupported':
          unsupported++;
          break;
      }
    }
  }

  const total = supported + warnings + unsupported;
  const score = total > 0 ? Math.round(((supported + warnings * 0.5) / total) * 100) : 100;

  const totalJobs = countJobs(workflow);
  const affectedJobs = extractAffectedJobs(rules);
  const unaffectedJobs = totalJobs - affectedJobs.length;

  let summary: string;
  if (unsupported === 0 && warnings === 0) {
    summary = 'Fully compatible with Depot CI! Ready to migrate.';
  } else if (unsupported === 0) {
    summary = 'Ready to migrate! Minor adjustments will be handled automatically.';
  } else if (affectedJobs.length > 0 && unaffectedJobs > 0) {
    const jobList = affectedJobs.map((j) => `\`${j}\``).join(', ');
    summary =
      `${unaffectedJobs} of ${totalJobs} jobs are fully compatible. ` +
      `${affectedJobs.length === 1 ? `The ${jobList} job needs` : `The ${jobList} jobs need`} adjustments — see workarounds below.`;
  } else if (affectedJobs.length > 0) {
    summary = `${unsupported} feature${unsupported > 1 ? 's' : ''} need workarounds — see suggestions below.`;
  } else {
    summary = `${unsupported} unsupported feature${unsupported > 1 ? 's' : ''} found. Review details below.`;
  }

  return { score, summary, supported, warnings, unsupported, total, totalJobs, affectedJobs, rules };
}
