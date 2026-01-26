import { google, type drive_v3, type docs_v1 } from 'googleapis';
import type { GoogleDoc } from '@orchestral/shared';
import * as fs from 'fs';

export interface GoogleClientConfig {
  serviceAccountKeyPath?: string;
  serviceAccountKey?: object;
  folderIds?: string[];
}

export class GoogleClient {
  private drive: drive_v3.Drive;
  private docs: docs_v1.Docs;
  private folderIds: string[];

  constructor(config: GoogleClientConfig) {
    if (!config.serviceAccountKeyPath && !config.serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_KEY is required');
    }

    // Load service account credentials
    let credentials: object;
    if (config.serviceAccountKey) {
      credentials = config.serviceAccountKey;
    } else if (config.serviceAccountKeyPath) {
      const keyFile = fs.readFileSync(config.serviceAccountKeyPath, 'utf8');
      credentials = JSON.parse(keyFile);
    } else {
      throw new Error('No service account credentials provided');
    }

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/documents.readonly',
      ],
    });

    // Initialize API clients
    this.drive = google.drive({ version: 'v3', auth });
    this.docs = google.docs({ version: 'v1', auth });
    this.folderIds = config.folderIds || [];
  }

  getFolderIds(): string[] {
    return this.folderIds;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.drive.about.get({ fields: 'user' });
      return true;
    } catch {
      return false;
    }
  }

  async listDocuments(options: { folderId?: string } = {}): Promise<GoogleDoc[]> {
    const documents: GoogleDoc[] = [];
    let pageToken: string | undefined;

    // Build query
    const queryParts: string[] = [
      "mimeType='application/vnd.google-apps.document'",
      'trashed=false',
    ];

    if (options.folderId) {
      queryParts.push(`'${options.folderId}' in parents`);
    } else if (this.folderIds.length > 0) {
      // Query all configured folders
      const folderQueries = this.folderIds.map(id => `'${id}' in parents`);
      queryParts.push(`(${folderQueries.join(' or ')})`);
    }

    const query = queryParts.join(' and ');

    do {
      const response = await this.drive.files.list({
        q: query,
        fields: 'nextPageToken, files(id, name, webViewLink, modifiedTime, parents)',
        pageSize: 100,
        pageToken,
        orderBy: 'modifiedTime desc',
      });

      for (const file of response.data.files || []) {
        if (!file.id || !file.name) continue;

        // Get folder name if available
        let folderName: string | null = null;
        if (file.parents && file.parents.length > 0) {
          try {
            const folder = await this.drive.files.get({
              fileId: file.parents[0],
              fields: 'name',
            });
            folderName = folder.data.name || null;
          } catch {
            // Ignore folder lookup errors
          }
        }

        documents.push({
          id: file.id,
          name: file.name,
          webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}`,
          modifiedTime: file.modifiedTime || new Date().toISOString(),
          content: null, // Content loaded separately
          folderName,
        });
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return documents;
  }

  async searchDocuments(query: string): Promise<GoogleDoc[]> {
    const documents: GoogleDoc[] = [];

    // Build query - search in name and full text
    const queryParts: string[] = [
      "mimeType='application/vnd.google-apps.document'",
      'trashed=false',
      `(name contains '${query.replace(/'/g, "\\'")}' or fullText contains '${query.replace(/'/g, "\\'")}')`,
    ];

    // Limit to configured folders if set
    if (this.folderIds.length > 0) {
      const folderQueries = this.folderIds.map(id => `'${id}' in parents`);
      queryParts.push(`(${folderQueries.join(' or ')})`);
    }

    const driveQuery = queryParts.join(' and ');

    const response = await this.drive.files.list({
      q: driveQuery,
      fields: 'files(id, name, webViewLink, modifiedTime, parents)',
      pageSize: 50,
      orderBy: 'modifiedTime desc',
    });

    for (const file of response.data.files || []) {
      if (!file.id || !file.name) continue;

      // Get folder name if available
      let folderName: string | null = null;
      if (file.parents && file.parents.length > 0) {
        try {
          const folder = await this.drive.files.get({
            fileId: file.parents[0],
            fields: 'name',
          });
          folderName = folder.data.name || null;
        } catch {
          // Ignore folder lookup errors
        }
      }

      documents.push({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}`,
        modifiedTime: file.modifiedTime || new Date().toISOString(),
        content: null,
        folderName,
      });
    }

    return documents;
  }

  async getDocumentContent(docId: string): Promise<string> {
    const response = await this.docs.documents.get({
      documentId: docId,
    });

    // Extract text content from document
    const content = response.data.body?.content || [];
    const textParts: string[] = [];

    for (const element of content) {
      if (element.paragraph) {
        for (const paragraphElement of element.paragraph.elements || []) {
          if (paragraphElement.textRun?.content) {
            textParts.push(paragraphElement.textRun.content);
          }
        }
      } else if (element.table) {
        // Extract text from table cells
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            for (const cellContent of cell.content || []) {
              if (cellContent.paragraph) {
                for (const pe of cellContent.paragraph.elements || []) {
                  if (pe.textRun?.content) {
                    textParts.push(pe.textRun.content);
                  }
                }
              }
            }
          }
        }
      }
    }

    return textParts.join('');
  }

  async getDocumentWithContent(docId: string): Promise<GoogleDoc> {
    // Get file metadata
    const file = await this.drive.files.get({
      fileId: docId,
      fields: 'id, name, webViewLink, modifiedTime, parents',
    });

    if (!file.data.id || !file.data.name) {
      throw new Error(`Document not found: ${docId}`);
    }

    // Get folder name if available
    let folderName: string | null = null;
    if (file.data.parents && file.data.parents.length > 0) {
      try {
        const folder = await this.drive.files.get({
          fileId: file.data.parents[0],
          fields: 'name',
        });
        folderName = folder.data.name || null;
      } catch {
        // Ignore folder lookup errors
      }
    }

    // Get document content
    const content = await this.getDocumentContent(docId);

    return {
      id: file.data.id,
      name: file.data.name,
      webViewLink: file.data.webViewLink || `https://docs.google.com/document/d/${docId}`,
      modifiedTime: file.data.modifiedTime || new Date().toISOString(),
      content,
      folderName,
    };
  }
}
