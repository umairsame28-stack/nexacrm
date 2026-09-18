'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Clock, ArrowLeft, Book } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getArticleById, getRelatedArticles, helpCategories } from '@/data/help-content';
import ReactMarkdown from 'react-markdown';

export default function HelpArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const article = getArticleById(resolvedParams.id);
  const relatedArticles = article ? getRelatedArticles(article.id) : [];
  const category = article ? helpCategories.find((c) => c.id === article.category) : null;

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={<Book className="h-6 w-6" />}
          title="Article not found"
          description="The article you're looking for doesn't exist or has been removed."
          action={{
            label: 'Back to Help Center',
            onClick: () => router.push('/help'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/help" className="hover:text-foreground transition-colors">
          Help Center
        </Link>
        <ChevronRight className="h-4 w-4" />
        {category && (
          <>
            <span className="hover:text-foreground transition-colors cursor-default">
              {category.name}
            </span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground font-medium truncate">{article.title}</span>
      </nav>

      {/* Back Button */}
      <Link href="/help" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Help Center
      </Link>

      {/* Article Header */}
      <div className="mb-8">
        {category && (
          <Badge variant="secondary" className="mb-4">
            {category.name}
          </Badge>
        )}
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {article.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          {article.description}
        </p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {article.readingTime} min read
          </div>
        </div>
      </div>

      {/* Article Content */}
      <Card className="p-8 mb-12">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-foreground mt-8 mb-4 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-foreground leading-relaxed mb-4">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-outside ml-6 mb-4 text-foreground space-y-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside ml-6 mb-4 text-foreground space-y-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-foreground leading-relaxed">
                  {children}
                </li>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
      </Card>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedArticles.map((related) => {
              const relatedCategory = helpCategories.find((c) => c.id === related.category);
              return (
                <Link key={related.id} href={`/help/${related.id}`}>
                  <Card className="p-6 hover:shadow-md hover:border-primary/20 transition-all h-full group cursor-pointer">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {related.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {relatedCategory && (
                        <Badge variant="secondary" className="font-normal">
                          {relatedCategory.name}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {related.readingTime} min read
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Footer */}
      <div className="mt-12 p-8 rounded-xl bg-muted/50 border border-border">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Was this article helpful?
          </h3>
          <p className="text-muted-foreground mb-6">
            Still need help? Contact our support team
          </p>
          <Link href="/help/support">
            <Button>
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
