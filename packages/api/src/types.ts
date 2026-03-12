export type FeatureStatus = 'supported' | 'warning' | 'unsupported';

export interface FeatureCheck {
  name: string;
  status: FeatureStatus;
  notes: string;
  workaround?: string;
}

export interface RuleResult {
  category: string;
  features: FeatureCheck[];
}

export interface CompatibilityReport {
  score: number;
  summary: string;
  supported: number;
  warnings: number;
  unsupported: number;
  total: number;
  totalJobs: number;
  affectedJobs: string[];
  rules: RuleResult[];
}
