import type { ConfluenceSpace, ConfluencePage, ConfluenceUser, ConfluenceComment } from '@orchestral/shared';

export interface ConfluenceClientConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKeys?: string[];
}

interface ConfluenceApiSpace {
  id: string;
  key: string;
  name: string;
  type: string;
  homepageId?: string;
  _links: {
    webui: string;
  };
}

interface ConfluenceApiPage {
  id: string;
  spaceId: string;
  parentId?: string;
  title: string;
  body?: {
    storage?: {
      value: string;
    };
    view?: {
      value: string;
    };
  };
  _links: {
    webui: string;
  };
  version?: {
    createdAt: string;
  };
}

interface ConfluenceSpacesResponse {
  results: ConfluenceApiSpace[];
  _links?: {
    next?: string;
  };
}

interface ConfluencePagesResponse {
  results: ConfluenceApiPage[];
  _links?: {
    next?: string;
  };
}

export class ConfluenceClient {
  private baseUrl: string;
  private email: string;
  private apiToken: string;
  private spaceKeys: string[];

  constructor(config: ConfluenceClientConfig) {
    if (!config.baseUrl) throw new Error('JIRA_URL is required for Confluence');
    if (!config.email) throw new Error('JIRA_EMAIL is required for Confluence');
    if (!config.apiToken) throw new Error('JIRA_API_TOKEN is required for Confluence');

    // Confluence uses the same Atlassian instance as Jira
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.spaceKeys = config.spaceKeys || [];
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  getSpaceKeys(): string[] {
    return this.spaceKeys;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async fetchSpaces(): Promise<ConfluenceSpace[]> {
    const spaces: ConfluenceSpace[] = [];
    let url = `${this.baseUrl}/wiki/api/v2/spaces?limit=100`;

    // Paginate through all spaces
    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Confluence API error: ${response.status}`);
      }

      const data = await response.json() as ConfluenceSpacesResponse;

      for (const space of data.results) {
        // Filter by space keys if configured
        if (this.spaceKeys.length > 0 && !this.spaceKeys.includes(space.key)) {
          continue;
        }
        spaces.push(this.mapSpace(space));
      }

      // Handle pagination
      url = data._links?.next ? `${this.baseUrl}${data._links.next}` : '';
    }

    return spaces;
  }

  async fetchPages(spaceId?: string): Promise<ConfluencePage[]> {
    const pages: ConfluencePage[] = [];
    let baseUrl = `${this.baseUrl}/wiki/api/v2/pages?limit=100&body-format=storage`;

    if (spaceId) {
      baseUrl += `&space-id=${spaceId}`;
    }

    let url = baseUrl;

    // Paginate through all pages
    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Confluence API error: ${response.status}`);
      }

      const data = await response.json() as ConfluencePagesResponse;

      for (const page of data.results) {
        pages.push(this.mapPage(page));
      }

      // Handle pagination
      url = data._links?.next ? `${this.baseUrl}${data._links.next}` : '';
    }

