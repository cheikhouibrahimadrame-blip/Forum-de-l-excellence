import type React from 'react';
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowDown, Calendar, PlayCircle, Sparkles, Heart, Award,
  Shield, GraduationCap, Users, BookOpen, Star, Lightbulb, Trophy, Compass,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Shared "living" design primitives — extracted from HomePage so
   every public page can share the same cinematic feel.
   ═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// Icon mapping
// ─────────────────────────────────────────────────────────────
export const livingIconMap: { [key: string]: React.ComponentType<any> } = {
  GraduationCap, Users, BookOpen, Award, Calendar, Star, Heart, Shield,
  Sparkles, Lightbulb, Trophy, Compass,
};

export const featureAccents = [
  { tint: 'var(--oak-olive)', bg: 'color-mix(in oklch, var(--oak-olive) 14%, white)', ring: 'color-mix(in oklch, var(--oak-olive) 22%, transparent)' },
  { tint: '#b8860c',          bg: 'color-mix(in oklch, var(--oak-peach) 65%, white)',  ring: 'color-mix(in oklch, var(--oak-gold, #ddb957) 26%, transparent)' },
  { tint: '#5d7d2e',          bg: 'color-mix(in oklch, var(--oak-chartreuse) 55%, white)', ring: 'color-mix(in oklch, var(--oak-chartreuse) 30%, transparent)' },
  { tint: '#5b6b4f',          bg: 'color-mix(in oklch, var(--oak-sage) 65%, white)',   ring: 'color-mix(in oklch, var(--oak-sage) 30%, transparent)' },
];

// ─────────────────────────────────────────────────────────────
// Reveal — wraps content and fades it in when it enters view
// ─────────────────────────────────────────────────────────────
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.unobserve(node);
      }
    }, options);
    obs.observe(node);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, visible };
}

export const Reveal: React.FC<
  React.PropsWithChildren<{ className?: string; delay?: 0 | 1 | 2 | 3 | 4 }>
