import type { GoogleDoc } from '@orchestral/shared';

export class GoogleDocsCache {
  private documents: Map<string, GoogleDoc> = new Map();
  private lastRefreshed: Date | null = null;

  getDocuments(): GoogleDoc[] {
    return Array.from(this.documents.values());
  }

  setDocuments(docs: GoogleDoc[]): void {
    this.documents.clear();
    docs.forEach(doc => this.documents.set(doc.id, doc));
    this.lastRefreshed = new Date();
  }

  getDocument(id: string): GoogleDoc | undefined {
    return this.documents.get(id);
  }

  setDocument(doc: GoogleDoc): void {
    this.documents.set(doc.id, doc);
    this.lastRefreshed = new Date();
  }

  getDocumentByName(name: string): GoogleDoc | undefined {
    return Array.from(this.documents.values()).find(d => d.name === name);
  }

  searchCached(query: string): GoogleDoc[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc => {
      // Search in name
      if (doc.name.toLowerCase().includes(queryLower)) return true;
      // Search in content if available
      if (doc.content?.toLowerCase().includes(queryLower)) return true;
      // Search in folder name if available
      if (doc.folderName?.toLowerCase().includes(queryLower)) return true;
      return false;
    });
  }

  getRecentDocuments(sinceDays: number = 7): GoogleDoc[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - sinceDays);
    const cutoffTime = cutoff.getTime();

    return Array.from(this.documents.values())
      .filter(doc => new Date(doc.modifiedTime).getTime() >= cutoffTime)
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
  }

  getMeetingNotes(pattern: string): GoogleDoc[] {
    const regex = new RegExp(pattern, 'i');
    return Array.from(this.documents.values())
      .filter(doc => regex.test(doc.name))
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
  }

  getLastRefreshed(): Date | null {
    return this.lastRefreshed;
  }

  clear(): void {
    this.documents.clear();
    this.lastRefreshed = null;
  }

  isEmpty(): boolean {
    return this.documents.size === 0;
  }
}
