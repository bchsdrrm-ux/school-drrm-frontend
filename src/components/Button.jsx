import React from 'react';

const VARIANTS = {
  primary: 'bg-brand-700 hover:bg-brand-800 text-white',
  secondary: 'bg-surface hover:bg-slate-50 text-slate-700 border border-slate-300',
  danger: 'bg-surface hover:bg-red-50 text-risk-critical border border-red-200',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
