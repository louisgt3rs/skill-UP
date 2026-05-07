import { ButtonHTMLAttributes, CSSProperties } from 'react';
import { theme } from '../theme';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const BG: Record<string, string> = {
  primary: theme.colors.primary,
  outline: 'transparent',
  danger: theme.colors.error,
  ghost: 'transparent',
};

const COLOR: Record<string, string> = {
  primary: '#fff',
  outline: theme.colors.primary,
  danger: '#fff',
  ghost: theme.colors.textSecondary,
};

const SIZE: Record<string, CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: 13 },
  md: { padding: '12px 24px', fontSize: 15 },
  lg: { padding: '16px 32px', fontSize: 17 },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  disabled,
  children,
  style,
  ...props
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      {...props}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        border: variant === 'outline' ? `1.5px solid ${theme.colors.primary}` : 'none',
        borderRadius: theme.radius.md,
        backgroundColor: BG[variant] ?? theme.colors.primary,
        color: COLOR[variant] ?? '#fff',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        letterSpacing: 0.3,
        transition: 'opacity 0.15s, transform 0.1s',
        ...SIZE[size],
        ...style,
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}
