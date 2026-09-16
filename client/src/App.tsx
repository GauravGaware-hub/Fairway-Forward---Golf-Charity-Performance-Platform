import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Layout Shells
import { PublicLayout } from "./components/layout/PublicLayout";
import { SubscriberLayout } from "./components/layout/SubscriberLayout";
import { AdminLayout } from "./components/layout/AdminLayout";

// Public Pages
import { HomePage } from "./features/public/pages/HomePage";
import { HowItWorksPage } from "./features/public/pages/HowItWorksPage";
import { CharityDirectoryPage } from "./features/public/pages/CharityDirectoryPage";
import { CharityDetailPage } from "./features/public/pages/CharityDetailPage";
import { LoginPage } from "./features/public/pages/LoginPage";
import { SignupPage } from "./features/public/pages/SignupPage";

// Subscriber Pages
import { SubscriberDashboardPage } from "./features/subscriber/pages/SubscriberDashboardPage";
import { ScoreManagementPage } from "./features/subscriber/pages/ScoreManagementPage";
import { CharitySelectPage } from "./features/subscriber/pages/CharitySelectPage";
import { ProfileSettingsPage } from "./features/subscriber/pages/ProfileSettingsPage";
import { SubscriptionPage } from "./features/subscription/pages/SubscriptionPage";
import { CheckoutSuccessPage } from "./features/subscription/pages/CheckoutSuccessPage";
import { DrawsPage } from "./features/draws/pages/DrawsPage";
import { WinningsPage } from "./features/payouts/pages/WinningsPage";

// Admin Pages
import { AdminDashboardPage } from "./features/admin/pages/AdminDashboardPage";
import { AdminDrawsPage } from "./features/admin/draws/pages/AdminDrawsPage";
import { AdminCharityManagementPage } from "./features/admin/pages/AdminCharityManagementPage";
import { AdminWinnersPage } from "./features/admin/winners/pages/AdminWinnersPage";
import { AdminReportsPage } from "./features/admin/pages/AdminReportsPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/charities" element={<CharityDirectoryPage />} />
            <Route path="/charities/:id" element={<CharityDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Subscriber Routes */}
          <Route element={<SubscriberLayout />}>
            <Route path="/dashboard" element={<SubscriberDashboardPage />} />
            <Route path="/scores" element={<ScoreManagementPage />} />
            <Route path="/charity-select" element={<CharitySelectPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/subscription/success" element={<CheckoutSuccessPage />} />
            <Route path="/draws" element={<DrawsPage />} />
            <Route path="/winnings" element={<WinningsPage />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/draws" element={<AdminDrawsPage />} />
            <Route path="/admin/charities" element={<AdminCharityManagementPage />} />
            <Route path="/admin/winners" element={<AdminWinnersPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
