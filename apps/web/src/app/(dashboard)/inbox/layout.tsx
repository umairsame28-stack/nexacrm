export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full-height, no inner padding — inbox manages its own layout
    <div className="-m-6 h-[calc(100vh-64px)] flex">{children}</div>
  );
}
