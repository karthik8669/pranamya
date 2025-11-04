
import React, { useEffect, useRef } from 'react';
import { HeroSection, ProblemSolutionSection, FeaturesSection, HowItWorksSection, TechStackSection, UiUxSection, RoadmapSection } from './components/Sections';

const App: React.FC = () => {
  const sectionsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-fade-in');
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    sectionsRef.current.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) {
          observer.unobserve(section);
        }
      });
    };
  }, []);

  const addSectionRef = (el: HTMLElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };


  return (
    <div className="bg-slate-900 font-sans leading-relaxed text-slate-300">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="pt-24 pb-12">
          
          <section ref={addSectionRef} id="hero" className="min-h-screen flex items-center justify-center">
            <HeroSection />
          </section>

          <div className="space-y-24 md:space-y-32">
            <section ref={addSectionRef} id="problem-solution">
              <ProblemSolutionSection />
            </section>
            
            <section ref={addSectionRef} id="features">
              <FeaturesSection />
            </section>

            <section ref={addSectionRef} id="how-it-works">
              <HowItWorksSection />
            </section>

            <section ref={addSectionRef} id="tech-stack">
              <TechStackSection />
            </section>

            <section ref={addSectionRef} id="ui-ux">
              <UiUxSection />
            </section>

            <section ref={addSectionRef} id="roadmap">
              <RoadmapSection />
            </section>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950/50 py-8 mt-16">
      <div className="container mx-auto px-4 text-center text-slate-400">
        <p>&copy; {new Date().getFullYear()} StudyMate. A conceptual project presentation.</p>
        <p className="text-sm mt-2">Built with React, TypeScript, and Tailwind CSS.</p>
      </div>
    </footer>
  );
};


export default App;
