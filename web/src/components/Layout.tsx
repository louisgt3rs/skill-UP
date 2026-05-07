import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  maxWidth?: number;
  padding?: string;
}

export default function Layout({ children, maxWidth = 920, padding = '32px 24px' }: Props) {
  return (
    <div style={{ maxWidth, margin: '0 auto', padding, minHeight: 'calc(100vh - 64px)' }}>
      {children}
    </div>
  );
}
