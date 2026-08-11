import Navbar from "./components/layout/Navbar";
import PageContainer from "./components/layout/PageContainer";
import MembersPage from "./features/members/MembersPage";
import { ToastProvider } from "./components/ui/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar adminName="Pastor John Doe" adminRole="Church Admin" />

        <PageContainer>
          <MembersPage />
        </PageContainer>
      </div>
    </ToastProvider>
  );
}