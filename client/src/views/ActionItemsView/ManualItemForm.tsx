import { useState, useEffect } from 'react';
import type { ManualActionItem, ManualActionCategory, CreateManualActionItemInput, UpdateManualActionItemInput } from '../../types';
import { MANUAL_CATEGORY_LABELS } from './utils';

interface ManualItemFormProps {
  item?: ManualActionItem | null;
  onSubmit: (input: CreateManualActionItemInput | UpdateManualActionItemInput) => Promise<void>;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

const CATEGORY_OPTIONS = (Object.keys(MANUAL_CATEGORY_LABELS) as ManualActionCategory[]).map(
  (category) => ({
    value: category,
    label: MANUAL_CATEGORY_LABELS[category].replace(/s$/, ''), // Remove plural 's'
  })
);

export function ManualItemForm({ item, onSubmit, onCancel }: ManualItemFormProps): JSX.Element {
  const [title, setTitle] = useState(item?.title || '');
  const [reason, setReason] = useState(item?.reason || '');
  const [category, setCategory] = useState<ManualActionCategory>(item?.category || 'task');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(item?.priority || 'medium');
  const [description, setDescription] = useState(item?.description || '');
  const [dueDate, setDueDate] = useState(item?.dueDate?.split('T')[0] || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setReason(item.reason);
      setCategory(item.category);
      setPriority(item.priority);
      setDescription(item.description || '');
      setDueDate(item.dueDate?.split('T')[0] || '');
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateManualActionItemInput = {
        title: title.trim(),
        reason: reason.trim(),
        category,
        priority,
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };

      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="manual-item-form-overlay">
      <div className="manual-item-form">
        <div className="manual-item-form__header">
          <h2 className="manual-item-form__title">
            {isEditing ? 'Edit Item' : 'New Manual Item'}
          </h2>
          <button
            className="manual-item-form__close"
            onClick={onCancel}
            type="button"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="manual-item-form__error">{error}</div>
          )}

          <div className="manual-item-form__field">
            <label className="manual-item-form__label" htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              type="text"
              className="manual-item-form__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="manual-item-form__field">
            <label className="manual-item-form__label" htmlFor="reason">
              Reason *
            </label>
            <input
              id="reason"
              type="text"
              className="manual-item-form__input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this important?"
            />
          </div>

          <div className="manual-item-form__row">
            <div className="manual-item-form__field manual-item-form__field--half">
              <label className="manual-item-form__label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="manual-item-form__select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ManualActionCategory)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="manual-item-form__field manual-item-form__field--half">
              <label className="manual-item-form__label" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                className="manual-item-form__select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="manual-item-form__field">
            <label className="manual-item-form__label" htmlFor="description">
              Description (optional)
            </label>
            <textarea
              id="description"
              className="manual-item-form__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="manual-item-form__field">
            <label className="manual-item-form__label" htmlFor="dueDate">
              Due Date (optional)
            </label>
            <input
              id="dueDate"
              type="date"
              className="manual-item-form__input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="manual-item-form__actions">
            <button
              type="button"
              className="manual-item-form__btn manual-item-form__btn--cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="manual-item-form__btn manual-item-form__btn--submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
