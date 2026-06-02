import BentoGrid from "@/components/sections/bentogrid";
import Features from "@/components/sections/features";
import HeroLanding from "@/components/sections/hero-landing";
import PreviewLanding from "@/components/sections/preview-landing";
import Testimonials from "@/components/sections/testimonials";
import { WorkflowSection } from "@/components/sections/workflow-section";

export default function IndexPage() {
  return (
    <>
      <HeroLanding />
      <PreviewLanding />
      <WorkflowSection />
      <BentoGrid />
      <Features />
      <Testimonials />
    </>
  );
}
