'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Book, Clock, ChevronRight, Zap, Users, Briefcase, MessageSquare, CheckSquare, BarChart2, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { helpCategories, helpArticles, searchHelpArticles, getArticlesByCategory, type HelpArticle } from '@/data/help-content';
import Link from 'next/link';

const iconMap: Record<string, typeof Zap> = {
  Zap,
  Users,
  Briefcase,
  MessageSquare,
  CheckSquare,
  BarChart2,
  Settings,
};

export default function HelpCenterPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Search articles
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim() && !selectedCategory) {
      return helpArticles;
    }

    let results = searchQuery.trim() ? searchHelpArticles(searchQuery) : helpArticles;

    if (selectedCategory) {
      results = results.filter((article) => article.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory]);

  const displayedArticles = selectedCategory
    ? filteredArticles
    : filteredArticles.slice(0, 12);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <Book className="h-3 w-3" />
          HELP CENTER
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          How can we help?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers, guides, and practical help for using NexaCRM.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for help articles..."
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

      {/* Category Filter */}
      {!searchQuery && (
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              All Categories
            </button>
            {helpCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories Grid - Only show when no search */}
      {!searchQuery && !selectedCategory && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => {
              const Icon = iconMap[category.icon] || Book;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="group text-left"
                >
                  <Card className="p-6 hover:shadow-lg hover:border-primary/20 transition-all h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {category.articleCount} articles
                        </p>
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Articles List */}
      <div>
        {selectedCategory && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              {helpCategories.find((c) => c.id === selectedCategory)?.name} Articles
            </h2>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all categories
            </button>
          </div>
        )}

        {filteredArticles.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No articles found"
            description="Try a different search term or browse the categories below."
            action={{
              label: 'Contact Support',
              onClick: () => router.push('/help/support'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedArticles.map((article) => {
              const category = helpCategories.find((c) => c.id === article.category);
              return (
                <Link key={article.id} href={`/help/${article.id}`}>
                  <Card className="p-6 hover:shadow-md hover:border-primary/20 transition-all h-full group cursor-pointer">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {category && (
                        <Badge variant="secondary" className="font-normal">
                          {category.name}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readingTime} min read
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {!selectedCategory && !searchQuery && displayedArticles.length < filteredArticles.length && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View all {filteredArticles.length} articles →
            </button>
          </div>
        )}
      </div>

      {/* Additional Help */}
      <div className="mt-16 p-8 rounded-xl bg-muted/50 border border-border">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Didn't find what you're looking for?
          </h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to help you
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/help/support"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/help/docs"
              className="px-6 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
