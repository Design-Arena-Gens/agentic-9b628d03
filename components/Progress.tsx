"use client";
import React from 'react';

export type Step = {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'done' | 'error';
  detail?: string;
};

export function Progress({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((s) => (
        <li key={s.id} className="flex items-start gap-3">
          <span className={
            s.status === 'done' ? 'text-green-600' : s.status === 'error' ? 'text-red-600' : 'text-blue-600'
          }>
            {s.status === 'done' ? '?' : s.status === 'error' ? '!' : '?'}
          </span>
          <div>
            <div className="font-medium">{s.label}</div>
            {s.detail && <div className="text-sm text-gray-600">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
