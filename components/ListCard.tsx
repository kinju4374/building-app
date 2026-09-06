export default function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
      {children}
    </div>
  );
}