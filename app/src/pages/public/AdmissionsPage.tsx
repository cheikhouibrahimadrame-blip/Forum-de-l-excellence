import type React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { API } from '../../lib/apiRoutes';
import { Reveal, LivingHero, LivingCTA, MarqueeStrip, SectionTitle, featureAccents } from '../../components/public/living';
import {
  Calendar, FileText, CheckCircle, Clock, Phone, Mail, MapPin, ChevronRight,
  UserPlus, ClipboardList, CreditCard, Sparkles, Heart, Shield, PlayCircle,
  Quote, Users, Trophy, Lightbulb, Award, GraduationCap, BookOpen, Star,
  Compass, School, Leaf, Music, Palette, Camera, Bus, ShieldCheck, Target,
  Zap, ArrowRight,
} from 'lucide-react';
import {
  DEFAULT_ADMISSIONS, mergeAdmissionsContent,
  type AdmissionsContent, type SectionHeading,
} from '../../lib/pagesDefaults';

const iconMap: Record<string, React.ComponentType<any>> = {
  UserPlus, ClipboardList, CheckCircle, CreditCard, Calendar, FileText, Clock,
  Phone, Mail, MapPin, ChevronRight, Sparkles, Heart, Shield, Users, Trophy,
  Lightbulb, Award, GraduationCap, BookOpen, Star, Compass, School, Leaf,
  Music, Palette, Camera, Bus, ShieldCheck, Target, Zap, ArrowRight,
  PlayCircle, Quote,
};
const renderIcon = (name: string | undefined, className = 'w-4 h-4') => {
  const Cmp = (name && iconMap[name]) || Sparkles;
  return <Cmp className={className} />;
};

const SectionHeader: React.FC<{ data: SectionHeading; className?: string }> = ({ data, className = '' }) => (
  <SectionTitle
    eyebrow={data.eyebrow}
    title={
      <>
        {data.titleLead && <>{data.titleLead} </>}
        {data.titleAccent && <span className="oak-living-text">{data.titleAccent}</span>}
        {data.titleTail && <>{data.titleTail}</>}
      </>
    }
    description={data.description || undefined}
    className={className}
  />
);

