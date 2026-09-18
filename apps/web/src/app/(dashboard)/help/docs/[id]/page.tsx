'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getDocArticleById, getDocSectionById, docSections } from '@/data/documentation-content';
import ReactMarkdown from 'react-markdown';

export default function DocArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const article = getDocArticleById(resolvedParams.id);
  const section = article ? getDocSectionById(article.section) : null;

  // Get other articles in the same section
  const sectionArticles = section
    ? section.articles.filter((a) => a.id !== article?.id)
    : [];

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Article not found"
          description="The documentation article you're looking for doesn't exist."
          action={{
            label: 'Back to Documentation',
            onClick: () => router.push('/help/docs'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/help/docs" className="hover:text-foreground transition-colors">
          Documentation
        </Link>
        <ChevronRight className="h-4 w-4" />
        {section && (
          <>
            <span className="hover:text-foreground transition-colors cursor-default">
              {section.title}
            </span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground font-medium truncate">{article.title}</span>
      </nav>

      {/* Back Button */}
      <Link
        href="/help/docs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Documentation
      </Link>

      {/* Article Header */}
      <div className="mb-8">
        {section && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            {section.title}
          </div>
        )}
        <h1 className="text-4xl font-bold text-foreground mb-4">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.description}</p>
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
                <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4 pb-2 border-b border-border">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="text-foreground leading-relaxed mb-4">{children}</p>
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
                <li className="text-foreground leading-relaxed">{children}</li>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 border border-border">
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                  {children}
                </blockquote>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
      </Card>

      {/* Related Articles in Section */}
      {sectionArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            More in {section?.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionArticles.slice(0, 4).map((related) => (
              <Link key={related.id} href={`/help/docs/${related.id}`}>
                <Card className="p-6 hover:shadow-md hover:border-primary/20 transition-all h-full group cursor-pointer">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {related.description}
                  </p>
                </Card>
              </Link>
            ))}
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
            Still need help? Visit our Help Center or contact support
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/help">
              <Button variant="outline">Visit Help Center</Button>
            </Link>
            <Link href="/help/support">
              <Button>Contact Support</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
