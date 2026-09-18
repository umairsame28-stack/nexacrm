'use client';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated mesh gradient */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-mesh animate-mesh"></div>
      </div>
      
      {/* Subtle gradient orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#4F46E5]/5 to-transparent rounded-full blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#6366F1]/8 to-transparent rounded-full blur-3xl animate-float-slower"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#EEF2FF]/10 to-transparent rounded-full blur-3xl animate-pulse-very-slow"></div>
      
      {/* Ultra-light grid */}
      <div className="absolute inset-0 bg-grid-subtle opacity-[0.02]"></div>
    </div>
  );
}
