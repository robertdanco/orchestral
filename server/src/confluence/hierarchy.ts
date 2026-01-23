import type {
  ConfluenceSpace,
  ConfluencePage,
  HierarchicalConfluencePage,
  ConfluenceSpaceWithPages,
} from '@orchestral/shared';

export function buildPageHierarchy(pages: ConfluencePage[]): HierarchicalConfluencePage[] {
  if (pages.length === 0) return [];

  // Create a map for quick lookup
  const pageMap = new Map<string, HierarchicalConfluencePage>();

  // Initialize all pages with empty children arrays
  for (const page of pages) {
    pageMap.set(page.id, { ...page, children: [] });
  }

  const roots: HierarchicalConfluencePage[] = [];

  // Build the tree
  for (const page of pages) {
    const hierarchicalPage = pageMap.get(page.id)!;

    if (page.parentId && pageMap.has(page.parentId)) {
      // Add to parent's children
      const parent = pageMap.get(page.parentId)!;
      parent.children.push(hierarchicalPage);
    } else {
      // No parent or parent not found - add to roots
      roots.push(hierarchicalPage);
    }
  }

  // Sort children alphabetically by title
  const sortChildren = (node: HierarchicalConfluencePage): void => {
    node.children.sort((a, b) => a.title.localeCompare(b.title));
    node.children.forEach(sortChildren);
  };

  roots.sort((a, b) => a.title.localeCompare(b.title));
  roots.forEach(sortChildren);

  return roots;
}

export function buildSpaceHierarchy(
  spaces: ConfluenceSpace[],
  pages: ConfluencePage[]
): ConfluenceSpaceWithPages[] {
  // Group pages by space
  const pagesBySpace = new Map<string, ConfluencePage[]>();

  for (const page of pages) {
    const spacePages = pagesBySpace.get(page.spaceId) || [];
    spacePages.push(page);
    pagesBySpace.set(page.spaceId, spacePages);
  }

  // Build hierarchy for each space
  const result: ConfluenceSpaceWithPages[] = [];

  for (const space of spaces) {
    const spacePages = pagesBySpace.get(space.id) || [];
    const hierarchicalPages = buildPageHierarchy(spacePages);

    result.push({
      space,
      pages: hierarchicalPages,
    });
  }

  // Sort spaces alphabetically by name
  result.sort((a, b) => a.space.name.localeCompare(b.space.name));

  return result;
}
