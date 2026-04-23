import { Routes, Route } from "react-router-dom";
import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login";
import { AuthCallbackPage } from "@/pages/auth-callback";
import { TermsPage } from "@/pages/terms";
import { PrivacyPage } from "@/pages/privacy";
import { DashboardPage } from "@/pages/dashboard";
import { LessonHomePage } from "@/pages/lesson-home";
import { LessonPage } from "@/pages/lesson";
import { CardsPage } from "@/pages/cards";
import { ReviewPage } from "@/pages/cards-review";
import { DeckCategoryPage } from "@/pages/cards-deck";
import { PlacementPage } from "@/pages/placement";
import { PlacementTestPage } from "@/pages/placement-test";
import { PlacementResultPage } from "@/pages/placement-result";
import { RewritePage } from "@/pages/rewrite";
import { RewriteHistoryPage } from "@/pages/rewrite-history";
import { RewriteDetailPage } from "@/pages/rewrite-detail";
import { LessonHistoryPage } from "@/pages/lesson-history";
import { GachaPage } from "@/pages/gacha";
import { SettingsPage } from "@/pages/settings";
import { NotFoundPage } from "@/pages/not-found";
import { PlacementGate } from "@/components/auth/placement-gate";
import { ProductLayout } from "@/components/layout/product-layout";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route element={<PlacementGate />}>
        <Route element={<ProductLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lesson" element={<LessonHomePage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/rewrite" element={<RewritePage />} />
          <Route path="/gacha" element={<GachaPage />} />
        </Route>
        {/* These pages have their own layouts (back buttons etc.) */}
        <Route path="/lesson/history" element={<LessonHistoryPage />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/cards/review" element={<ReviewPage />} />
        <Route path="/cards/deck/:category" element={<DeckCategoryPage />} />
        <Route path="/placement" element={<PlacementPage />} />
        <Route path="/placement/test" element={<PlacementTestPage />} />
        <Route path="/placement/result" element={<PlacementResultPage />} />
        <Route path="/rewrite/history" element={<RewriteHistoryPage />} />
        <Route path="/rewrite/history/:id" element={<RewriteDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
