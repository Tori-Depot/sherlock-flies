import type { RuleResult } from '../types.js';

const SUPPORTED_TRIGGERS = new Set([
  'push',
  'pull_request',
  'pull_request_target',
  'schedule',
  'workflow_call',
  'workflow_dispatch',
  'workflow_run',
]);

const UNSUPPORTED_TRIGGERS = new Set([
  'branch_protection_rule',
  'check_run',
  'check_suite',
  'create',
  'delete',
  'deployment',
  'deployment_status',
  'discussion',
  'discussion_comment',
  'fork',
  'gollum',
  'image_version',
  'issue_comment',
  'issues',
  'label',
  'merge_group',
  'milestone',
  'page_build',
  'public',
  'pull_request_comment',
  'pull_request_review',
  'pull_request_review_comment',
  'registry_package',
  'release',
  'repository_dispatch',
  'status',
  'watch',
]);

export function checkTriggers(workflow: Record<string, unknown>): RuleResult {
  const on = workflow.on;
  if (!on) {
    return {
      category: 'Triggers',
      features: [{ name: 'on (triggers)', status: 'unsupported', notes: 'No triggers defined' }],
    };
  }

  let triggerNames: string[];

  if (typeof on === 'string') {
    triggerNames = [on];
  } else if (Array.isArray(on)) {
    triggerNames = on as string[];
  } else if (typeof on === 'object') {
    triggerNames = Object.keys(on);
  } else {
    triggerNames = [];
  }

  return {
    category: 'Triggers',
    features: triggerNames.map((trigger) => {
      if (SUPPORTED_TRIGGERS.has(trigger)) {
        return { name: trigger, status: 'supported', notes: 'Fully supported by Depot CI' };
      }
      if (UNSUPPORTED_TRIGGERS.has(trigger)) {
        return { name: trigger, status: 'unsupported', notes: 'Not supported by Depot CI' };
      }
      return { name: trigger, status: 'warning', notes: 'Unknown trigger — check Depot CI docs' };
    }),
  };
}
