import type { ReactNode } from 'react';

type EstimateLayoutProps = {
  readonly children: ReactNode;
};

export default function EstimateLayout({ children }: EstimateLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
