import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { and, contains, eq, or } from '@/services/query';
import { CURATED_HELP_ARTICLES, HELP_CATEGORIES, HELP_FAQS } from '@/data/helpArticles';

export const route = { path: '/help', layout: 'public', access: "profile === 'Member_c'" };

const POPULAR_SEARCHES = [
  'Credibility scores',
  'WhatsApp forwards',
  'Bank scams',
  'Red flag markings',
  'Privacy policy',
  'OTP scams',
];

export default function HelpCenter() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  // Fetch articles from database
  const { data: dbData, loading } = useFetch(() => {
    const filters = [eq('published_c', true)];
    return sdk
      .table('help_articles_c')
      .select(['Id', 'Name', 'category_c', 'summary_c', 'read_time_c', 'ModifiedOn'])
      .where(and(...filters))
      .orderByDesc('ModifiedOn')
      .limit(50, 0)
      .fetch()
      .then((r) => (r.success && r.data?.length ? r.data : []))
      .catch(() => []);
  }, []);

  // Merge database articles with curated knowledge base, avoiding duplicate Ids
  const allArticles = useMemo(() => {
    const dbRows = dbData ?? [];
    const dbIds = new Set(dbRows.map((a) => a.Id));
    const nonDuplicatedCurated = CURATED_HELP_ARTICLES.filter((a) => !dbIds.has(a.Id));
    return [...dbRows, ...nonDuplicatedCurated];
  }, [dbData]);

  // Filter articles based on active search and category
  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allArticles.filter((article) => {
      const matchCat = selectedCategory === 'all' || article.category_c === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      const titleMatch = (article.Name || '').toLowerCase().includes(q);
      const summaryMatch = (article.summary_c || '').toLowerCase().includes(q);
      const categoryMatch = (article.category_c || '').toLowerCase().includes(q);
      return titleMatch || summaryMatch || categoryMatch;
    });
  }, [allArticles, search, selectedCategory]);

  return (
    <div className='min-h-svh bg-background text-foreground'>
      {/* Hero Section */}
      <section className='border-b border-border bg-gradient-to-b from-muted/20 to-background'>
        <div className='mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:px-8'>
          <div className='max-w-2xl'>
            <h1 className='font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>
              Help & Knowledge <span className='italic text-highlight'>Center</span>
            </h1>
            <p className='mt-3 text-base sm:text-lg leading-relaxed text-muted-foreground'>
              Guides, verified answers, and resources on verifying news claims, understanding credibility ratings, and protecting your family from online hoaxes.
            </p>
          </div>

          {/* Search Box */}
          <div className='mt-8 max-w-3xl'>
            <div className='relative'>
              <ApperIcon
                name='Search'
                size={20}
                className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground'
              />
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search help articles (e.g. "credibility score", "bank scam", "marked text", "OTP")...'
                className='h-13 w-full rounded-xl border border-border bg-card pl-12 pr-11 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground shadow-xs'
              />
              {search && (
                <button
                  type='button'
                  onClick={() => setSearch('')}
                  className='absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer'
                  aria-label='Clear search'
                >
                  <ApperIcon name='X' size={16} />
                </button>
              )}
            </div>

            {/* Popular Searches */}
            <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              <span className='font-semibold'>Popular:</span>
              {POPULAR_SEARCHES.map((chip) => (
                <button
                  key={chip}
                  type='button'
                  onClick={() => setSearch(chip)}
                  className='rounded-md border border-border bg-card px-2.5 py-1 font-medium transition-colors hover:border-foreground hover:text-foreground cursor-pointer'
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Cards Section */}
      <section className='border-b border-border bg-muted/10 py-10'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='flex items-center justify-between pb-4'>
            <h2 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
              Browse by Knowledge Hub
            </h2>
            {selectedCategory !== 'all' && (
              <button
                type='button'
                onClick={() => setSelectedCategory('all')}
                className='text-xs font-semibold text-highlight hover:underline cursor-pointer'
              >
                Reset to all topics
              </button>
            )}
          </div>

          <div className='grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5'>
            {HELP_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = allArticles.filter((a) => a.category_c === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type='button'
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                  className={cn(
                    'flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer shadow-xs',
                    isSelected
                      ? 'border-foreground bg-foreground text-background shadow-md'
                      : 'border-border bg-card text-card-foreground hover:border-foreground/50 hover:bg-muted/40'
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg border text-sm',
                        isSelected
                          ? 'border-background/20 bg-background/10 text-background'
                          : 'border-border bg-muted/40 text-foreground'
                      )}
                    >
                      <ApperIcon name={cat.icon} size={16} />
                    </div>
                    <p className='mt-3 font-heading font-bold text-base leading-snug'>{cat.label}</p>
                    <p
                      className={cn(
                        'mt-1 text-xs line-clamp-2 leading-relaxed',
                        isSelected ? 'text-background/80' : 'text-muted-foreground'
                      )}
                    >
                      {cat.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'mt-4 flex items-center justify-between border-t pt-2 text-[11px] font-semibold',
                      isSelected ? 'border-background/20 text-background/80' : 'border-border/60 text-muted-foreground'
                    )}
                  >
                    <span>{count} {count === 1 ? 'article' : 'articles'}</span>
                    <ApperIcon name='ArrowRight' size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Articles Listing Section */}
      <section className='py-12 sm:py-16'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4'>
            <div>
              <h2 className='font-heading text-2xl font-bold'>
                {selectedCategory === 'all'
                  ? search
                    ? `Results for "${search}"`
                    : 'All Guides & Articles'
                  : `${selectedCategory} Guides`}
              </h2>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                Showing {filteredArticles.length} of {allArticles.length} published articles
              </p>
            </div>

            {/* Quick Category Filter Pills */}
            <div className='flex flex-wrap items-center gap-1.5'>
              <button
                type='button'
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
                  selectedCategory === 'all'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              {HELP_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type='button'
                  onClick={() => setSelectedCategory(c.id)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
                    selectedCategory === c.id
                      ? 'bg-foreground text-background shadow-xs'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {filteredArticles.length === 0 ? (
            <div className='mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center'>
              <ApperIcon name='FileSearch' size={36} className='mx-auto text-muted-foreground' />
              <h3 className='mt-3 font-heading text-xl font-bold'>No articles matched your search</h3>
              <p className='mt-1 text-sm text-muted-foreground max-w-md mx-auto'>
                Try searching for related keywords like "credibility", "bank", "scam", or clear your filter.
              </p>
              <Button
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
              >
                Reset Search Filters
              </Button>
            </div>
          ) : (
            <div className='mt-6 grid gap-4 md:grid-cols-2'>
              {filteredArticles.map((article) => (
                <Link
                  key={article.Id}
                  to={`/help/${article.Id}`}
                  className='group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-foreground/50 hover:shadow-md'
                >
                  <div>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='rounded-md border border-border bg-muted/40 px-2 py-0.5 font-semibold text-foreground text-[11px]'>
                        {article.category_c}
                      </span>
                      <span className='text-[11px] text-muted-foreground font-medium'>
                        {article.read_time_c} min read
                      </span>
                    </div>

                    <h3 className='mt-3 font-heading text-lg font-bold leading-snug group-hover:underline underline-offset-4 text-foreground'>
                      {article.Name}
                    </h3>

                    <p className='mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2'>
                      {article.summary_c}
                    </p>
                  </div>

                  <div className='mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold text-foreground'>
                    <span className='group-hover:text-highlight transition-colors'>Read Full Guide</span>
                    <ApperIcon
                      name='ArrowRight'
                      size={14}
                      className='transition-transform duration-150 group-hover:translate-x-1 text-muted-foreground group-hover:text-highlight'
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className='border-t border-border bg-muted/15 py-12 sm:py-16'>
        <div className='mx-auto max-w-4xl px-4 lg:px-8'>
          <div className='text-center max-w-xl mx-auto'>
            <h2 className='font-heading text-3xl font-bold tracking-tight'>Frequently Asked Questions</h2>
            <p className='mt-2 text-sm text-muted-foreground'>
              Instant answers to common questions about fact-checking methods, scoring accuracy, and WhatsApp forwards.
            </p>
          </div>

          <div className='mt-8 divide-y divide-border rounded-xl border border-border bg-card shadow-xs'>
            {HELP_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className='p-5 transition-colors hover:bg-muted/20'>
                  <button
                    type='button'
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className='flex w-full items-center justify-between gap-4 text-left cursor-pointer'
                  >
                    <span className='font-heading text-base font-bold text-foreground'>
                      {faq.q}
                    </span>
                    <div
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-transform duration-150',
                        isOpen && 'rotate-180 bg-foreground text-background'
                      )}
                    >
                      <ApperIcon name='ChevronDown' size={14} />
                    </div>
                  </button>
                  {isOpen && (
                    <p className='mt-3 text-sm leading-relaxed text-muted-foreground pr-8 animate-in fade-in-50 duration-200'>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Support & Helpline Footer */}
      <section className='border-t border-border bg-card py-12'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='grid gap-6 sm:grid-cols-2 items-center rounded-2xl border border-border bg-muted/20 p-6 sm:p-8 shadow-xs'>
            <div>
              <div className='flex items-center gap-2 text-xs font-bold text-muted-foreground'>
                <ApperIcon name='LifeBuoy' size={16} className='text-highlight' />
                Direct Editorial Support
              </div>
              <h3 className='mt-2 font-heading text-2xl font-bold text-foreground'>
                Still have questions or need assistance?
              </h3>
              <p className='mt-2 text-sm text-muted-foreground leading-relaxed'>
                Our dedicated fact-checking support desk reviews disputed claims and inquiries. Responses are delivered directly to your dashboard.
              </p>
              <div className='mt-4 flex flex-wrap items-center gap-3'>
                <Button asChild className='bg-foreground text-background hover:bg-foreground/90 font-bold'>
                  <Link to='/support'>Open a Support Ticket</Link>
                </Button>
                <span className='text-xs text-muted-foreground'>
                  Typical response within 24 hours
                </span>
              </div>
            </div>

            <div className='rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs'>
              <div className='flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400'>
                <ApperIcon name='AlertCircle' size={16} />
                Financial Scam Emergency Helpline
              </div>
              <p className='mt-2 text-sm font-semibold text-foreground'>
                Have you or a family member fallen victim to an online financial fraud?
              </p>
              <p className='mt-1 text-xs text-muted-foreground leading-relaxed'>
                Dial the Indian National Cyber Crime Helpline at <span className='font-bold text-highlight'>1930</span> immediately or register your formal report online at the official portal.
              </p>
              <div className='mt-4'>
                <a
                  href='https://cybercrime.gov.in'
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1.5 text-xs font-bold text-foreground underline underline-offset-4 hover:text-highlight'
                >
                  cybercrime.gov.in <ApperIcon name='ArrowUpRight' size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
