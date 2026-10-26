import React, { useState, useEffect, useRef } from 'react';
import './TypedConfirmDialog.css';

interface TypedConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  requiredWord: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TypedConfirmDialog: React.FC<TypedConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  requiredWord,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTypedInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = typedInput.trim() === requiredWord;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatched) {
      onConfirm();
    }
  };

  return (
    <div className="typed-dialog-backdrop" onClick={onCancel} role="presentation">
      <div
        className="typed-dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="typed-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="typed-dialog-title" className="typed-dialog-title">
          {title}
        </h3>
        <p className="typed-dialog-desc">{description}</p>

        <form onSubmit={handleSubmit} className="typed-dialog-form">
          <label htmlFor="typed-confirmation-input" className="typed-input-label">
            Type <strong className="required-word">{requiredWord}</strong> to confirm:
          </label>
          <input
            id="typed-confirmation-input"
            ref={inputRef}
            type="text"
            className="typed-input-field"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder={requiredWord}
            autoComplete="off"
            spellCheck={false}
          />

          <div className="typed-dialog-actions">
            <button type="button" className="btn-typed-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-typed-confirm"
              disabled={!isMatched}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TypedConfirmDialog;
