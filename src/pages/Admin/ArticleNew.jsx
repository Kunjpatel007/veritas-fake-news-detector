import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { ARTICLE_CATEGORIES } from '@/lib/ticketMeta';
import ArticleFields from './ArticleFields';

export const route = { path: '/admin/articles/new', layout: 'owner', access: "profile === 'Admin_c'" };

export default function ArticleNew() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    Name: '',
    category_c: ARTICLE_CATEGORIES[0],
    summary_c: '',
    body_c: '',
    published_c: false,
    read_time_c: '3',
  });

  async function save(e) {
    e.preventDefault();
    if (!form.Name.trim()) {
      toast.error('Give the article a title');
      return;
    }
    setSaving(true);
    try {
      const res = await sdk.table('help_articles_c').create({
        Name: form.Name.trim(),
        category_c: form.category_c,
        summary_c: form.summary_c.trim(),
        body_c: form.body_c,
        published_c: form.published_c,
        read_time_c: Number(form.read_time_c) || 1,
      });
      if (res.messages?.length) toast.error(res.messages[0]);
      if (!res.data?.length) return;
      toast.success('Article created');
      const newId = res.data[0]?.Id;
      navigate(newId ? `/admin/articles/${newId}` : '/admin/articles');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='mx-auto max-w-3xl'>
      <Button variant='ghost' size='sm' asChild className='-ml-3'>
        <Link to='/admin/articles'>
          <ApperIcon name='ArrowLeft' size={16} /> Back to Articles
        </Link>
      </Button>
      <h1 className='mt-3 font-heading text-3xl font-semibold tracking-tight'>New article</h1>
      <p className='mb-8 mt-1 text-sm text-muted-foreground'>It appears in the Help Center once you publish it.</p>

      <form onSubmit={save}>
        <ArticleFields form={form} setForm={setForm} />
        <div className='mt-8 flex gap-3 border-t border-border pt-6'>
          <Button type='submit' disabled={saving}>
            {saving ? (
              <>
                <ApperIcon name='LoaderCircle' size={16} className='animate-spin' /> Saving...
              </>
            ) : (
              'Create article'
            )}
          </Button>
          <Button type='button' variant='outline' asChild>
            <Link to='/admin/articles'>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
