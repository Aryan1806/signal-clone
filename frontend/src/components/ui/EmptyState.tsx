interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center select-none">
      {icon && (
        <div className="text-5xl opacity-30">{icon}</div>
      )}
      <div>
        <p className="text-lg font-medium" style={{ color: 'var(--signal-text-muted)' }}>{title}</p>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--signal-text-muted)' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
