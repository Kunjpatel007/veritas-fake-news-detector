import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ARTICLE_CATEGORIES } from '@/lib/ticketMeta';

export default function ArticleFields({ form, setForm }) {
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='title'>Title</Label>
        <Input
          id='title'
          value={form.Name}
          onChange={(e) => set('Name', e.target.value)}
          placeholder='e.g. What to do if you already shared your OTP'
        />
      </div>

      <div className='grid gap-6 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label>Category</Label>
          <Select value={form.category_c} onValueChange={(v) => set('category_c', v)}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='read-time'>Read time (minutes)</Label>
          <Input
            id='read-time'
            type='number'
            min='1'
            value={form.read_time_c}
            onChange={(e) => set('read_time_c', e.target.value)}
            placeholder='3'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='summary'>Summary</Label>
        <Input
          id='summary'
          value={form.summary_c}
          onChange={(e) => set('summary_c', e.target.value)}
          placeholder='One line that tells readers what they will learn'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='body'>Article</Label>
        <Textarea
          id='body'
          value={form.body_c}
          onChange={(e) => set('body_c', e.target.value)}
          rows={16}
          placeholder={'Write the article. Start a line with ## for a heading and with - for a bullet. Leave a blank line between paragraphs.'}
        />
      </div>

      <div className='flex items-center justify-between border border-border p-4'>
        <div>
          <Label htmlFor='published'>Published</Label>
          <p className='text-sm text-muted-foreground'>Drafts are visible only to staff.</p>
        </div>
        <Switch id='published' checked={form.published_c} onCheckedChange={(v) => set('published_c', v)} />
      </div>
    </div>
  );
}
