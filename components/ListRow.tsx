export default function ListRow({
  title, subtitle, meta, trailing,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-4 py-3.5 gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{title}</p>
        {subtitle && <p className="text-sm text-[var(--muted)] mt-0.5">{subtitle}</p>}
        {meta && <p className="text-xs text-[var(--muted)] mt-1">{meta}</p>}
      </div>
      {trailing && <div className="flex items-center gap-3 shrink-0">{trailing}</div>}
    </div>
  );
}