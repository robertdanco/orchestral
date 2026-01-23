import type { ConfluenceSpace, ConfluencePage } from '@orchestral/shared';

export class ConfluenceCache {
  private spaces: ConfluenceSpace[] = [];
  private pages: ConfluencePage[] = [];
  private pageDetails: Map<string, ConfluencePage> = new Map();
  private lastRefreshed: Date | null = null;

  getSpaces(): ConfluenceSpace[] {
    return this.spaces;
  }

  setSpaces(spaces: ConfluenceSpace[]): void {
    this.spaces = spaces;
    this.lastRefreshed = new Date();
  }

  getSpace(id: string): ConfluenceSpace | undefined {
    return this.spaces.find(space => space.id === id);
  }

  getSpaceByKey(key: string): ConfluenceSpace | undefined {
    return this.spaces.find(space => space.key === key);
  }

  getPages(): ConfluencePage[] {
    return this.pages;
  }

  setPages(pages: ConfluencePage[]): void {
    this.pages = pages;
    this.lastRefreshed = new Date();
  }

  getPage(id: string): ConfluencePage | undefined {
    return this.pageDetails.get(id) || this.pages.find(page => page.id === id);
  }

  setPageDetail(id: string, page: ConfluencePage): void {
    this.pageDetails.set(id, page);
  }

  getPagesBySpace(spaceId: string): ConfluencePage[] {
    return this.pages.filter(page => page.spaceId === spaceId);
  }

  getLastRefreshed(): Date | null {
    return this.lastRefreshed;
  }

  clear(): void {
    this.spaces = [];
    this.pages = [];
    this.pageDetails.clear();
    this.lastRefreshed = null;
  }

  isEmpty(): boolean {
    return this.spaces.length === 0 && this.pages.length === 0;
  }
}
