'use client';

import React, { useRef } from 'react';
import { useFocusTrap, useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // 1. Trap focus inside modal
  useFocusTrap(modalRef, isOpen);

  // 2. Close on Escape press
  useKeyboardNavigation([
    {
      key: 'Escape',
      callback: () => {
        if (isOpen) onClose();
      },
    },
  ]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-desc" : undefined}
        className="w-full max-w-lg p-6 bg-background rounded-large border-2 border-foreground shadow-xl flex flex-col gap-4 focus:outline-none"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card body
      >
        <header className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 id="modal-title" className="text-2xl font-extrabold font-hyperlegible leading-none">
              {title}
            </h2>
            {description && (
              <p id="modal-desc" className="text-sm text-muted font-hyperlegible">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted hover:text-foreground rounded-small min-h-[48px] min-w-[48px] cursor-pointer border-none bg-transparent font-bold focus:outline-none"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </header>

        <section className="flex-1 font-hyperlegible">
          {children}
        </section>
      </div>
    </div>
  );
}
export default Modal;