> = ({ children, className = '', delay = 0 }) => {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const delayClass = delay > 0 ? `oak-reveal-delay-${delay}` : '';
  return (
    <div
      ref={ref}
      className={`oak-reveal ${delayClass} ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const splitStat = (value: string) => {
  const match = String(value).match(/^([\d.,]+)(.*)$/);
  if (!match) return { num: 0, suffix: value, isNumeric: false };
  const num = parseFloat(match[1].replace(',', '.'));
  return { num: isNaN(num) ? 0 : num, suffix: match[2] ?? '', isNumeric: !isNaN(num) };
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function useCountUpOnVisible(target: number, durationMs = 1800) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setValue(target);
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || hasRun) return;
      setHasRun(true);
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const t = Math.min((ts - start) / durationMs, 1);
        setValue(target * easeOutCubic(t));
        if (t < 1) requestAnimationFrame(step);
        else setValue(target);
      };
      requestAnimationFrame(step);
      obs.unobserve(node);
    }, { threshold: 0.3 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [target, durationMs, hasRun]);
  return { ref, value };
}

// ─────────────────────────────────────────────────────────────
// StatTile — animated counter card with sparkle badge
// ─────────────────────────────────────────────────────────────
export const StatTile: React.FC<{ stat: { value: string; label: string }; index: number }> = ({ stat, index }) => {
  const { num, suffix, isNumeric } = splitStat(stat.value);
  const { ref, value } = useCountUpOnVisible(num);
  const displayed = isNumeric
    ? num >= 100
      ? Math.round(value).toLocaleString('fr-FR')
      : (Math.round(value * 10) / 10).toString().replace('.0', '')
    : stat.value;
  const accent = featureAccents[index % featureAccents.length];
  return (
    <div
      ref={ref}
      className="kpi-card oak-tilt oak-spotlight relative"
      style={{ background: accent.bg, border: `1px solid ${accent.ring}` }}
    >
      <div
        className="absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center oak-float-fast"
        style={{ background: accent.tint, color: '#fff' }}
        aria-hidden
      >
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="kpi-label">{stat.label}</div>
      <div className="kpi-value" style={{ color: accent.tint }}>
        {isNumeric ? displayed : stat.value}
        {isNumeric && suffix && <span className="text-3xl ml-1">{suffix}</span>}
      </div>
      <div className="h-1 w-12 rounded-full" style={{ background: accent.tint, opacity: 0.7 }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// FeatureCard — mouse-tracked spotlight + 3D tilt
// ─────────────────────────────────────────────────────────────
export const FeatureCard: React.FC<{
  feature: { icon: string; title: string; description: string };
  index: number;
  href?: string;
  cta?: string;
}> = ({ feature, index, href, cta = 'En savoir plus' }) => {
  const Icon = livingIconMap[feature.icon] || GraduationCap;
  const accent = featureAccents[index % featureAccents.length];
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${py * -5}deg) rotateY(${px * 6}deg)`;
  }, []);

  const handleLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  }, []);

  const inner = (
    <>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: accent.bg, color: accent.tint, boxShadow: `0 8px 22px ${accent.ring}` }}
        aria-hidden
      >
        <Icon className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="text-xl font-semibold text-[var(--color-text)] leading-tight">{feature.title}</h3>
      <p className="text-[var(--color-text-muted)] leading-relaxed flex-1">{feature.description}</p>
      <span className="oak-magnetic-link mt-1 text-sm" style={{ color: accent.tint }}>
        {cta}
        <ArrowRight className="w-4 h-4" />
      </span>
    </>
  );

  const className = "card oak-spotlight oak-tilt p-7 h-full flex flex-col items-start gap-4";
  const style: React.CSSProperties = { borderColor: accent.ring };

  if (href) {
    return (
      <Link to={href} ref={cardRef as any} className={className} onMouseMove={handleMove} onMouseLeave={handleLeave} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <div ref={cardRef} className={className} onMouseMove={handleMove} onMouseLeave={handleLeave} style={style}>
      {inner}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MarqueeStrip — infinite scrolling badge ticker
// ─────────────────────────────────────────────────────────────
export const MarqueeStrip: React.FC<{ items?: { icon: ReactNode; label: string }[] }> = ({ items }) => {
  const defaults = [
    { icon: <Sparkles className="w-4 h-4" />, label: "Excellence Académique" },
    { icon: <Heart className="w-4 h-4" />, label: "Bienveillance & Discipline" },
    { icon: <Trophy className="w-4 h-4" />, label: "95% de réussite au CFEE" },
    { icon: <Lightbulb className="w-4 h-4" />, label: "Innovation pédagogique" },
    { icon: <Users className="w-4 h-4" />, label: "Communauté Forum de l'Excellence" },
    { icon: <Compass className="w-4 h-4" />, label: "Médinatoul Salam · Mbour" },
    { icon: <Star className="w-4 h-4" />, label: "Depuis 2013" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Suivi numérique des élèves" },
  ];
  const list = items && items.length ? items : defaults;
  const sequence = [...list, ...list];
  return (
    <div
      className="relative overflow-hidden border-y"
      style={{
        background: 'linear-gradient(90deg, #fff5d6 0%, #fefae0 50%, #ffe9b5 100%)',
        borderColor: 'color-mix(in oklch, var(--oak-gold, #ddb957) 25%, transparent)',
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
        style={{ background: 'linear-gradient(90deg, #fff5d6, transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
        style={{ background: 'linear-gradient(270deg, #ffe9b5, transparent)' }} />
      <div className="oak-marquee py-5" style={{ color: '#7a5b15' }}>
        {sequence.map((it, i) => (
          <div key={i} className="oak-marquee-item">
            {it.icon}<span>{it.label}</span><span className="oak-marquee-bullet" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SectionTitle — eyebrow + h2 with partial gradient (oak-living-text)
// ─────────────────────────────────────────────────────────────
export const SectionTitle: React.FC<{
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}> = ({ eyebrow, title, description, align = 'center', className = '' }) => (
  <div className={`${align === 'center' ? 'text-center max-w-3xl mx-auto' : ''} ${className}`}>
    {eyebrow && (
      <span
        className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-3"
        style={{ color: 'var(--oak-olive)' }}
      >
        · {eyebrow} ·
      </span>
    )}
    <h2
      className="text-3xl md:text-5xl font-extrabold tracking-tight"
      style={{ fontFamily: "'Cabinet Grotesk'", letterSpacing: '-0.02em' }}
    >
      {title}
    </h2>
    {description && (
      <p className="mt-5 text-lg text-[var(--color-text-muted)] leading-relaxed">{description}</p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// LivingHero — cinematic video hero w/ parallax mouse, blobs,
// glass eyebrow pulse pill, gradient living-text title.
// ─────────────────────────────────────────────────────────────
export type LivingHeroProps = {
  eyebrow?: string;
  title: string;            // last 3 words become gradient
  subtitle?: string;
  primary?: { label: string; to: string; icon?: ReactNode };
  secondary?: { label: string; to: string; icon?: ReactNode };
  trust?: { icon: ReactNode; label: string }[];
  videoSrc?: string;
  poster?: string;
  rightSlot?: ReactNode;     // optional right column (e.g. floating glass card)
  scrollCueTarget?: string;  // anchor id
  minHeight?: string;
};

export const LivingHero: React.FC<LivingHeroProps> = ({
  eyebrow = "Année académique 2025–2026 · Inscriptions ouvertes",
  title,
  subtitle,
  primary,
  secondary,
  trust,
  videoSrc = '/excz.mp4',
  poster = '/campus-hero.png',
  rightSlot,
  scrollCueTarget,
  minHeight = 'min(82vh, 760px)',
}) => {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
    };
    const onLeave = () => {
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const renderTitle = (t: string) => {
    const parts = t.split(' ');
    if (parts.length < 3) return <span className="oak-living-text-hero">{t}</span>;
    const lead = parts.slice(0, -3).join(' ');
    const tail = parts.slice(-3).join(' ');
    return (
      <>
        {lead && <span className="block">{lead}</span>}
        <span className="oak-living-text-hero block">{tail}</span>
      </>
    );
  };

  const hasRight = !!rightSlot;

  return (
    <section
      ref={heroRef}
      className="relative text-white section overflow-hidden"
      style={{ minHeight }}
    >
      <video
        autoPlay loop muted playsInline poster={poster}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(20,40,12,0.35) 0%, rgba(10,18,6,0.78) 65%, rgba(8,14,4,0.92) 100%)',
      }} />
      <div className="absolute inset-0 mix-blend-soft-light opacity-70" style={{
        background: 'linear-gradient(135deg, rgba(170,194,64,0.35) 0%, transparent 35%, rgba(255,226,173,0.30) 100%)',
      }} />

      <div className="oak-blob oak-blob-olive oak-blob-delay-1 oak-parallax-deep"
        style={{ width: 480, height: 480, top: '-12%', left: '-8%' }} />
      <div className="oak-blob oak-blob-peach oak-blob-delay-2 oak-parallax"
        style={{ width: 380, height: 380, top: '40%', right: '-6%' }} />
      <div className="oak-blob oak-blob-chartreuse oak-blob-delay-3 oak-parallax-soft"
        style={{ width: 280, height: 280, bottom: '-8%', left: '38%' }} />

      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative section-content py-24 md:py-32 lg:py-36">
        <div className={`grid ${hasRight ? 'lg:grid-cols-12' : ''} gap-10 items-center`}>
          <div className={`${hasRight ? 'lg:col-span-7' : 'max-w-4xl'} oak-parallax-soft`}>
            {eyebrow && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 oak-glass">
                <span
                  className="oak-pulse-ring inline-flex w-2 h-2 rounded-full"
                  style={{ background: '#aac240' }}
                  aria-hidden
                />
                <span className="text-xs font-semibold tracking-wider uppercase text-white/95">
                  {eyebrow}
                </span>
              </div>
            )}

            <h1
              className="font-extrabold leading-[1.05] tracking-tight mb-6 oak-parallax"
              style={{
                fontFamily: "'Cabinet Grotesk', 'Satoshi', sans-serif",
                fontSize: 'clamp(2.2rem, 5.2vw, 4.4rem)',
                letterSpacing: '-0.025em',
              }}
            >
              {renderTitle(title)}
            </h1>

            {subtitle && (
              <p
                className="text-white/85 mb-8 leading-relaxed max-w-2xl oak-parallax-soft"
                style={{ fontSize: 'clamp(1.05rem, 1.4vw, 1.25rem)' }}
              >
                {subtitle}
              </p>
            )}

            {(primary || secondary) && (
              <div className="flex flex-col sm:flex-row gap-3 oak-parallax-soft">
                {primary && (
                  <Link
                    to={primary.to}
                    className="oak-shine inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base"
                    style={{
                      background: 'linear-gradient(135deg, #c9dba8 0%, #aac240 60%, #8aa02f 100%)',
                      color: '#1a1a1a',
                      boxShadow: '0 14px 32px rgba(140, 170, 60, 0.45)',
                    }}
                  >
                    {primary.icon ?? <Calendar className="w-5 h-5" />}
                    {primary.label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {secondary && (
                  <Link
                    to={secondary.to}
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base oak-glass text-white"
                  >
                    {secondary.icon ?? <PlayCircle className="w-5 h-5" />}
                    {secondary.label}
                  </Link>
                )}
              </div>
            )}

            {trust && trust.length > 0 && (
              <div className="mt-10 flex items-center gap-6 flex-wrap oak-parallax-soft">
                {trust.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                    {t.icon}
                    {t.label}
                    {i < trust.length - 1 && <span className="hidden sm:block w-px h-5 bg-white/25 ml-4" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasRight && (
            <div className="lg:col-span-5 oak-parallax">{rightSlot}</div>
          )}
        </div>
      </div>

      {scrollCueTarget && (
        <a href={`#${scrollCueTarget}`} className="absolute left-1/2 -translate-x-1/2 bottom-8 z-10 hidden md:flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
          <span className="text-[10px] uppercase tracking-[0.3em]">Découvrir</span>
          <div className="oak-scroll-cue"><ArrowDown className="w-5 h-5" /></div>
        </a>
      )}

      <div
        className="absolute bottom-0 left-0 w-full h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--color-bg) 0%, transparent 100%)' }}
      />
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// LivingCTA — animated mesh gradient + blobs + dark CTA
// ─────────────────────────────────────────────────────────────
export const LivingCTA: React.FC<{
  eyebrow?: string;
  title: string;            // last 2 words highlighted
  description?: string;
  primary: { label: string; to: string; icon?: ReactNode };
  secondary?: { label: string; to: string; icon?: ReactNode; href?: string };
  badges?: { icon: ReactNode; label: string }[];
}> = ({ eyebrow = "Inscriptions 2025–2026 ouvertes", title, description, primary, secondary, badges }) => {
  const parts = title.split(' ');
  const lead = parts.slice(0, -2).join(' ');
  const tail = parts.slice(-2).join(' ');
  return (
    <section className="py-24 section relative overflow-hidden">
      <div className="absolute inset-0 -z-10 oak-mesh-bg" />
      <div className="oak-blob oak-blob-olive opacity-40 absolute"
        style={{ width: 360, height: 360, top: '-10%', left: '12%' }} />
      <div className="oak-blob oak-blob-peach opacity-40 absolute"
        style={{ width: 320, height: 320, bottom: '-12%', right: '10%' }} />

      <div className="section-content-narrow text-center relative z-10">
        <Reveal>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-white/70 backdrop-blur-sm border"
            style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 28%, transparent)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--oak-olive)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--oak-olive)' }}>
              {eyebrow}
            </span>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <h2
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-[1.05]"
            style={{ fontFamily: "'Cabinet Grotesk'", letterSpacing: '-0.025em', color: 'var(--oak-dark)' }}
          >
            {lead && <>{lead}{' '}</>}
            <span className="oak-living-text">{tail}</span>
          </h2>
        </Reveal>

        {description && (
          <Reveal delay={2}>
            <p className="text-xl mb-10 leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'color-mix(in oklch, var(--oak-dark) 80%, transparent)' }}>
              {description}
            </p>
          </Reveal>
        )}

        <Reveal delay={3}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={primary.to}
              className="oak-shine inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base"
              style={{
                background: 'linear-gradient(135deg, var(--oak-dark) 0%, #2a2f23 100%)',
                color: '#eff3a2',
                boxShadow: '0 16px 36px rgba(20, 30, 12, 0.35)',
              }}
            >
              {primary.icon ?? <Calendar className="w-5 h-5" />}
              {primary.label}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {secondary && (
              secondary.href ? (
                <a
                  href={secondary.href}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-white/80 hover:bg-white border-2 transition-colors"
                  style={{ borderColor: 'var(--oak-olive)', color: 'var(--oak-dark)' }}
                >
                  {secondary.icon}
                  {secondary.label}
                </a>
              ) : (
                <Link
                  to={secondary.to}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-white/80 hover:bg-white border-2 transition-colors"
                  style={{ borderColor: 'var(--oak-olive)', color: 'var(--oak-dark)' }}
                >
                  {secondary.icon}
                  {secondary.label}
                </Link>
              )
            )}
          </div>
        </Reveal>

        {badges && badges.length > 0 && (
          <Reveal delay={4}>
            <div className="mt-12 flex items-center justify-center gap-8 flex-wrap text-sm font-medium"
              style={{ color: 'color-mix(in oklch, var(--oak-dark) 70%, transparent)' }}>
              {badges.map((b, i) => (
                <div key={i} className="flex items-center gap-2">{b.icon}{b.label}</div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
};
