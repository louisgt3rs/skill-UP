import { InputHTMLAttributes, useState, CSSProperties } from 'react';
import { theme } from '../theme';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapStyle?: CSSProperties;
}

export default function Input({ label, error, wrapStyle, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16, ...wrapStyle }}>
      {label && (
        <label style={{
          display: 'block',
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}>
          {label}
        </label>
      )}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          display: 'block',
          width: '100%',
          padding: '14px 16px',
          backgroundColor: theme.colors.surfaceHigh,
          border: `1.5px solid ${
            error ? theme.colors.error : focused ? theme.colors.primary : theme.colors.border
          }`,
          borderRadius: theme.radius.md,
          color: theme.colors.text,
          fontSize: 15,
          outline: 'none',
          transition: 'border-color 0.2s',
          ...style,
        }}
      />
      {error && (
        <p style={{ color: theme.colors.error, fontSize: 11, marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
