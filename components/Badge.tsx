export default function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'danger' }) {
  const styles = {
    neutral: 'bg-[var(--border)] text-[var(--foreground)]',
    success: 'bg-[var(--success-bg)] text-[var(--success)]',
    danger: 'bg-red-50 text-[var(--danger)]',
  }[tone];
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles}`}>{children}</span>;
}