import React from 'react';

/**
 * Wraps a labeled input/select/textarea. Supports "as" for the element type.
 * Used for progressive-disclosure long forms (e.g. Hazard Inventory) —
 * group related FormFields under a <fieldset> with a heading in the page.
 */
export default function FormField({ label, as = 'input', children, className = '', ...props }) {
  const Component = as;
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {as === 'select' ? (
        <Component
          {...props}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
        >
          {children}
        </Component>
      ) : (
        <Component
          {...props}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
        />
      )}
    </label>
  );
}
