"use client";

import React, { useEffect } from "react";
import { I18nProvider } from "@/lib/alash/i18n";
import { useHashRoute } from "@/lib/alash/router";
import { BookingProvider } from "./BookingDialog";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HomePage } from "./pages/HomePage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { DoctorPage } from "./pages/DoctorPage";
import { SpecializationsPage } from "./pages/SpecializationsPage";
import { SpecialtyPage } from "./pages/SpecialtyPage";
import { AboutPage } from "./pages/AboutPage";
import { BranchesPage } from "./pages/BranchesPage";
import { BranchPage } from "./pages/BranchPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { FaqPage } from "./pages/FaqPage";
import { PrivacyPage } from "./pages/PrivacyPage";

function Router() {
  const route = useHashRoute();

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.full]);

  let page: React.ReactNode;
  switch (route.page) {
    case "":
      page = <HomePage />;
      break;
    case "doctors":
      page = route.param ? <DoctorPage id={route.param} /> : <DoctorsPage key={route.full} />;
      break;
    case "specializations":
      page = route.param ? <SpecialtyPage slug={route.param} /> : <SpecializationsPage />;
      break;
    case "about":
      page = <AboutPage />;
      break;
    case "branches":
      page = route.param ? <BranchPage id={route.param} /> : <BranchesPage />;
      break;
    case "reviews":
      page = <ReviewsPage />;
      break;
    case "faq":
      page = <FaqPage />;
      break;
    case "privacy":
      page = <PrivacyPage />;
      break;
    default:
      page = <HomePage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header key={route.full} />
      <main className="flex-1" id="main">
        {page}
      </main>
      <Footer />
    </div>
  );
}

export default function AlashApp() {
  return (
    <I18nProvider>
      <BookingProvider>
        <Router />
      </BookingProvider>
    </I18nProvider>
  );
}
