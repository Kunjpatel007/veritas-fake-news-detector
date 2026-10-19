import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import { DetailSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { ARTICLE_FIELDS } from '@/lib/ticketMeta';
import ArticleFields from './ArticleFields';

export const route = { path: '/admin/articles/:id/edit', layout: 'owner', access: "profile === 'Admin_c'" };

export default function ArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const { data: article, loading, error, run } = useFetch(
    () =>
      sdk
        .table('help_articles_c')
        .select(ARTICLE_FIELDS)
        .get(id)
        .then((r) => r.data ?? null),
    [id],
  );

  useEffect(() => {
    if (article) {
      setForm({
        Name: article.Name ?? '',
        category_c: article.category_c,
        summary_c: article.summary_c ?? '',
        body_c: article.body_c ?? '',
        published_c: article.published_c === true,
        read_time_c: String(article.read_time_c ?? 3),
      });
    }
  }, [article]);

  async function save(e) {
    e.preventDefault();
    if (!form.Name.trim()) {
      toast.error('Give the article a title');
      return;
    }
    setSaving(true);
    try {
      const res = await sdk.table('help_articles_c').update({
        Id: article.Id,
        Name: form.Name.trim(),
        category_c: form.category_c,
        summary_c: form.summary_c.trim(),
        body_c: form.body_c,
        published_c: form.published_c,
        read_time_c: Number(form.read_time_c) || 1,
      });
      if (res.messages?.length) toast.error(res.messages[0]);
      if (!res.data?.length) return;
      toast.success('Article saved');
      navigate(`/admin/articles/${article.Id}`);
    } finally {
      setSaving(false);
    }
  }

  const firstLoad = loading && article === undefined;

  return (
    <div className='mx-auto max-w-3xl'>
      <Button variant='ghost' size='sm' asChild className='-ml-3'>
        <Link to='/admin/articles'>
          <ApperIcon name='ArrowLeft' size={16} /> Back to Articles
        </Link>
      </Button>
      <h1 className='mt-3 font-heading text-3xl font-semibold tracking-tight'>Edit article</h1>

      {error ? (
        <div className='mt-8 border border-border p-8 text-center'>
          <p className='font-heading text-xl font-semibold'>Could not load this article</p>
          <Button className='mt-4' variant='outline' onClick={run}>
            Try again
          </Button>
        </div>
      ) : firstLoad || (article && !form) ? (
        <div className='mt-8'>
          <DetailSkeleton />
        </div>
      ) : article === null ? (
        <div className='mt-8 border border-dashed border-border p-10 text-center'>
          <p className='font-heading text-xl font-semibold'>Article not found</p>
        </div>
      ) : (
        <form onSubmit={save} className='mt-8'>
          <ArticleFields form={form} setForm={setForm} />
          <div className='mt-8 flex gap-3 border-t border-border pt-6'>
            <Button type='submit' disabled={saving}>
              {saving ? (
                <>
                  <ApperIcon name='LoaderCircle' size={16} className='animate-spin' /> Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
            <Button type='button' variant='outline' asChild>
              <Link to={`/admin/articles/${article.Id}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
