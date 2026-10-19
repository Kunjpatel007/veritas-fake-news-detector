import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const penLine = (color) => ({
  backgroundImage: `linear-gradient(${color}, ${color})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '0 100%',
});

export default function MarkedText({ segments, animate = true, className }) {
  let order = 0;
  return (
    <p className={cn('whitespace-pre-wrap leading-relaxed', className)}>
      {segments.map((seg, i) => {
        if (!seg.type) return <span key={i}>{seg.text}</span>;
        const flagged = seg.type !== 'trust';
        const delay = animate ? 0.4 + order * 0.16 : 0;
        order += 1;
        return (
          <motion.span
            key={i}
            initial={animate ? { backgroundSize: '0% 2px' } : false}
            animate={{ backgroundSize: '100% 2px' }}
            transition={{ delay, duration: 0.45, ease: 'easeOut' }}
            className={cn('pb-0.5', flagged ? 'font-semibold text-highlight' : 'text-foreground')}
            style={penLine(flagged ? 'var(--highlight)' : 'var(--muted-foreground)')}
          >
            {seg.text}
          </motion.span>
        );
      })}
    </p>
  );
}
