import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import { ListSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { and, contains, eq } from '@/services/query';

export const route = { path: '/admin/articles', layout: 'owner', access: "profile === 'Admin_c'" };
export const nav = {
  icon: 'BookOpen',
  label: 'Articles',
  section: 'Content',
  profiles: ['Admin_c'],
  order: 30,
};

const PAGE_SIZE = 10;
const FIELDS = ['Id', 'Name', 'category_c', 'published_c', 'read_time_c', 'ModifiedOn'];

export default function Articles() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, loading, error, run } = useFetch(() => {
    const f = [];
    if (status !== 'all') f.push(eq('published_c', status === 'published'));
    if (search.trim()) f.push(contains('Name', search.trim()));
    let q = sdk.table('help_articles_c').select(FIELDS);
    if (f.length) q = q.where(and(...f));
    return q
      .orderByDesc('ModifiedOn')
      .page(page, PAGE_SIZE)
      .fetch()
      .then((r) => {
        if (!r.success) throw new Error(r.message);
        return { rows: r.data, total: r.total, hasMore: r.hasMore };
      });
  }, [search, status, page]);

  const rows = data?.rows ?? [];
  const firstLoad = loading && data === undefined;

  return (
    <div className='mx-auto max-w-5xl space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6'>
        <div>
          <h1 className='font-heading text-3xl font-semibold tracking-tight'>Articles</h1>
          <p className='mt-1 text-sm text-muted-foreground'>Write, publish and update what customers read.</p>
        </div>
        <Button asChild>
          <Link to='/admin/articles/new'>
            <ApperIcon name='Plus' size={16} /> New article
          </Link>
        </Button>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='relative flex-1'>
          <ApperIcon name='Search' size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by title'
            className='pl-9'
            aria-label='Search articles'
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-full sm:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All articles</SelectItem>
            <SelectItem value='published'>Published</SelectItem>
            <SelectItem value='draft'>Drafts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className='border border-border p-8 text-center'>
          <p className='font-heading text-xl font-semibold'>Could not load articles</p>
          <Button className='mt-4' variant='outline' onClick={run}>
            Try again
          </Button>
        </div>
      ) : firstLoad ? (
        <ListSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <div className='border border-dashed border-border p-10 text-center'>
          <p className='font-heading text-xl font-semibold'>No articles found</p>
          <p className='mt-1 text-sm text-muted-foreground'>Change the filters, or write a new article.</p>
        </div>
      ) : (
        <div aria-busy={loading} className={cn('transition-opacity', loading && 'pointer-events-none opacity-60')}>
          <ul className='divide-y divide-border border-y border-border'>
            {rows.map((a) => (
              <li key={a.Id} className='grid gap-3 py-4 md:grid-cols-[1fr_9rem_7rem_8rem] md:items-center md:gap-6'>
                <div className='min-w-0'>
                  <Link to={`/admin/articles/${a.Id}`} className='block truncate font-semibold hover:underline underline-offset-4'>
                    {a.Name}
                  </Link>
                  <p className='text-xs text-muted-foreground'>
                    {a.category_c} · {a.read_time_c} min read
                  </p>
                </div>
                <div>
                  {a.published_c ? (
                    <Badge className='border-success-border bg-success-muted text-success' variant='outline'>
                      Published
                    </Badge>
                  ) : (
                    <Badge className='bg-muted text-muted-foreground' variant='outline'>
                      Draft
                    </Badge>
                  )}
                </div>
                <p className='text-sm text-muted-foreground'>{formatLocalDate(a.ModifiedOn, DATE_FORMATS.SHORT)}</p>
                <div className='flex gap-2 md:justify-end'>
                  <Button asChild variant='ghost' size='sm'>
                    <Link to={`/admin/articles/${a.Id}`}>View</Link>
                  </Button>
                  <Button asChild variant='outline' size='sm'>
                    <Link to={`/admin/articles/${a.Id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {(page > 1 || data?.hasMore) && (
            <div className='mt-4 flex items-center justify-between'>
              <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ApperIcon name='ChevronLeft' size={14} /> Previous
              </Button>
              <span className='text-sm text-muted-foreground'>Page {page}</span>
              <Button variant='outline' size='sm' disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
                Next <ApperIcon name='ChevronRight' size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
