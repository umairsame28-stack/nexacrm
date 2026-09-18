'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, BookOpen, FileText, ChevronRight, Users, Briefcase, MessageSquare, CheckSquare, BarChart2, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { docSections, searchDocumentation, type DocArticle } from '@/data/documentation-content';

const iconMap: Record<string, typeof BookOpen> = {
  BookOpen,
  Users,
  Briefcase,
  MessageSquare,
  CheckSquare,
  BarChart2,
  Settings,
};

export default function DocumentationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Search articles
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim() && !selectedSection) {
      return docSections.flatMap((section) => section.articles);
    }

    let results = searchQuery.trim() ? searchDocumentation(searchQuery) : docSections.flatMap((s) => s.articles);

    if (selectedSection) {
      results = results.filter((article) => article.section === selectedSection);
    }

    return results;
  }, [searchQuery, selectedSection]);

  const currentSection = selectedSection ? docSections.find((s) => s.id === selectedSection) : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <FileText className="h-3 w-3" />
          DOCUMENTATION
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Learn how NexaCRM works.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore product guides, workflows, and reference material.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-base border-2 focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-3 text-sm text-muted-foreground">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
          </p>
        )}
      </div>

      {/* Section Navigation */}
      {!searchQuery && (
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedSection(null)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                !selectedSection
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              All Sections
            </button>
            {docSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation - Desktop */}
        {!searchQuery && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Sections
                </h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedSection(null)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      !selectedSection
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    All Sections
                  </button>
                  {docSections.map((section) => {
                    const Icon = iconMap[section.icon] || FileText;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section.id)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                          selectedSection === section.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className={cn(searchQuery ? 'lg:col-span-4' : 'lg:col-span-3')}>
          {/* Section Header */}
          {currentSection && !searchQuery && (
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    {currentSection.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentSection.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSection(null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all sections
                </button>
              </div>
            </div>
          )}

          {/* Sections Grid - No Selection */}
          {!selectedSection && !searchQuery && (
            <div className="space-y-12">
              {docSections.map((section) => {
                const Icon = iconMap[section.icon] || FileText;
                return (
                  <div key={section.id}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          {section.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.articles.map((article) => (
                        <Link key={article.id} href={`/help/docs/${article.id}`}>
                          <Card className="p-6 hover:shadow-md hover:border-primary/20 transition-all h-full group cursor-pointer">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {article.title}
                              </h3>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {article.description}
                            </p>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Articles List - With Selection or Search */}
          {(selectedSection || searchQuery) && (
            <div>
              {filteredArticles.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-6 w-6" />}
                  title="No articles found"
                  description="Try a different search term or browse the sections."
                  action={{
                    label: 'View All Documentation',
                    onClick: () => {
                      setSearchQuery('');
                      setSelectedSection(null);
                    },
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => {
                    const section = docSections.find((s) => s.id === article.section);
                    return (
                      <Link key={article.id} href={`/help/docs/${article.id}`}>
                        <Card className="p-6 hover:shadow-md hover:border-primary/20 transition-all h-full group cursor-pointer">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {article.description}
                          </p>
                          {section && (
                            <p className="text-xs text-muted-foreground">
                              {section.title}
                            </p>
                          )}
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help Footer */}
      <div className="mt-16 p-8 rounded-xl bg-muted/50 border border-border">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Need more help?
          </h2>
          <p className="text-muted-foreground mb-6">
            Check our Help Center or contact support
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/help"
              className="px-6 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Help Center
            </Link>
            <Link
              href="/help/support"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
