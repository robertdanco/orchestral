// Confluence shared types

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type: 'global' | 'personal';
  homepageId: string | null;
  url: string;
}

export interface ConfluencePage {
  id: string;
  spaceId: string;
  spaceKey: string;
  parentId: string | null;
  title: string;
  body: string | null; // Plain text excerpt
  url: string;
  updatedAt: string;
}

export interface HierarchicalConfluencePage extends ConfluencePage {
  children: HierarchicalConfluencePage[];
}

export interface ConfluenceSpaceWithPages {
  space: ConfluenceSpace;
  pages: HierarchicalConfluencePage[];
}

export interface ConfluenceHierarchyResponse {
  spaces: ConfluenceSpaceWithPages[];
  lastRefreshed: string | null;
}

export interface ConfluencePagesResponse {
  pages: ConfluencePage[];
  lastRefreshed: string | null;
}

export interface ConfluenceSpacesResponse {
  spaces: ConfluenceSpace[];
  lastRefreshed: string | null;
}

export interface ConfluenceSearchResult {
  pages: ConfluencePage[];
  total: number;
}
