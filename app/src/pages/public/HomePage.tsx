import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { API } from '../../lib/apiRoutes';
import {
  GraduationCap, BookOpen, Users, Award, Calendar, ArrowRight, ChevronRight,
  Star, Heart, Shield, Sparkles, ArrowDown, Quote, PlayCircle, MapPin, Clock,
  Lightbulb, Trophy, Compass, GalleryHorizontalEnd, Phone, Mail, School,
  Leaf, Music, Palette, Camera, Bus, ShieldCheck, CheckCircle, Target, Zap,
  UserPlus, FileText,
} from 'lucide-react';
import {
  DEFAULT_HOMEPAGE,
  mergeHomepageContent,
  type HomepageContent,
  type HomepageStat,
  type HomepageFeature,
  type HomepageBentoItem,
  type HomepageMarqueeItem,
  type HomepagePlatformItem,
  type HomepageSectionTitle,
} from '../../lib/homepageDefaults';

// ─────────────────────────────────────────────────────────────────
// Icon resolver (string -> lucide component)
// ─────────────────────────────────────────────────────────────────
const iconMap: { [key: string]: React.ComponentType<any> } = {
  GraduationCap, BookOpen, Users, Award, Calendar, Star, Heart, Shield,
  Sparkles, Lightbulb, Trophy, Compass, MapPin, Clock, PlayCircle, ArrowRight,
  ChevronRight, Quote, GalleryHorizontalEnd, Phone, Mail, School, Leaf, Music,
  Palette, Camera, Bus, ShieldCheck, CheckCircle, Target, Zap, UserPlus, FileText,
};
const Icon = ({ name, className }: { name?: string; className?: string }) => {
  const Cmp = (name && iconMap[name]) || Sparkles;
  return <Cmp className={className} />;
};

// Per-feature visual accent (cycled)
const featureAccents = [
  { tint: 'var(--oak-olive)', bg: 'color-mix(in oklch, var(--oak-olive) 14%, white)', ring: 'color-mix(in oklch, var(--oak-olive) 22%, transparent)' },
  { tint: '#b8860c', bg: 'color-mix(in oklch, var(--oak-peach) 65%, white)', ring: 'color-mix(in oklch, var(--oak-gold, #ddb957) 26%, transparent)' },
  { tint: '#5d7d2e', bg: 'color-mix(in oklch, var(--oak-chartreuse) 55%, white)', ring: 'color-mix(in oklch, var(--oak-chartreuse) 30%, transparent)' },
  { tint: '#5b6b4f', bg: 'color-mix(in oklch, var(--oak-sage) 65%, white)', ring: 'color-mix(in oklch, var(--oak-sage) 30%, transparent)' },
];

const platformAccentMap: Record<HomepagePlatformItem['accent'], { bg: string; tint: string }> = {
  student: { bg: 'var(--color-student-bg)', tint: 'var(--color-student)' },
  parent:  { bg: 'var(--color-parent-bg)',  tint: 'var(--color-parent)'  },
  teacher: { bg: 'var(--color-teacher-bg)', tint: 'var(--color-teacher)' },
  admin:   { bg: 'var(--color-admin-bg)',   tint: 'var(--color-admin)'   },
};

// ─────────────────────────────────────────────────────────────────
// Helpers / hooks
// ─────────────────────────────────────────────────────────────────
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
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let started = false;
    let raf = 0;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        started = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          setValue(target * easeOutCubic(t));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(node);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [target, durationMs]);
  return { ref, value };
}

