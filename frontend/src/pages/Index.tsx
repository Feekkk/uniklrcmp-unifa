import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { IntroductionSection } from "@/components/IntroductionSection";
import { StudentContributionSection } from "@/components/StudentContributionSection";
import { EligibilitySection } from "@/components/EligibilitySection";
import { Footer } from "@/components/Footer";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ScrollToTop } from "@/components/ScrollToTop";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Header />
      <main>
        <div id="home">
          <HeroSection />
        </div>
        <AnimatedSection delay={0.2}>
          <IntroductionSection />
        </AnimatedSection>
        <AnimatedSection delay={0.4}>
          <StudentContributionSection />
        </AnimatedSection>
        <div id="eligibility">
          <AnimatedSection delay={0.6}>
            <EligibilitySection />
          </AnimatedSection>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
