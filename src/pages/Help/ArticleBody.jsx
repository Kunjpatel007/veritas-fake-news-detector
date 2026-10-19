function parse(body) {
  const blocks = [];
  let list = null;
  (body ?? '').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t) {
      list = null;
      return;
    }
    if (t.startsWith('## ')) {
      list = null;
      blocks.push({ type: 'h', text: t.slice(3) });
      return;
    }
    if (t.startsWith('- ')) {
      if (!list) {
        list = { type: 'ul', items: [] };
        blocks.push(list);
      }
      list.items.push(t.slice(2));
      return;
    }
    list = null;
    blocks.push({ type: 'p', text: t });
  });
  return blocks;
}

export default function ArticleBody({ body }) {
  const blocks = parse(body);
  return (
    <div className='space-y-4 text-lg leading-relaxed'>
      {blocks.map((b, i) => {
        if (b.type === 'h') {
          return (
            <h2 key={i} className='pt-4 font-heading text-2xl font-semibold'>
              {b.text}
            </h2>
          );
        }
        if (b.type === 'ul') {
          return (
            <ul key={i} className='list-disc space-y-2 pl-6 text-foreground/90'>
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className='text-foreground/90'>
            {b.text}
          </p>
        );
      })}
    </div>
  );
}
