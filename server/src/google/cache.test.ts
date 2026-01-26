import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleDocsCache } from './cache.js';
import type { GoogleDoc } from '@orchestral/shared';

describe('GoogleDocsCache', () => {
  let cache: GoogleDocsCache;

  const mockDoc: GoogleDoc = {
    id: 'doc123',
    name: 'Meeting Notes 2024-01-15',
    webViewLink: 'https://docs.google.com/document/d/doc123',
    modifiedTime: new Date().toISOString(),
    content: 'This is the meeting content about API design',
    folderName: 'Team Meetings',
  };

  beforeEach(() => {
    cache = new GoogleDocsCache();
  });

  it('starts empty', () => {
    expect(cache.getDocuments()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
    expect(cache.isEmpty()).toBe(true);
  });

  it('stores and retrieves documents', () => {
    cache.setDocuments([mockDoc]);
    expect(cache.getDocuments()).toEqual([mockDoc]);
    expect(cache.isEmpty()).toBe(false);
  });

  it('gets document by id', () => {
    cache.setDocuments([mockDoc]);
    expect(cache.getDocument('doc123')).toEqual(mockDoc);
    expect(cache.getDocument('unknown')).toBeUndefined();
  });

  it('sets individual document', () => {
    cache.setDocument(mockDoc);
    expect(cache.getDocument('doc123')).toEqual(mockDoc);
  });

  it('gets document by name', () => {
    cache.setDocuments([mockDoc]);
    expect(cache.getDocumentByName('Meeting Notes 2024-01-15')).toEqual(mockDoc);
    expect(cache.getDocumentByName('Unknown Doc')).toBeUndefined();
  });

  it('searches cached documents by name', () => {
    cache.setDocuments([mockDoc]);
    const results = cache.searchCached('Meeting');
    expect(results).toHaveLength(1);
    expect(results[0].name).toContain('Meeting');
  });

  it('searches cached documents by content', () => {
    cache.setDocuments([mockDoc]);
    const results = cache.searchCached('API design');
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('API design');
  });

  it('searches cached documents by folder name', () => {
    cache.setDocuments([mockDoc]);
    const results = cache.searchCached('Team');
    expect(results).toHaveLength(1);
    expect(results[0].folderName).toContain('Team');
  });

  it('gets recent documents within time window', () => {
    const recentDoc: GoogleDoc = {
      ...mockDoc,
      modifiedTime: new Date().toISOString(),
    };
    const oldDoc: GoogleDoc = {
      ...mockDoc,
      id: 'doc999',
      name: 'Old Doc',
      modifiedTime: new Date('2020-01-01').toISOString(),
    };
    cache.setDocuments([recentDoc, oldDoc]);

    const recent = cache.getRecentDocuments(7);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe(recentDoc.id);
  });

  it('gets meeting notes by pattern', () => {
    const meetingDoc: GoogleDoc = {
      ...mockDoc,
      name: 'Meeting Notes 2024-01-15',
    };
    const regularDoc: GoogleDoc = {
      ...mockDoc,
      id: 'doc456',
      name: 'Design Spec',
    };
    cache.setDocuments([meetingDoc, regularDoc]);

    const notes = cache.getMeetingNotes('Meeting Notes.*');
    expect(notes).toHaveLength(1);
    expect(notes[0].name).toBe('Meeting Notes 2024-01-15');
  });

  it('tracks last refreshed time', () => {
    const before = Date.now();
    cache.setDocuments([mockDoc]);
    const after = Date.now();

    const refreshed = cache.getLastRefreshed();
    expect(refreshed).not.toBeNull();
    expect(refreshed!.getTime()).toBeGreaterThanOrEqual(before);
    expect(refreshed!.getTime()).toBeLessThanOrEqual(after);
  });

  it('clears cache', () => {
    cache.setDocuments([mockDoc]);
    cache.clear();

    expect(cache.getDocuments()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
    expect(cache.isEmpty()).toBe(true);
  });
});