    return pages;
  }

  async fetchPage(pageId: string): Promise<ConfluencePage> {
    const url = `${this.baseUrl}/wiki/api/v2/pages/${pageId}?body-format=storage`;

    const response = await fetch(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.status}`);
    }

    const page = await response.json() as ConfluenceApiPage;
    return this.mapPage(page);
  }

  async searchPages(query: string, spaceKeys?: string[]): Promise<ConfluencePage[]> {
    // Use CQL (Confluence Query Language) for search
    let cql = `text ~ "${query}"`;

    const keysToSearch = spaceKeys?.length ? spaceKeys : this.spaceKeys;
    if (keysToSearch.length > 0) {
      cql += ` AND space in (${keysToSearch.map(k => `"${k}"`).join(',')})`;
    }

    const url = `${this.baseUrl}/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=50&expand=body.storage,version`;

    const response = await fetch(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.status}`);
    }

    interface SearchResult {
      results: Array<{
        id: string;
        title: string;
        body?: { storage?: { value: string } };
        version?: { when: string };
        _links: { webui: string };
        _expandable?: { space?: string };
      }>;
    }

    const data = await response.json() as SearchResult;

    return data.results.map(result => {
      // Extract space key from the expandable link
      const spaceMatch = result._expandable?.space?.match(/\/wiki\/rest\/api\/space\/([^/]+)/);
      const spaceKey = spaceMatch?.[1] || '';

      return {
        id: result.id,
        spaceId: '', // Not available in search results
        spaceKey,
        parentId: null, // Not available in search results
        title: result.title,
        body: this.extractPlainText(result.body?.storage?.value),
        url: `${this.baseUrl}/wiki${result._links.webui}`,
        updatedAt: result.version?.when || new Date().toISOString(),
      };
    });
  }

  private mapSpace(space: ConfluenceApiSpace): ConfluenceSpace {
    return {
      id: space.id,
      key: space.key,
      name: space.name,
      type: space.type === 'personal' ? 'personal' : 'global',
      homepageId: space.homepageId || null,
      url: `${this.baseUrl}/wiki${space._links.webui}`,
    };
  }

  private mapPage(page: ConfluenceApiPage): ConfluencePage {
    const bodyContent = page.body?.storage?.value || page.body?.view?.value;

    return {
      id: page.id,
      spaceId: page.spaceId,
      spaceKey: '', // Will be populated later if needed
      parentId: page.parentId || null,
      title: page.title,
      body: this.extractPlainText(bodyContent),
      url: `${this.baseUrl}/wiki${page._links.webui}`,
      updatedAt: page.version?.createdAt || new Date().toISOString(),
    };
  }

  private extractPlainText(html: string | undefined | null): string | null {
    if (!html) return null;

    // Remove HTML tags and extract plain text (first 500 chars as excerpt)
    const text = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    return text.slice(0, 500) + (text.length > 500 ? '...' : '');
  }

  async getCurrentUser(): Promise<ConfluenceUser> {
    const url = `${this.baseUrl}/wiki/rest/api/user/current`;

    const response = await fetch(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.status}`);
    }

    interface UserResponse {
      accountId: string;
      displayName: string;
      email?: string;
    }

    const data = await response.json() as UserResponse;

    return {
      accountId: data.accountId,
      displayName: data.displayName,
      email: data.email || this.email, // Fallback to configured email
    };
  }

  async fetchPageComments(pageId: string): Promise<ConfluenceComment[]> {
    const comments: ConfluenceComment[] = [];

    // Fetch both footer comments and inline comments
    const [footerComments, inlineComments] = await Promise.all([
      this.fetchCommentsOfType(pageId, 'footer'),
      this.fetchCommentsOfType(pageId, 'inline'),
    ]);

    comments.push(...footerComments, ...inlineComments);
    return comments;
  }

  private async fetchCommentsOfType(pageId: string, type: 'footer' | 'inline'): Promise<ConfluenceComment[]> {
    const comments: ConfluenceComment[] = [];
    const endpoint = type === 'footer' ? 'footer-comments' : 'inline-comments';
    let url: string | null = `${this.baseUrl}/wiki/api/v2/pages/${pageId}/${endpoint}?body-format=storage`;

    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        // Return empty array on error rather than throwing
        if (response.status === 404) return comments;
        throw new Error(`Confluence API error: ${response.status}`);
      }

      interface CommentResponse {
        results: Array<{
          id: string;
          pageId: string;
          body?: { storage?: { value: string } };
          version?: { authorId: string; createdAt: string };
          resolutionStatus?: { status: string };
          parentCommentId?: string;
        }>;
        _links?: { next?: string };
      }

      const data = await response.json() as CommentResponse;

      for (const comment of data.results) {
        // Extract @mentions from the body (format: <ac:link><ri:user ri:account-id="..."/></ac:link>)
        const body = comment.body?.storage?.value || '';
        const mentionMatches = body.match(/ri:account-id="([^"]+)"/g) || [];
        const mentions = mentionMatches.map(m => m.replace('ri:account-id="', '').replace('"', ''));

        comments.push({
          id: comment.id,
          pageId: comment.pageId || pageId,
          pageTitle: '', // Will be populated by caller
          spaceKey: '', // Will be populated by caller
          body: this.extractPlainText(body) || '',
          author: {
            accountId: comment.version?.authorId || '',
            displayName: '', // Will need separate lookup
            email: '',
          },
          createdAt: comment.version?.createdAt || new Date().toISOString(),
          resolved: comment.resolutionStatus?.status === 'resolved',
          parentCommentId: comment.parentCommentId || null,
          mentions,
        });
      }

      url = data._links?.next ? `${this.baseUrl}${data._links.next}` : null;
    }

    return comments;
  }

  async fetchRecentComments(sinceDays: number = 7): Promise<ConfluenceComment[]> {
    // Use CQL to search for recent comments
    const cql = `type=comment AND created >= now("-${sinceDays}d")`;
    let url: string | null = `${this.baseUrl}/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=100&expand=body.storage,version,space,ancestors`;

    const comments: ConfluenceComment[] = [];

    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Confluence API error: ${response.status}`);
      }

      interface SearchCommentResponse {
        results: Array<{
          id: string;
          body?: { storage?: { value: string } };
          version?: { by: { accountId: string; displayName: string; email?: string }; when: string };
          space?: { key: string };
          ancestors?: Array<{ id: string; title: string }>;
          extensions?: { resolution?: { status: string } };
        }>;
        _links?: { next?: string };
      }

      const data = await response.json() as SearchCommentResponse;

      for (const comment of data.results) {
        const body = comment.body?.storage?.value || '';
        const mentionMatches = body.match(/ri:account-id="([^"]+)"/g) || [];
        const mentions = mentionMatches.map(m => m.replace('ri:account-id="', '').replace('"', ''));

        // Get page info from ancestors (first ancestor is the page)
        const page = comment.ancestors?.[0];

        comments.push({
          id: comment.id,
          pageId: page?.id || '',
          pageTitle: page?.title || '',
          spaceKey: comment.space?.key || '',
          body: this.extractPlainText(body) || '',
          author: {
            accountId: comment.version?.by?.accountId || '',
            displayName: comment.version?.by?.displayName || '',
            email: comment.version?.by?.email || '',
          },
          createdAt: comment.version?.when || new Date().toISOString(),
          resolved: comment.extensions?.resolution?.status === 'resolved',
          parentCommentId: null, // Not available in search results
          mentions,
        });
      }

      url = data._links?.next ? `${this.baseUrl}${data._links.next}` : null;
    }

    return comments;
  }

  async fetchPagesAuthoredByUser(userId: string): Promise<string[]> {
    // Use CQL to find pages created by the user
    const cql = `creator = "${userId}" AND type = page`;
    let url: string | null = `${this.baseUrl}/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=100`;

    const pageIds: string[] = [];

    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Confluence API error: ${response.status}`);
      }

      interface PagesResponse {
        results: Array<{ id: string }>;
        _links?: { next?: string };
      }

      const data = await response.json() as PagesResponse;

      for (const page of data.results) {
        pageIds.push(page.id);
      }

      url = data._links?.next ? `${this.baseUrl}${data._links.next}` : null;
    }

    return pageIds;
  }
}
