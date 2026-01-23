import fs from 'fs';
import path from 'path';
import type {
  ManualActionItem,
  CreateManualActionItemInput,
  UpdateManualActionItemInput,
} from '@orchestral/shared';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'manual-items.json');

function generateId(): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `manual-${Date.now()}-${random}`;
}

export class ManualItemsCache {
  private items: Map<string, ManualActionItem> = new Map();

  constructor() {
    this.ensureDataDir();
    this.load();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const items: ManualActionItem[] = JSON.parse(data);
        this.items = new Map(items.map((item) => [item.id, item]));
      }
    } catch (error) {
      console.error('Error loading manual items cache:', error);
      this.items = new Map();
    }
  }

  private save(): void {
    try {
      const items = Array.from(this.items.values());
      fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving manual items cache:', error);
    }
  }

  getAll(): ManualActionItem[] {
    return Array.from(this.items.values());
  }

  get(id: string): ManualActionItem | undefined {
    return this.items.get(id);
  }

  create(input: CreateManualActionItemInput): ManualActionItem {
    const id = generateId();
    const now = new Date().toISOString();

    const item: ManualActionItem = {
      id,
      source: 'manual',
      title: input.title,
      reason: input.reason,
      category: input.category,
      priority: input.priority,
      description: input.description,
      dueDate: input.dueDate,
      url: '', // Manual items don't have external URLs
      createdAt: now,
      completedAt: null,
    };

    this.items.set(id, item);
    this.save();
    return item;
  }

  update(id: string, input: UpdateManualActionItemInput): ManualActionItem | null {
    const existing = this.items.get(id);
    if (!existing) {
      return null;
    }

    const updated: ManualActionItem = {
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.reason !== undefined && { reason: input.reason }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    };

    this.items.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const existed = this.items.has(id);
    if (existed) {
      this.items.delete(id);
      this.save();
    }
    return existed;
  }

  markComplete(id: string): ManualActionItem | null {
    const existing = this.items.get(id);
    if (!existing) {
      return null;
    }

    const updated: ManualActionItem = {
      ...existing,
      completedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    this.save();
    return updated;
  }

  markIncomplete(id: string): ManualActionItem | null {
    const existing = this.items.get(id);
    if (!existing) {
      return null;
    }

    const updated: ManualActionItem = {
      ...existing,
      completedAt: null,
    };

    this.items.set(id, updated);
    this.save();
    return updated;
  }
}
