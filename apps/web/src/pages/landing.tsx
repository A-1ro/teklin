import { AuthRedirect } from "@/components/landing/auth-redirect";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { NavBar } from "@/components/landing/nav-bar";
import { Personas } from "@/components/landing/personas";
import { Pricing } from "@/components/landing/pricing";
import { WhyTeklin } from "@/components/landing/why-teklin";

export function LandingPage() {
  return (
    <>
      <NavBar />
      <main id="main">
        <Hero />
        <Features />
        <WhyTeklin />
        <Personas />
        <Pricing />
      </main>
      <Footer />
      <AuthRedirect />
    </>
  );
}
