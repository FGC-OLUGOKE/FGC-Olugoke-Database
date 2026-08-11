/**
 * PageContainer
 *
 * Consistent outer frame for every page (Members, and later
 * Attendance/Events/Reports/etc.): same max-width, same horizontal
 * padding, same vertical rhythm. Wrap each page's content in this
 * instead of repeating the padding/width classes per page, so pages
 * can't quietly drift out of alignment with each other.
 */
export default function PageContainer({ children }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      {children}
    </main>
  );
}