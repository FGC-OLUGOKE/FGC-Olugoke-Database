import Navbar from "./components/layout/Navbar";
import MembersPage from "./features/members/MembersPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar adminName="Pastor John Doe" adminRole="Church Admin" />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <MembersPage />
      </main>
    </div>
  );
}