const AdmissionsPage: React.FC = () => {
  const location = useLocation();
  const [content, setContent] = useState<AdmissionsContent>(DEFAULT_ADMISSIONS);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API.PAGES('admissions'));
        if (!cancelled && res.data?.success && res.data.data) {
          setContent(mergeAdmissionsContent(res.data.data));
        }
      } catch (e) {
        console.error('Erreur chargement admissions:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.replace('#', '');
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 animate-spin mb-4"
            style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 20%, transparent)', borderTopColor: 'var(--oak-olive)' }} />
          <p className="text-[var(--color-text-secondary)]">Chargement...</p>
        </div>
      </div>
    );
  }

  const {
    hero, marquee,
    stepsSection, steps,
    requirementsSection, requirements,
    deadlinesSection, deadlines,
    contactSection,
    faqSection, faqs,
    cta,
  } = content;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-primary)]">
      {/* Hero */}
      <LivingHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        primary={{ label: hero.primaryButtonText, to: hero.primaryButtonLink || '#process', icon: <UserPlus className="w-5 h-5" /> }}
        secondary={{ label: hero.secondaryButtonText, to: hero.secondaryButtonLink || '#contact', icon: <Phone className="w-5 h-5" /> }}
        trust={hero.trustItems.map((t) => ({ icon: renderIcon(t.icon), label: t.label }))}
        videoSrc={hero.videoSrc}
        poster={hero.posterSrc}
        scrollCueTarget="process"
      />

      {/* Marquee */}
      {marquee.length > 0 && (
        <MarqueeStrip items={marquee.map((m) => ({ icon: renderIcon(m.icon), label: m.label }))} />
      )}

      {/* Steps Section */}
      {steps.length > 0 && (
        <section className="py-24 bg-[var(--color-bg-primary)] section" id="process">
          <div className="section-content">
            <Reveal className="mb-16"><SectionHeader data={stepsSection} /></Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {steps.map((step, index) => {
                const Icon = iconMap[step.icon] || UserPlus;
                const accent = featureAccents[index % featureAccents.length];
                return (
                  <Reveal key={step.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                    <div
                      className={`card oak-spotlight oak-tilt p-6 cursor-pointer transition-all h-full ${selectedStep === index ? 'ring-2' : ''}`}
                      style={{
                        borderColor: selectedStep === index ? accent.tint : accent.ring,
                        background: accent.bg,
                      }}
                      onClick={() => setSelectedStep(index)}
                    >
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl text-white oak-float" style={{ background: accent.tint }}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center mb-3">
                        {step.title}
                      </h3>
                      <p className="text-[var(--color-text-secondary)] text-center text-sm">
                        {step.description}
                      </p>
                      <div className="mt-4 flex justify-center">
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: accent.tint, color: '#fff' }}>
                          Étape {index + 1}
                        </span>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {steps[selectedStep] && (
              <Reveal>
                <div className="card oak-spotlight p-8 relative overflow-hidden"
                  style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 20%, transparent)' }}>
                  <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--oak-gold)' }} />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--oak-olive)' }}>
                        {selectedStep + 1}
                      </span>
                      {steps[selectedStep].title}
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {steps[selectedStep].details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'color-mix(in oklch, var(--oak-sage) 10%, white)' }}>
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--oak-olive)' }} />
                          <span className="text-[var(--color-text-secondary)]">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* Requirements */}
      {requirements.length > 0 && (
        <section className="py-24 relative overflow-hidden" id="requirements" style={{ background: 'color-mix(in oklch, var(--oak-sage) 8%, white)' }}>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="oak-blob oak-blob-sage" style={{ top: '20%', right: '-5%' }} />
          </div>
          <div className="section-content relative z-10">
            <Reveal className="mb-16"><SectionHeader data={requirementsSection} /></Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {requirements.map((req, index) => {
                const accent = featureAccents[index % featureAccents.length];
                return (
                  <Reveal key={req.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                    <div className="card oak-tilt oak-spotlight p-6 h-full" style={{ borderColor: accent.ring }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: accent.bg, color: accent.tint }}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{req.level}</h3>
                      </div>
                      <ul className="space-y-3">
                        {req.requirements.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: accent.bg }}>
                              <CheckCircle className="w-4 h-4" style={{ color: accent.tint }} />
                            </div>
                            <span className="text-[var(--color-text-secondary)]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Deadlines */}
      {deadlines.length > 0 && (
        <section className="py-24 bg-[var(--color-bg-primary)] section">
          <div className="section-content">
            <Reveal className="mb-16"><SectionHeader data={deadlinesSection} /></Reveal>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {deadlines.map((deadline, index) => (
                  <Reveal key={deadline.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                    <div className="card oak-spotlight p-6 flex items-center justify-between group" style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 15%, transparent)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center oak-pulse"
                          style={{ background: deadline.status === 'En cours' ? 'var(--oak-olive)' : 'color-mix(in oklch, var(--oak-sage) 30%, white)' }}>
                          <Calendar className="w-7 h-7" style={{ color: deadline.status === 'En cours' ? '#fff' : 'var(--oak-olive)' }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[var(--color-text-primary)] text-lg">{deadline.phase}</h4>
                          <p className="text-[var(--color-text-muted)]">{deadline.date}</p>
                        </div>
                      </div>
                      <span className="px-4 py-2 rounded-full text-sm font-medium"
                        style={{
                          background: deadline.status === 'En cours' ? 'color-mix(in oklch, var(--oak-olive) 15%, white)' : 'color-mix(in oklch, var(--oak-sage) 20%, white)',
                          color: deadline.status === 'En cours' ? 'var(--oak-olive)' : 'var(--color-text-secondary)',
                        }}>
                        {deadline.status}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact + FAQ */}
      <section className="py-24 relative overflow-hidden" id="contact" style={{ background: 'color-mix(in oklch, var(--oak-peach) 10%, white)' }}>
        <div className="section-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact */}
            <Reveal>
              <div>
                {contactSection.eyebrow && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
                    style={{ background: 'color-mix(in oklch, var(--oak-olive) 15%, white)', color: 'var(--oak-olive)' }}>
                    <Phone className="w-4 h-4" />
                    {contactSection.eyebrow}
                  </div>
                )}
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                  {contactSection.title}
                </h2>
                {contactSection.description && (
                  <p className="text-lg text-[var(--color-text-secondary)] mb-8">{contactSection.description}</p>
                )}
                <div className="space-y-4">
                  {contactSection.items.map((item) => (
                    <div key={item.id} className="card oak-spotlight p-4 flex items-center gap-4"
                      style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 12%, transparent)' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in oklch, var(--oak-olive) 15%, white)' }}>
                        {renderIcon(item.icon, 'w-6 h-6 text-[var(--oak-olive)]')}
                      </div>
                      <div>
                        <h4 className="font-medium text-[var(--color-text-primary)]">{item.label}</h4>
                        <p className="text-[var(--color-text-secondary)]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* FAQ */}
            {faqs.length > 0 && (
              <Reveal delay={1}>
                <div>
                  {faqSection.eyebrow && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
                      style={{ background: 'color-mix(in oklch, var(--oak-gold) 20%, white)', color: '#7a5b15' }}>
                      <Quote className="w-4 h-4" />
                      {faqSection.eyebrow}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
                    {faqSection.titleLead && <>{faqSection.titleLead} </>}
                    {faqSection.titleAccent && <span className="oak-living-text">{faqSection.titleAccent}</span>}
                    {faqSection.titleTail && <>{faqSection.titleTail}</>}
                  </h3>
                  <div className="space-y-3">
                    {faqs.map((faq, index) => (
                      <details key={faq.id} className="card oak-spotlight p-4 group" style={{ borderColor: 'color-mix(in oklch, var(--oak-sage) 20%, transparent)' }}>
                        <summary className="flex items-center justify-between cursor-pointer font-medium text-[var(--color-text-primary)] list-none">
                          <span className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ background: 'color-mix(in oklch, var(--oak-gold) 20%, white)', color: '#7a5b15' }}>
                              {index + 1}
                            </span>
                            {faq.question}
                          </span>
                          <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-open:rotate-90 transition-transform" />
                        </summary>
                        <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed pl-9">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div id="apply">
        <LivingCTA
          eyebrow={cta.eyebrow}
          title={cta.title}
          description={cta.description}
          primary={{
            label: cta.primaryButtonText,
            to: cta.primaryButtonLink?.startsWith('tel:') || cta.primaryButtonLink?.startsWith('mailto:') ? '#' : (cta.primaryButtonLink || '/login'),
            icon: <UserPlus className="w-5 h-5" />,
          }}
          secondary={(cta.secondaryButtonText || cta.secondaryButtonLink) ? {
            label: cta.secondaryButtonText,
            to: cta.secondaryButtonLink?.startsWith('tel:') || cta.secondaryButtonLink?.startsWith('mailto:') ? '#' : (cta.secondaryButtonLink || '#'),
            href: cta.secondaryButtonLink?.startsWith('tel:') || cta.secondaryButtonLink?.startsWith('mailto:') ? cta.secondaryButtonLink : undefined,
            icon: <Phone className="w-5 h-5" />,
          } : undefined}
          badges={cta.badges.map((b) => ({ icon: renderIcon(b.icon), label: b.label }))}
        />
      </div>
    </div>
  );
};

export default AdmissionsPage;
