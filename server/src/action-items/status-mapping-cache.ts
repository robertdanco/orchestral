import fs from 'fs';
import path from 'path';
import type { StatusMappingConfig, UpdateStatusMappingInput } from '@orchestral/shared';
import { DEFAULT_STATUS_MAPPINGS } from '@orchestral/shared';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'status-mappings.json');

export class StatusMappingCache {
  private mappings: StatusMappingConfig;

  constructor() {
    this.mappings = { ...DEFAULT_STATUS_MAPPINGS };
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
        const loaded: Partial<StatusMappingConfig> = JSON.parse(data);
        this.mappings = this.mergeWithDefaults(loaded);
      }
    } catch (error) {
      console.error('Error loading status mappings cache:', error);
      this.mappings = { ...DEFAULT_STATUS_MAPPINGS };
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.mappings, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving status mappings cache:', error);
    }
  }

  private mergeWithDefaults(partial: Partial<StatusMappingConfig>): StatusMappingConfig {
    return {
      statusToDisplay: {
        ...DEFAULT_STATUS_MAPPINGS.statusToDisplay,
        ...partial.statusToDisplay,
      },
      categoryDefaults: {
        ...DEFAULT_STATUS_MAPPINGS.categoryDefaults,
        ...partial.categoryDefaults,
      },
    };
  }

  get(): StatusMappingConfig {
    return {
      statusToDisplay: { ...this.mappings.statusToDisplay },
      categoryDefaults: { ...this.mappings.categoryDefaults },
    };
  }

  update(input: UpdateStatusMappingInput): StatusMappingConfig {
    this.mappings = {
      statusToDisplay: {
        ...this.mappings.statusToDisplay,
        ...input.statusToDisplay,
      },
      categoryDefaults: {
        ...this.mappings.categoryDefaults,
        ...input.categoryDefaults,
      },
    };

    this.save();
    return this.get();
  }

  reset(): StatusMappingConfig {
    this.mappings = { ...DEFAULT_STATUS_MAPPINGS };
    this.save();
    return this.get();
  }
}
