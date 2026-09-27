export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col scroll-smooth">
      {children}
    </div>
  );
}
