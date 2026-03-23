import { useState, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { useStore } from './store/useStore';

// Shared features
import { ScrollProgress } from './components/shared/ScrollProgress';
import { CommandPalette } from './components/shared/CommandPalette';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { BackToTop } from './components/shared/BackToTop';
import { FAQ } from './components/shared/FAQ';
import { AmbientPlayer } from './components/shared/AmbientPlayer';
import { RoyalEntrance } from './components/shared/RoyalEntrance';
import { HavenChat } from './components/shared/HavenChat';
import { SystemPulse } from './components/shared/SystemPulse'; // Import SystemPulse
import { SovereignTerminal } from './components/shared/SovereignTerminal';

// Landing sections
import { ParticleTrail } from './components/landing/Decorations';
import { SovereignStatusBar, Navbar } from './components/landing/Navbar';
import { Hero } from './components/landing/Hero';
import { SovereignCommand } from './components/landing/SovereignCommand';
import { Products } from './components/landing/Products';
import { AIEngine } from './components/landing/AIEngine';
import { DigitalCitizenship } from './components/landing/DigitalCitizenship';
import { TechStack } from './components/landing/TechStack';
import { Comparison } from './components/landing/Comparison';
import { BigTechTrap } from './components/landing/BigTechTrap';
import { IDEPortal } from './components/landing/IDEPortal';
import { Benchmarks } from './components/landing/Benchmarks';
import { Testimonials } from './components/landing/Testimonials';
import { Pricing } from './components/landing/Pricing';
import { Expose } from './components/landing/Expose';
import { Story } from './components/landing/Story';
import { Roadmap } from './components/landing/Roadmap';
import { Team, Footer } from './components/landing/TeamFooter';
import { FloatingWidgets } from './components/landing/FloatingWidgets';

export default function App() {
  const { isLoaded, setLoaded, royalComplete, setRoyalComplete } = useStore();
  const onLoadComplete = useCallback(() => setLoaded(), [setLoaded]);

  return (
    <>
      {/* Royal Entrance — plays once per browser, before everything */}
      <AnimatePresence>
        {!royalComplete && <RoyalEntrance onComplete={setRoyalComplete} />}
      </AnimatePresence>

      {/* Loading Screen — after royal entrance */}
      <AnimatePresence>
        {royalComplete && !isLoaded && <LoadingScreen onComplete={onLoadComplete} />}
      </AnimatePresence>

      {/* Main Content */}
      <div className="min-h-screen selection:bg-neon-green selection:text-black relative overflow-hidden">
        
        {/* Sovereign Overlay Effects */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] bg-[url('/noise.png')] mix-blend-overlay"></div>
        <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-black/0 via-black/0 to-neon-green/5"></div>

        {/* Global features */}
        <ScrollProgress />
        <CommandPalette />
        <BackToTop />
        <ParticleTrail />
        <FloatingWidgets />
        <AmbientPlayer />
        <HavenChat />
        
        {/* The Technical Marvel: System Pulse linking to D: */}
        <SystemPulse />
        <SovereignTerminal />

        {/* Layout */}
        <SovereignStatusBar />
        <Navbar />

        {/* Sections */}
        <main className="relative z-10">
            <Hero />
            <IDEPortal />
            <SovereignCommand />
            <Products />
            <TechStack />
            <AIEngine />
            <DigitalCitizenship />
            <Comparison />
            <BigTechTrap />
            <Benchmarks />
            <Testimonials />
            <Pricing />
            <Expose />
            <Story />
            <Roadmap />
            <Team />
            <FAQ />
        </main>
        
        <Footer />
      </div>
    </>
  );
}
