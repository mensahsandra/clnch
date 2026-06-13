/**
 * Modal Header Component
 */

import React from 'react';

export interface ModalHeaderProps {
  pageTitle: string;
  fieldLabel?: string;
}

export function ModalHeader({ pageTitle, fieldLabel }: ModalHeaderProps): React.ReactElement {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-4 border-b border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎙️ CLNCH Coach</h1>
          <p className="text-indigo-100 text-sm mt-1">{pageTitle}</p>
          {fieldLabel && <p className="text-indigo-200 text-xs mt-1 font-semibold">{fieldLabel}</p>}
        </div>
      </div>
    </div>
  );
}
