'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { Search, User, Lightbulb, Briefcase, CheckSquare, X, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/cn';

interface SearchResult {
  id: string;
  type: 'contact' | 'lead' | 'deal' | 'task';
  title: string;
  subtitle?: string;
  url: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const searchAll = async () => {
      setIsSearching(true);
      try {
        const [contacts, leads, deals, tasks] = await Promise.all([
          searchContacts(debouncedQuery),
          searchLeads(debouncedQuery),
          searchDeals(debouncedQuery),
          searchTasks(debouncedQuery),
        ]);

        const allResults: SearchResult[] = [
          ...contacts,
          ...leads,
          ...deals,
          ...tasks,
        ];

        setResults(allResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchAll();
  }, [debouncedQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.url);
    onClose();
    setQuery('');
    setResults([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-scale-in px-4">
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts, leads, deals, tasks..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {isSearching && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.trim() && !isSearching && results.length === 0 && (
              <div className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              </div>
            )}

            {!query.trim() && (
              <div className="py-8 px-4 text-center">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Start typing to search...</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Contacts • Leads • Deals • Tasks
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {groupResultsByType(results).map((group) => (
                  <Fragment key={group.type}>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.items.map((result, index) => {
                      const globalIndex = results.indexOf(result);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <div
                            className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                              isSelected
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Navigate with ↑↓ • Select with Enter</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper functions
function getIcon(type: SearchResult['type']) {
  switch (type) {
    case 'contact':
      return <User className="h-4 w-4" />;
    case 'lead':
      return <Lightbulb className="h-4 w-4" />;
    case 'deal':
      return <Briefcase className="h-4 w-4" />;
    case 'task':
      return <CheckSquare className="h-4 w-4" />;
  }
}

function groupResultsByType(results: SearchResult[]) {
  const groups: Array<{ type: string; label: string; items: SearchResult[] }> = [];

  const contacts = results.filter((r) => r.type === 'contact');
  const leads = results.filter((r) => r.type === 'lead');
  const deals = results.filter((r) => r.type === 'deal');
  const tasks = results.filter((r) => r.type === 'task');

  if (contacts.length) groups.push({ type: 'contact', label: 'Contacts', items: contacts });
  if (leads.length) groups.push({ type: 'lead', label: 'Leads', items: leads });
  if (deals.length) groups.push({ type: 'deal', label: 'Deals', items: deals });
  if (tasks.length) groups.push({ type: 'task', label: 'Tasks', items: tasks });

  return groups;
}

// API search functions
async function searchContacts(query: string): Promise<SearchResult[]> {
  try {
    const response = await apiClient.get('/contacts', {
      params: { search: query, limit: 5 },
    });
    return response.data.data.map((contact: any) => ({
      id: contact.id,
      type: 'contact' as const,
      title: `${contact.firstName} ${contact.lastName || ''}`.trim(),
      subtitle: contact.email || contact.phone,
      url: `/contacts?id=${contact.id}`,
    }));
  } catch {
    return [];
  }
}

async function searchLeads(query: string): Promise<SearchResult[]> {
  try {
    const response = await apiClient.get('/leads', {
      params: { search: query, limit: 5 },
    });
    return response.data.data.map((lead: any) => ({
      id: lead.id,
      type: 'lead' as const,
      title: lead.title,
      subtitle: `${lead.contact?.firstName || ''} ${lead.contact?.lastName || ''}`.trim(),
      url: `/leads?id=${lead.id}`,
    }));
  } catch {
    return [];
  }
}

async function searchDeals(query: string): Promise<SearchResult[]> {
  try {
    const response = await apiClient.get('/deals', {
      params: { search: query, limit: 5 },
    });
    return response.data.data.map((deal: any) => ({
      id: deal.id,
      type: 'deal' as const,
      title: deal.name,
      subtitle: deal.company || `$${deal.value}`,
      url: `/deals?id=${deal.id}`,
    }));
  } catch {
    return [];
  }
}

async function searchTasks(query: string): Promise<SearchResult[]> {
  try {
    const response = await apiClient.get('/tasks', {
      params: { search: query, limit: 5 },
    });
    return response.data.data.map((task: any) => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      subtitle: task.description || `Due: ${task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'No date'}`,
      url: `/tasks?id=${task.id}`,
    }));
  } catch {
    return [];
  }
}
