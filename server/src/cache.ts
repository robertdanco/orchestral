import { JiraItem, JiraItemDetail } from './types.js';
import type { ICache } from './cache/types.js';

export class Cache implements ICache {
  private issues: JiraItem[] = [];
  private issueDetails: Map<string, JiraItemDetail> = new Map();
  private lastRefreshed: Date | null = null;

  getIssues(): JiraItem[] {
    return this.issues;
  }

  setIssues(issues: JiraItem[]): void {
    this.issues = issues;
    this.lastRefreshed = new Date();
  }

  getIssue(key: string): JiraItem | undefined {
    return this.issues.find(issue => issue.key === key);
  }

  getIssueDetail(key: string): JiraItemDetail | undefined {
    return this.issueDetails.get(key);
  }

  setIssueDetail(key: string, detail: JiraItemDetail): void {
    this.issueDetails.set(key, detail);
  }

  getLastRefreshed(): Date | null {
    return this.lastRefreshed;
  }

  clear(): void {
    this.issues = [];
    this.issueDetails.clear();
    this.lastRefreshed = null;
  }

  isEmpty(): boolean {
    return this.issues.length === 0 && this.issueDetails.size === 0;
  }
}
