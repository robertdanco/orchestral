import { JiraItem, HierarchicalJiraItem } from './types.js';

export function buildHierarchy(items: JiraItem[]): HierarchicalJiraItem[] {
  if (items.length === 0) return [];

  // Create a map for quick lookup
  const itemMap = new Map<string, HierarchicalJiraItem>();

  // Initialize all items with empty children arrays
  for (const item of items) {
    itemMap.set(item.key, { ...item, children: [] });
  }

  const roots: HierarchicalJiraItem[] = [];

  // Build the tree
  for (const item of items) {
    const hierarchicalItem = itemMap.get(item.key)!;

    if (item.parentKey && itemMap.has(item.parentKey)) {
      // Add to parent's children
      const parent = itemMap.get(item.parentKey)!;
      parent.children.push(hierarchicalItem);
    } else {
      // No parent or parent not found - add to roots
      roots.push(hierarchicalItem);
    }
  }

  // Sort children by key for consistent ordering
  const sortChildren = (node: HierarchicalJiraItem): void => {
    node.children.sort((a, b) => a.key.localeCompare(b.key));
    node.children.forEach(sortChildren);
  };

  roots.sort((a, b) => a.key.localeCompare(b.key));
  roots.forEach(sortChildren);

  return roots;
}
