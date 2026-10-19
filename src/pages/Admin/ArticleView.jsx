import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
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
import ArticleBody from '@/pages/Help/ArticleBody';

export const route = { path: '/admin/articles/:id', layout: 'owner', access: "profile === 'Admin_c'" };

export default function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: article, loading, error, run } = useFetch(
    () =>
      sdk
        .table('help_articles_c')
        .select(ARTICLE_FIELDS)
        .get(id)
        .then((r) => r.data ?? null),
    [id],
  );

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
    <div className='mx-auto max-w-3xl space-y-6'>
      <Button variant='ghost' size='sm' asChild className='-ml-3'>
        <Link to='/admin/articles'>
          <ApperIcon name='ArrowLeft' size={16} /> Back to Articles
        </Link>
      </Button>

      {error ? (
        <div className='border border-border p-8 text-center'>
          <p className='font-heading text-xl font-semibold'>Could not load this article</p>
          <Button className='mt-4' variant='outline' onClick={run}>
            Try again
          </Button>
        </div>
      ) : firstLoad ? (
        <DetailSkeleton />
      ) : article === null ? (
        <div className='border border-dashed border-border p-10 text-center'>
          <p className='font-heading text-xl font-semibold'>Article not found</p>
        </div>
      ) : (
        <article>
          <div className='flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground'>
            <span>{article.category_c}</span>
            <span>·</span>
            <span>{article.read_time_c} min read</span>
            {article.published_c ? (
              <Badge variant='outline' className='border-success-border bg-success-muted text-success'>
                Published
              </Badge>
            ) : (
              <Badge variant='outline' className='bg-muted text-muted-foreground'>
                Draft
              </Badge>
            )}
          </div>
          <h1 className='mt-4 font-heading text-4xl font-semibold leading-tight tracking-tight'>{article.Name}</h1>
          <p className='mt-3 text-xl text-muted-foreground'>{article.summary_c}</p>
          <p className='mt-4 border-y border-border py-3 text-sm text-muted-foreground'>
            Updated {formatLocalDate(article.ModifiedOn, DATE_FORMATS.SHORT)}
          </p>

          <div className='mt-4 flex flex-wrap gap-2'>
            <Button asChild size='sm'>
              <Link to={`/admin/articles/${article.Id}/edit`}>
                <ApperIcon name='Pencil' size={14} /> Edit article
              </Link>
            </Button>
            <Button variant='outline' size='sm' onClick={() => setConfirmOpen(true)}>
              <ApperIcon name='Trash2' size={14} /> Delete
            </Button>
          </div>

          <div className='mt-8'>
            <ArticleBody body={article.body_c} />
          </div>
        </article>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from the Help Center for good. Switch it to a draft instead if you may need it again.
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
