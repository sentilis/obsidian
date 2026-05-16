export type DryRunSeverity =
	| 'error'
	| 'warning'
	| 'info';

export interface DryRunIssue {
	severity: DryRunSeverity;
	message: string;
}

export interface DryRunReport {
	target: string;
	kind: 'press' | 'market';
	summary: Array<{
		label: string;
		value: string;
	}>;
	issues: DryRunIssue[];
}
