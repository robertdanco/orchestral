import { useState } from 'react';
import type { HierarchicalJiraItem, JiraItem } from '../types';
import './TreeView.css';

interface TreeViewProps {
  hierarchy: HierarchicalJiraItem[];
  onSelectIssue: (item: JiraItem) => void;
}

interface TreeNodeProps {
  item: HierarchicalJiraItem;
  level: number;
  onSelectIssue: (item: JiraItem) => void;
}

function TreeNode({ item, level, onSelectIssue }: TreeNodeProps): JSX.Element {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = item.children.length > 0;

  const doneCount = item.children.filter(c => c.statusCategory === 'done').length;
  const totalCount = item.children.length;

  return (
    <div className="tree-node" style={{ marginLeft: level * 20 }}>
      <div className="tree-node__row">
        {hasChildren && (
          <button
            className="tree-node__toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="tree-node__spacer" />}

        <span
          className={`tree-node__type tree-node__type--${item.type}`}
        >
          {item.type.charAt(0).toUpperCase()}
        </span>

        <button
          className="tree-node__key"
          onClick={() => onSelectIssue(item)}
        >
          {item.key}
        </button>

        <button
          className="tree-node__summary"
          onClick={() => setExpanded(!expanded)}
        >
          {item.summary}
        </button>

        <span className={`tree-node__status tree-node__status--${item.statusCategory}`}>
          {item.status}
        </span>

        {hasChildren && (
          <span className="tree-node__progress">
            {doneCount}/{totalCount}
          </span>
        )}

        {item.assignee && (
          <span className="tree-node__assignee">{item.assignee}</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="tree-node__children">
          {item.children.map(child => (
            <TreeNode
              key={child.key}
              item={child}
              level={level + 1}
              onSelectIssue={onSelectIssue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ hierarchy, onSelectIssue }: TreeViewProps): JSX.Element {
  if (hierarchy.length === 0) {
    return <div className="tree-empty">No items</div>;
  }

  return (
    <div className="tree-view">
      {hierarchy.map(item => (
        <TreeNode
          key={item.key}
          item={item}
          level={0}
          onSelectIssue={onSelectIssue}
        />
      ))}
    </div>
  );
}