function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(node); }
    }, options);
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const Reveal: React.FC<React.PropsWithChildren<{ className?: string; delay?: 0 | 1 | 2 | 3 | 4 }>> = ({ children, className = '', delay = 0 }) => {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const delayClass = delay > 0 ? `oak-reveal-delay-${delay}` : '';
  return (
    <div ref={ref} className={`oak-reveal ${delayClass} ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Section header (eyebrow + split title + optional description + cta)
// ─────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ data: HomepageSectionTitle; align?: 'center' | 'left'; className?: string }> = ({
  data, align = 'center', className = '',
}) => {
  const alignCls = align === 'center' ? 'text-center max-w-3xl mx-auto' : '';
  return (
    <Reveal className={`${alignCls} ${className}`}>
      {data.eyebrow && (
        <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak-olive)' }}>
          {data.eyebrow}
        </span>
      )}
      <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk'", letterSpacing: '-0.02em' }}>
        {data.titleLead && <>{data.titleLead} </>}
        {data.titleAccent && <span className="oak-living-text">{data.titleAccent}</span>}
        {data.titleTail && <>{data.titleTail}</>}
      </h2>
      {data.description && (
        <p className="text-lg text-[var(--color-text-muted)] leading-relaxed mt-5">{data.description}</p>
      )}
    </Reveal>
  );
};

// ─────────────────────────────────────────────────────────────────
// Animated stat tile
// ─────────────────────────────────────────────────────────────────
const StatTile: React.FC<{ stat: HomepageStat; index: number }> = ({ stat, index }) => {
  const { num, suffix, isNumeric } = splitStat(stat.value);
  const { ref, value } = useCountUpOnVisible(num);
  const accent = featureAccents[index % featureAccents.length];
  const display = isNumeric
    ? `${num >= 100 ? Math.round(value) : value.toFixed(value < 10 ? 1 : 0)}${suffix}`
    : stat.value;
  return (
    <div
      ref={ref}
      className="card oak-tilt p-7 text-center group cursor-default"
      style={{ borderColor: accent.ring, background: 'var(--color-surface-2)' }}
    >
      <div
        className="text-5xl md:text-6xl font-extrabold mb-2 leading-none transition-transform duration-500 group-hover:scale-105"
        style={{ fontFamily: "'Cabinet Grotesk'", color: accent.tint, letterSpacing: '-0.02em' }}
      >
        {display}
      </div>
      <div className="text-sm font-medium text-[var(--color-text-muted)] tracking-wide uppercase">
        {stat.label}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Feature card (mouse-tracked spotlight + tilt)
// ─────────────────────────────────────────────────────────────────
const FeatureCard: React.FC<{ feature: HomepageFeature; index: number }> = ({ feature, index }) => {
  const Cmp = iconMap[feature.icon] || GraduationCap;
  const accent = featureAccents[index % featureAccents.length];
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);
  return (
    <div
      ref={ref}
      className="card oak-spotlight oak-tilt p-7 h-full flex flex-col group cursor-default"
      style={{ borderColor: accent.ring, background: 'var(--color-surface-2)' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: accent.bg, color: accent.tint }}
      >
        <Cmp className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-2">{feature.title}</h3>
      <p className="text-[var(--color-text-muted)] leading-relaxed flex-1">{feature.description}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Marquee strip (driven by props)
// ─────────────────────────────────────────────────────────────────
const MarqueeStrip: React.FC<{ items: HomepageMarqueeItem[] }> = ({ items }) => {
  if (!items.length) return null;
  const sequence = [...items, ...items];
  return (
    <div
      className="relative overflow-hidden border-y"
      style={{
        background: 'linear-gradient(90deg, #fff5d6 0%, #fefae0 50%, #ffe9b5 100%)',
        borderColor: 'color-mix(in oklch, var(--oak-gold, #ddb957) 25%, transparent)',
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10" style={{ background: 'linear-gradient(90deg, #fff5d6, transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10" style={{ background: 'linear-gradient(270deg, #ffe9b5, transparent)' }} />
      <div className="oak-marquee py-5" style={{ color: '#7a5b15' }}>
        {sequence.map((it, i) => (
          <div key={`${it.id}-${i}`} className="oak-marquee-item">
            <Icon name={it.icon} className="w-4 h-4" />
            <span>{it.label}</span>
            <span className="oak-marquee-bullet" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Campus life bento (driven by props)
// ─────────────────────────────────────────────────────────────────
const CampusBento: React.FC<{ items: HomepageBentoItem[] }> = ({ items }) => {
  if (!items.length) return null;
  return (
    <div className="oak-bento">
      {items.map((it, i) => (
        <Reveal key={it.id || i} delay={(i % 4) as 0 | 1 | 2 | 3} className={`oak-bento-item oak-bento-${it.size}`}>
          {it.type === 'image' ? (
            <img src={it.src} alt={it.alt} loading="lazy" />
          ) : (
            <video src={it.src} muted loop playsInline autoPlay />
          )}
          {it.caption && (
            <div className="oak-bento-overlay">
              <div className="flex items-center gap-2">
                <GalleryHorizontalEnd className="w-4 h-4" />
                <span>{it.caption}</span>
              </div>
            </div>
          )}
        </Reveal>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main HomePage
// ─────────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLElement | null>(null);

  // Hero parallax (mouse-tracked CSS vars)
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

  // Fetch from API (graceful merge with defaults)
  useEffect(() => {
    const fetchHomepage = async () => {
      try {
        const response = await api.get(API.HOMEPAGE);
        const result = response.data;
        if (result?.success && result.data) {
          setContent(mergeHomepageContent(result.data));
        }
      } catch (error) {
        console.error('Error fetching homepage content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomepage();
  }, []);

  // Smart hero title split — bold the last 2-3 words with gradient
  const renderHeroTitle = (title: string) => {
    const parts = title.split(' ');
    if (parts.length < 3) return <span className="oak-living-text-hero">{title}</span>;
    const lead = parts.slice(0, -3).join(' ');
    const tail = parts.slice(-3).join(' ');
    return (
      <>
        <span className="block">{lead}</span>
        <span className="oak-living-text-hero block">{tail}</span>
      </>
    );
  };

  // Smart CTA title split — gradient on last 2 words
  const renderCTATitle = (title: string) => {
    const parts = title.split(' ');
    if (parts.length < 3) return <span className="oak-living-text">{title}</span>;
    return (
      <>
        {parts.slice(0, -2).join(' ')}{' '}
        <span className="oak-living-text">{parts.slice(-2).join(' ')}</span>
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center oak-mesh-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 20%, transparent)' }} />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--oak-olive)] animate-spin" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Préparation de votre expérience…</p>
        </div>
      </div>
    );
  }

  const { hero, marquee, statsSection, stats, featuresSection, features, platformSection, platform, bentoSection, bento, newsSection, news, testimonialsSection, testimonials, cta } = content;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════
          HERO — cinematic video + parallax + animated mesh + glass
          ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative text-white section overflow-hidden" style={{ minHeight: 'min(92vh, 880px)' }}>
        <video autoPlay loop muted playsInline poster={hero.posterSrc} className="absolute inset-0 w-full h-full object-cover">
          <source src={hero.videoSrc} type="video/mp4" />
        </video>

        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(20,40,12,0.35) 0%, rgba(10,18,6,0.78) 65%, rgba(8,14,4,0.92) 100%)',
        }} />
        <div className="absolute inset-0 mix-blend-soft-light opacity-70" style={{
          background: 'linear-gradient(135deg, rgba(170,194,64,0.35) 0%, transparent 35%, rgba(255,226,173,0.30) 100%)',
        }} />

        <div className="oak-blob oak-blob-olive oak-blob-delay-1 oak-parallax-deep" style={{ width: 480, height: 480, top: '-12%', left: '-8%' }} />
        <div className="oak-blob oak-blob-peach oak-blob-delay-2 oak-parallax" style={{ width: 380, height: 380, top: '40%', right: '-6%' }} />
        <div className="oak-blob oak-blob-chartreuse oak-blob-delay-3 oak-parallax-soft" style={{ width: 280, height: 280, bottom: '-8%', left: '38%' }} />

        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative section-content py-24 md:py-32 lg:py-36">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left: copy */}
            <div className="lg:col-span-7 oak-parallax-soft">
              {hero.eyebrow && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 oak-glass">
                  <span className="oak-pulse-ring inline-flex w-2 h-2 rounded-full" style={{ background: '#aac240' }} aria-hidden />
                  <span className="text-xs font-semibold tracking-wider uppercase text-white/95">{hero.eyebrow}</span>
                </div>
              )}

              <h1
                className="font-extrabold leading-[1.05] tracking-tight mb-6 oak-parallax"
                style={{ fontFamily: "'Cabinet Grotesk', 'Satoshi', sans-serif", fontSize: 'clamp(2.4rem, 5.6vw, 4.8rem)', letterSpacing: '-0.025em' }}
              >
                {renderHeroTitle(hero.title)}
              </h1>

              <p className="text-white/85 mb-8 leading-relaxed max-w-2xl oak-parallax-soft" style={{ fontSize: 'clamp(1.05rem, 1.4vw, 1.25rem)' }}>
                {hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 oak-parallax-soft">
                <Link
                  to={hero.primaryButtonLink || '/admissions'}
                  className="oak-shine inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base"
                  style={{
                    background: 'linear-gradient(135deg, #c9dba8 0%, #aac240 60%, #8aa02f 100%)',
                    color: '#1a1a1a',
                    boxShadow: '0 14px 32px rgba(140, 170, 60, 0.45)',
                  }}
                >
                  <Calendar className="w-5 h-5" />
                  {hero.primaryButtonText}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to={hero.secondaryButtonLink || '/programs'}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base oak-glass text-white"
                >
                  <PlayCircle className="w-5 h-5" />
                  {hero.secondaryButtonText}
                </Link>
              </div>

              {/* Trust line */}
              {hero.trustItems?.length > 0 && (
                <div className="mt-10 flex items-center gap-6 flex-wrap oak-parallax-soft">
                  {hero.trustItems.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-2 text-white/80 text-sm">
                      {i > 0 && <div className="hidden sm:block w-px h-5 bg-white/25 mr-3" />}
                      <Icon name={t.icon} className="w-4 h-4" />
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: floating stats glass card */}
            <div className="lg:col-span-5 oak-parallax">
              <div className="oak-glass rounded-3xl p-6 md:p-7 oak-float-slow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center oak-ring-rotate" style={{ background: '#fff' }}>
                    <GraduationCap className="w-6 h-6 text-[var(--oak-olive)]" />
                  </div>
                  <div>
                    <div className="text-white font-semibold tracking-tight text-lg">{hero.floatingCardTitle}</div>
                    <div className="text-white/70 text-xs uppercase tracking-widest">{hero.floatingCardSubtitle}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {stats.slice(0, 4).map((s, i) => (
                    <div key={s.id || i} className="rounded-2xl p-4 oak-glass-dark">
                      <div className="text-2xl md:text-3xl font-extrabold leading-none" style={{ fontFamily: "'Cabinet Grotesk'", color: '#eff3a2' }}>
                        {s.value}
                      </div>
                      <div className="text-white/75 text-xs mt-2 leading-snug">{s.label}</div>
                    </div>
                  ))}
                </div>

                {(hero.floatingCardFooterText || hero.floatingCardCTAText) && (
                  <div className="mt-5 pt-5 border-t border-white/15 flex items-center justify-between gap-3">
                    {hero.floatingCardFooterText && (
                      <div className="text-white/85 text-sm">{hero.floatingCardFooterText}</div>
                    )}
                    {hero.floatingCardCTAText && (
                      <Link to={hero.floatingCardCTALink || '/admissions'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#eff3a2] oak-magnetic-link">
                        {hero.floatingCardCTAText}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-10 hidden md:flex flex-col items-center gap-2 text-white/70">
          <span className="text-[10px] uppercase tracking-[0.3em]">Découvrir</span>
          <div className="oak-scroll-cue"><ArrowDown className="w-5 h-5" /></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--color-bg) 0%, transparent 100%)' }} />
      </section>

      {/* MARQUEE */}
      <MarqueeStrip items={marquee} />

      {/* STATS */}
      {stats.length > 0 && (
        <section className="py-20 section relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: 'var(--color-bg)' }} />
          <div className="oak-blob oak-blob-sage absolute -z-10 opacity-40" style={{ width: 320, height: 320, top: '-10%', right: '5%' }} />
          <div className="section-content">
            <SectionHeader data={statsSection} className="mb-12" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, i) => (
                <Reveal key={stat.id || i} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <StatTile stat={stat} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURES */}
      {features.length > 0 && (
        <section className="py-24 section relative overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="oak-blob oak-blob-chartreuse absolute opacity-40 -z-0" style={{ width: 380, height: 380, top: '-10%', left: '-6%' }} />
          <div className="oak-blob oak-blob-peach absolute opacity-30 -z-0" style={{ width: 280, height: 280, bottom: '-6%', right: '-4%' }} />
          <div className="section-content relative z-10">
            <SectionHeader data={featuresSection} className="mb-16" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature, i) => (
                <Reveal key={feature.id || i} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <FeatureCard feature={feature} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PLATFORM */}
      {platform.length > 0 && (
        <section className="py-24 section relative overflow-hidden">
          <div className="section-content">
            <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
              <Reveal className="lg:col-span-7">
                {platformSection.eyebrow && (
                  <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak-olive)' }}>
                    {platformSection.eyebrow}
                  </span>
                )}
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk'", letterSpacing: '-0.02em' }}>
                  {platformSection.titleLead && <>{platformSection.titleLead} </>}
                  {platformSection.titleAccent && <span className="oak-living-text">{platformSection.titleAccent}</span>}
                  {platformSection.titleTail && <>{platformSection.titleTail}</>}
                </h2>
              </Reveal>
              {platformSection.description && (
                <Reveal delay={1} className="lg:col-span-5 text-[var(--color-text-muted)]">
                  <p className="leading-relaxed">{platformSection.description}</p>
                </Reveal>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {platform.map((p, i) => {
                const Cmp = iconMap[p.icon] || Sparkles;
                const a = platformAccentMap[p.accent] || platformAccentMap.student;
                return (
                  <Reveal key={p.id || p.tag} delay={(i % 4) as 0 | 1 | 2 | 3}>
                    <div className="card oak-tilt p-6 h-full flex flex-col gap-4 group cursor-default">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                          style={{ background: a.bg, color: a.tint }}
                        >
                          <Cmp className="w-6 h-6" />
                        </div>
                        <span
                          className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md"
                          style={{ background: a.bg, color: a.tint, border: `1px solid color-mix(in oklch, ${a.tint} 25%, transparent)` }}
                        >
                          {p.tag}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight">{p.role}</h3>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Espace dédié, sécurisé, en temps réel.</p>
                      </div>
                      <ul className="space-y-2 mt-1 flex-1">
                        {p.items.map((it) => (
                          <li key={it} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.tint }} />
                            {it}
                          </li>
                        ))}
                      </ul>
                      <Link to={p.linkTo || '/login'} className="oak-magnetic-link mt-2 text-sm" style={{ color: a.tint }}>
                        {p.linkLabel || 'Se connecter'}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CAMPUS LIFE BENTO */}
      {bento.length > 0 && (
        <section className="py-24 section relative overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="section-content">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
              <Reveal>
                {bentoSection.eyebrow && (
                  <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak-olive)' }}>
                    {bentoSection.eyebrow}
                  </span>
                )}
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl" style={{ fontFamily: "'Cabinet Grotesk'", letterSpacing: '-0.02em' }}>
                  {bentoSection.titleLead && <>{bentoSection.titleLead} </>}
                  {bentoSection.titleAccent && <span className="oak-living-text">{bentoSection.titleAccent}</span>}
                  {bentoSection.titleTail && <>{bentoSection.titleTail}</>}
                </h2>
              </Reveal>
              {bentoSection.ctaText && (
                <Reveal delay={1}>
                  <Link to={bentoSection.ctaLink || '/campus-life'} className="oak-magnetic-link text-[var(--oak-olive)]" style={{ color: 'var(--oak-olive)' }}>
                    {bentoSection.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Reveal>
              )}
            </div>
            <CampusBento items={bento} />
          </div>
        </section>
      )}

      {/* NEWS */}
      {news.length > 0 && (
        <section className="py-24 section relative">
          <div className="section-content">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <Reveal>
                {newsSection.eyebrow && (
                  <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: 'var(--oak-olive)' }}>
                    {newsSection.eyebrow}
                  </span>
                )}
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk'", letterSpacing: '-0.02em' }}>
                  {newsSection.titleLead && <>{newsSection.titleLead} </>}
                  {newsSection.titleAccent && <span className="oak-living-text">{newsSection.titleAccent}</span>}
                  {newsSection.titleTail && <>{newsSection.titleTail}</>}
                </h2>
              </Reveal>
              {newsSection.ctaText && (
                <Reveal delay={1}>
                  <Link to={newsSection.ctaLink || '/campus-life'} className="oak-magnetic-link" style={{ color: 'var(--oak-olive)' }}>
                    {newsSection.ctaText}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Reveal>
              )}
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {news[0] && (
                <Reveal className="lg:col-span-7">
                  <article className="card oak-tilt overflow-hidden h-full flex flex-col group cursor-pointer" style={{ minHeight: 400 }}>
                    <div className="relative h-64 overflow-hidden" style={{ background: 'linear-gradient(135deg, #c9dba8 0%, #aac240 60%, #ffe2ad 100%)' }}>
                      {news[0].image && (
                        <img src={news[0].image} alt={news[0].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      )}
                      <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: '#fff', color: 'var(--oak-olive)' }}>
                        À la une
                      </span>
                    </div>
                    <div className="p-7 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-3">
                        <Calendar className="w-4 h-4" />
                        {news[0].date}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 group-hover:text-[var(--oak-olive)] transition-colors">{news[0].title}</h3>
                      <p className="text-[var(--color-text-muted)] leading-relaxed flex-1">{news[0].excerpt}</p>
                      <span className="oak-magnetic-link mt-5 self-start" style={{ color: 'var(--oak-olive)' }}>
                        Lire l'article
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </article>
                </Reveal>
              )}

              <div className="lg:col-span-5 flex flex-col gap-5">
                {news.slice(1, 4).map((item, i) => (
                  <Reveal key={item.id || i} delay={(i + 1) as 1 | 2 | 3}>
                    <article className="card oak-spotlight p-6 group cursor-pointer flex gap-5 items-start">
                      <div
                        className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center"
                        style={{ background: 'color-mix(in oklch, var(--oak-olive) 12%, white)', color: 'var(--oak-olive)' }}
                        aria-hidden
                      >
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--color-text-muted)] mb-1">{item.date}</div>
                        <h3 className="text-lg font-semibold tracking-tight mb-1.5 group-hover:text-[var(--oak-olive)] transition-colors line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{item.excerpt}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--oak-olive)] group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                    </article>
                  </Reveal>
                ))}

                {news.length <= 1 && (
                  <div className="card p-6 text-center text-[var(--color-text-muted)]">Plus d'actualités à venir bientôt.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-24 section relative overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="oak-blob oak-blob-olive absolute opacity-25 -z-0" style={{ width: 400, height: 400, top: '20%', left: '-10%' }} />
          <div className="oak-blob oak-blob-gold absolute opacity-25 -z-0" style={{ width: 320, height: 320, bottom: '10%', right: '-8%' }} />
          <div className="section-content relative z-10">
            <SectionHeader data={testimonialsSection} className="mb-16" />
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <Reveal key={t.id || i} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <figure
                    className="card p-7 h-full flex flex-col gap-5 oak-tilt relative"
                    style={{ borderColor: `color-mix(in oklch, ${t.tint} 25%, transparent)`, background: 'var(--color-surface-2)' }}
                  >
                    <Quote className="absolute top-6 right-6 w-14 h-14 opacity-15" style={{ color: t.tint }} aria-hidden />
                    <div className="flex gap-1" aria-hidden>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4" style={{ color: t.tint, fill: t.tint }} />
                      ))}
                    </div>
                    <blockquote
                      className="text-lg leading-relaxed text-[var(--color-text)] flex-1"
                      style={{ fontFamily: "'Cabinet Grotesk'", fontWeight: 600, letterSpacing: '-0.01em' }}
                    >
                      « {t.quote} »
                    </blockquote>
                    <figcaption className="flex items-center gap-3 mt-2">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: t.tint }} aria-hidden>
                        {t.author.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--color-text)]">{t.author}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{t.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 section relative overflow-hidden">
        <div className="absolute inset-0 -z-10 oak-mesh-bg" />
        <div className="oak-blob oak-blob-olive opacity-40 absolute" style={{ width: 360, height: 360, top: '-10%', left: '12%' }} />
        <div className="oak-blob oak-blob-peach opacity-40 absolute" style={{ width: 320, height: 320, bottom: '-12%', right: '10%' }} />

        <div className="section-content-narrow text-center relative z-10">
          {cta.eyebrow && (
            <Reveal>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-white/70 backdrop-blur-sm border"
                style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 28%, transparent)' }}
              >
                <Sparkles className="w-4 h-4" style={{ color: 'var(--oak-olive)' }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--oak-olive)' }}>
                  {cta.eyebrow}
                </span>
              </div>
            </Reveal>
          )}

          <Reveal delay={1}>
            <h2
              className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-[1.05]"
              style={{ fontFamily: "'Cabinet Grotesk'", letterSpacing: '-0.025em', color: 'var(--oak-dark)' }}
            >
              {renderCTATitle(cta.title)}
            </h2>
          </Reveal>

          <Reveal delay={2}>
            <p className="text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: 'color-mix(in oklch, var(--oak-dark) 80%, transparent)' }}>
              {cta.description}
            </p>
          </Reveal>

          <Reveal delay={3}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={cta.primaryButtonLink || '/admissions'}
                className="oak-shine inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base"
                style={{
                  background: 'linear-gradient(135deg, var(--oak-dark) 0%, #2a2f23 100%)',
                  color: '#eff3a2',
                  boxShadow: '0 16px 36px rgba(20, 30, 12, 0.35)',
                }}
              >
                <Calendar className="w-5 h-5" />
                {cta.primaryButtonText}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={cta.secondaryButtonLink || '/programs'}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-white/80 hover:bg-white border-2 transition-colors"
                style={{ borderColor: 'var(--oak-olive)', color: 'var(--oak-dark)' }}
              >
                {cta.secondaryButtonText}
              </Link>
            </div>
          </Reveal>

          {cta.badges?.length > 0 && (
            <Reveal delay={4}>
              <div
                className="mt-12 flex items-center justify-center gap-8 flex-wrap text-sm font-medium"
                style={{ color: 'color-mix(in oklch, var(--oak-dark) 70%, transparent)' }}
              >
                {cta.badges.map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <Icon name={b.icon} className="w-4 h-4" />
                    {b.label}
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
