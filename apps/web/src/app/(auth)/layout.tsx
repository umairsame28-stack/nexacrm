'use client';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Floating card login */}
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="text-2xl font-bold text-gunmetal dark:text-white">NexaCRM</span>
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-premium-2xl border border-border p-8">
          {children}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} NexaCRM. All rights reserved.
        </p>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 h-64 w-64 bg-primary rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 h-80 w-80 bg-primary rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-primary rounded-full opacity-5 blur-3xl"></div>
      </div>
    </div>
  );
}
