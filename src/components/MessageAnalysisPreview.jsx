import { motion, useReducedMotion } from 'framer-motion';
import MarkedText from '@/components/MarkedText';
import { analyze, segment, SAMPLES, verdictFor } from '@/lib/veritas';

const demo = SAMPLES[0];
const demoResult = analyze(demo.text);
const demoSegments = segment(demo.text, demoResult.flags, demoResult.trust);
const demoVerdict = verdictFor(demoResult.score);
const verdictDrops = [
  { x: -104, y: -16, size: 4, rotate: -10 },
  { x: -82, y: -66, size: 3, rotate: 34 },
  { x: -38, y: -88, size: 5, rotate: -28 },
  { x: 18, y: -94, size: 3, rotate: 18 },
  { x: 76, y: -72, size: 4, rotate: -12 },
  { x: 112, y: -18, size: 5, rotate: 42 },
  { x: 96, y: 58, size: 3, rotate: -18 },
  { x: 42, y: 88, size: 4, rotate: 24 },
  { x: -22, y: 96, size: 3, rotate: -34 },
  { x: -78, y: 70, size: 4, rotate: 12 },
  { x: -112, y: 24, size: 3, rotate: -42 },
];

export default function MessageAnalysisPreview({ className }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.figure
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.55, delay: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
      className={className}
    >
      <figcaption className='mb-4 flex items-center justify-between border-b border-border pb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground'>
        <span>Forwarded message</span>
        <span>Family group · 2 min ago</span>
      </figcaption>
      <MarkedText segments={demoSegments} className='font-heading text-lg leading-relaxed' />
      <div className='relative mt-6 inline-block'>
        {demoVerdict.label.toLowerCase().includes('fake') && !prefersReducedMotion && verdictDrops.map((drop, index) => (
          <motion.span
            key={index}
            aria-hidden='true'
            initial={{ opacity: 0, scale: 0.15, x: 0, y: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.2, 0.8, 0.35], x: drop.x, y: drop.y, rotate: drop.rotate }}
            transition={{ delay: 1.02 + index * 0.018, duration: 0.78, ease: 'easeOut' }}
            className='pointer-events-none absolute left-1/2 top-1/2 z-0 bg-highlight'
            style={{ width: drop.size, height: drop.size, borderRadius: '50% 50% 50% 0' }}
          />
        ))}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.08, rotate: -8 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -6 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 1, type: 'spring', stiffness: 240, damping: 18 }}
          className='relative z-10 border-2 border-highlight px-4 py-2 text-highlight'
        >
          <p className='font-heading text-xl font-extrabold uppercase tracking-wide'>{demoVerdict.label}</p>
          <p className='text-center text-xs font-bold tracking-widest'>{demoResult.score} / 100</p>
        </motion.div>
      </div>
    </motion.figure>
  );
}