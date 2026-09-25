import React, { useState } from 'react';
import Icon from '../components/icons';

/**
 * Labelled input for the signed-out forms: leading icon, optional Show/Hide toggle for passwords,
 * and an optional slot next to the label (used for "Forgot password?").
 */
export default function AuthField({ id, label, icon, type = 'text', labelSlot, hint, revealable = false, className = '', ...rest }) {
  const [visible, setVisible] = useState(false);
  const inputType = revealable ? (visible ? 'text' : 'password') : type;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
        {labelSlot}
      </div>
      <div className="relative">
        {icon && <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input id={id} type={inputType} className={`auth-input ${revealable ? 'pr-16' : ''} ${className}`} {...rest} />
        {revealable && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
