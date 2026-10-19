import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import ApperIcon from '@/components/ApperIcon';
import { DetailSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { ARTICLE_FIELDS } from '@/lib/ticketMeta';
import { and, eq, ne } from '@/services/query';
import { CURATED_HELP_ARTICLES } from '@/data/helpArticles';
import ArticleBody from './ArticleBody';

export const route = { path: '/help/:id', layout: 'public', access: "profile === 'Member_c'" };

export default function HelpArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const isAdmin = profile === 'Admin_c';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: article, loading, error, run } = useFetch(
    () =>
      sdk
        .table('help_articles_c')
        .select(ARTICLE_FIELDS)
        .get(id)
        .then((r) => {
          if (r?.data) return r.data;
          const curated = CURATED_HELP_ARTICLES.find((a) => a.Id === id);
          return curated ?? null;
        })
        .catch(() => {
          const curated = CURATED_HELP_ARTICLES.find((a) => a.Id === id);
          return curated ?? null;
        }),
    [id],
  );

  const { data: related } = useFetch(() => {
    if (!article) return Promise.resolve([]);
    return sdk
      .table('help_articles_c')
      .select(['Id', 'Name', 'summary_c'])
      .where(and(eq('published_c', true), eq('category_c', article.category_c), ne('Id', article.Id)))
      .limit(3, 0)
      .fetch()
      .then((r) => {
        if (r.success && r.data?.length) return r.data;
        return CURATED_HELP_ARTICLES.filter(
          (a) => a.category_c === article.category_c && a.Id !== article.Id
        ).slice(0, 3);
      })
      .catch(() =>
        CURATED_HELP_ARTICLES.filter(
          (a) => a.category_c === article.category_c && a.Id !== article.Id
        ).slice(0, 3)
      );
  }, [article?.Id]);

  async function remove() {
    setDeleting(true);
    try {
      const res = await sdk.table('help_articles_c').remove(article.Id);
      if (res.messages?.length) toast.error(res.messages[0]);
      if (!(res.data?.length > 0) && res.success !== true) return;
      toast.success('Article deleted');
      setConfirmOpen(false);
      navigate('/admin/articles');
    } finally {
      setDeleting(false);
    }
  }

  const firstLoad = loading && article === undefined;

  return (
    <div className='mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-14'>
      <Button variant='ghost' size='sm' asChild className='-ml-3'>
        <Link to='/help'>
          <ApperIcon name='ArrowLeft' size={16} /> Back to Help Center
        </Link>
      </Button>

      {error ? (
        <div className='mt-8 border border-border p-8 text-center'>
          <p className='font-heading text-xl font-semibold'>We could not load this article</p>
          <Button className='mt-4' variant='outline' onClick={run}>
            Try again
          </Button>
        </div>
      ) : firstLoad ? (
        <div className='mt-8'>
          <DetailSkeleton />
        </div>
      ) : article === null ? (
        <div className='mt-8 border border-dashed border-border p-10 text-center'>
          <p className='font-heading text-xl font-semibold'>Article not found</p>
          <p className='mt-1 text-sm text-muted-foreground'>It may have been moved or unpublished.</p>
        </div>
      ) : (
        <article className='mt-6'>
          <div className='flex flex-wrap items-center gap-2.5 text-xs'>
            <span className='rounded-md border border-border bg-muted/40 px-2.5 py-0.5 font-semibold text-foreground'>{article.category_c}</span>
            <span className='text-muted-foreground'>·</span>
            <span className='text-muted-foreground font-medium'>{article.read_time_c} min read</span>
            {!article.published_c && <Badge variant='outline'>Draft</Badge>}
          </div>
          <h1 className='mt-4 font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl'>
            {article.Name}
          </h1>
          <p className='mt-4 text-xl text-muted-foreground'>{article.summary_c}</p>
          <p className='mt-4 border-y border-border py-3 text-sm text-muted-foreground'>
            Updated {formatLocalDate(article.ModifiedOn, DATE_FORMATS.SHORT)}
          </p>

          {isAdmin && (
            <div className='mt-4 flex flex-wrap gap-2'>
              <Button asChild variant='outline' size='sm'>
                <Link to={`/admin/articles/${article.Id}/edit`}>
                  <ApperIcon name='Pencil' size={14} /> Edit article
                </Link>
              </Button>
              <Button variant='outline' size='sm' onClick={() => setConfirmOpen(true)}>
                <ApperIcon name='Trash2' size={14} /> Delete
              </Button>
            </div>
          )}

          <div className='mt-8'>
            <ArticleBody body={article.body_c} />
          </div>

          {related && related.length > 0 && (
            <div className='mt-14 border-t border-border pt-8'>
              <h2 className='font-heading text-2xl font-semibold'>More in {article.category_c}</h2>
              <ul className='mt-4 divide-y divide-border border-y border-border'>
                {related.map((r) => (
                  <li key={r.Id}>
                    <Link to={`/help/${r.Id}`} className='block py-4 hover:underline underline-offset-4'>
                      <span className='font-semibold'>{r.Name}</span>
                      <span className='block text-sm text-muted-foreground'>{r.summary_c}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className='mt-14 flex flex-col items-start justify-between gap-4 border border-border bg-card p-6 sm:flex-row sm:items-center'>
            <p className='font-heading text-xl font-semibold'>Still stuck? Ask our team.</p>
            <Button asChild>
              <Link to='/support'>Contact support</Link>
            </Button>
          </div>
        </article>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from the Help Center for good. Unpublish it instead if you may need it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
