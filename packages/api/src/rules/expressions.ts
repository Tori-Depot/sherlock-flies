import type { FeatureCheck, RuleResult } from '../types.js';

const SUPPORTED_CONTEXTS = new Set([
  'github',
  'env',
  'vars',
  'job',
  'jobs',
  'steps',
  'matrix',
  'needs',
  'inputs',
  'secrets',
  'strategy',
  'runner',
  'success()',
  'failure()',
  'always()',
  'cancelled()',
  'hashFiles(',
  'toJSON(',
  'fromJSON(',
  'format(',
  'join(',
  'contains(',
  'startsWith(',
  'endsWith(',
]);

const EXPRESSION_PATTERN = /\$\{\{(.*?)\}\}/g;

export function checkExpressions(workflow: Record<string, unknown>): RuleResult {
  const yamlStr = JSON.stringify(workflow);
  const features: FeatureCheck[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = EXPRESSION_PATTERN.exec(yamlStr)) !== null) {
    const expr = match[1].trim();
    if (seen.has(expr)) continue;
    seen.add(expr);

    const isSupported = [...SUPPORTED_CONTEXTS].some(
      (ctx) => expr.startsWith(ctx) || expr.includes(ctx),
    );

    features.push({
      name: `\${{ ${expr} }}`,
      status: isSupported ? 'supported' : 'warning',
      notes: isSupported
        ? 'Expression context is supported'
        : 'Check Depot CI docs for this expression context',
    });
  }

  if (features.length === 0) {
    features.push({
      name: 'Expressions',
      status: 'supported',
      notes: 'No expressions found in workflow',
    });
  }

  return { category: 'Expressions', features };
}
