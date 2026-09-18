'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, BarChart3, Users, MessageSquare, TrendingUp, Zap, Shield, Clock, Star } from 'lucide-react';
import { CRMMotionBackground } from '@/components/landing/crm-motion-background';
import { CinematicNavigation } from '@/components/landing/cinematic-navigation';
import { CinematicHero } from '@/components/landing/cinematic-hero';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { CountUp } from '@/components/landing/count-up';
import { ProductExperience } from '@/components/demo/product-experience';

export default function PremiumLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CRMMotionBackground />
      <CinematicNavigation />

      {/* Cinematic Hero */}
      <CinematicHero onDemoClick={() => setDemoOpen(true)} />

      {/* Core Features Section - Streamlined */}
      <section className="relative py-24 px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#0F172A]/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything you need to grow
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Manage leads, close deals, and nurture relationships with intelligent tools designed for modern sales teams.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Lead Management',
                description: 'Capture and nurture leads with smart automation and intelligent scoring.',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: 'Sales Pipeline',
                description: 'Visual pipeline tracking from first contact to closed deal with drag-and-drop.',
                color: 'from-green-500 to-green-600'
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: 'WhatsApp Integration',
                description: 'Connect with customers on their favorite platform seamlessly.',
                color: 'from-purple-500 to-purple-600'
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: 'Analytics & Reports',
                description: 'Real-time insights and detailed reports to optimize performance.',
                color: 'from-orange-500 to-orange-600'
              },
            ].map((feature, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 100}>
                <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-primary/20 overflow-hidden hover:scale-105 duration-300">
                  {/* Gradient glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Trusted by teams that value growth
            </h2>
            <p className="text-lg text-slate-300">
              Join businesses using NexaCRM to scale their sales operations.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: 10000, suffix: '+', label: 'Active Users', color: 'from-blue-500 to-blue-600' },
              { value: 250000, suffix: '+', label: 'Leads Managed', color: 'from-green-500 to-green-600' },
              { value: 99.9, suffix: '%', label: 'System Uptime', color: 'from-purple-500 to-purple-600' },
              { value: 40, suffix: '%', label: 'Avg Growth Rate', color: 'from-orange-500 to-orange-600' },
            ].map((stat, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 100}>
                <div className="group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/50 transition-all text-center cursor-pointer overflow-hidden hover:scale-105 duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                      <CountUp end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Simplified */}
      <section className="relative py-24 px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#0F172A]/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Loved by teams everywhere
            </h2>
            <p className="text-lg text-slate-300">
              See what our customers say about their experience.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "NexaCRM transformed our sales process. Response times dropped 60% and we're closing deals faster than ever.",
                author: "Sarah Chen",
                role: "Head of Sales",
                company: "TechCorp",
                avatar: "SC"
              },
              {
                quote: "The WhatsApp integration is game-changing. All customer conversations in one place, seamlessly managed.",
                author: "Mike Ross",
                role: "Sales Director",
                company: "GrowthLabs",
                avatar: "MR"
              },
              {
                quote: "Clean interface, powerful features, responsive support. The best CRM we've ever used.",
                author: "Emma Wilson",
                role: "CEO",
                company: "DataFlow",
                avatar: "EW"
              }
            ].map((testimonial, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 100}>
                <div className="group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-primary/10 overflow-hidden hover:scale-105 duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-slate-300 leading-relaxed">
                      "{testimonial.quote}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{testimonial.author}</div>
                        <div className="text-sm text-slate-400">{testimonial.role}, {testimonial.company}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="scale">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-gradient" />
              
              {/* Floating shapes */}
              <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float" />
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-delayed" />
              
              {/* Content */}
              <div className="relative px-8 py-16 lg:p-16 text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl lg:text-5xl font-bold text-white">
                    Ready to grow your business?
                  </h2>
                  <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
                    Join thousands of teams using NexaCRM to manage customer relationships and close more deals.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-primary bg-white hover:bg-slate-50 rounded-xl shadow-xl hover:shadow-2xl transition-all overflow-hidden hover:scale-[1.02]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 backdrop-blur-sm transition-all hover:scale-[1.02]"
                  >
                    Sign In
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-indigo-100">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span>Enterprise-grade security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span>Setup in minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Product Experience Modal */}
      <ProductExperience isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
