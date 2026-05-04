import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Users, Calendar, Trophy, Music, Palette, BookOpen, Heart,
  ChevronLeft, ChevronRight, MapPin, Clock, Phone,
  Sparkles, Camera, Star, PlayCircle, School,
  Leaf, Bus, ShieldCheck, Shield, GraduationCap, Award, Lightbulb,
  Compass, Quote, GalleryHorizontalEnd, Mail, ArrowRight, ArrowDown,
  CheckCircle, FileText, UserPlus, Zap, Target,
} from 'lucide-react';
import { api } from '../../lib/api';
import { API } from '../../lib/apiRoutes';
import { Reveal, LivingHero, LivingCTA, MarqueeStrip, SectionTitle, featureAccents } from '../../components/public/living';
import {
  DEFAULT_CAMPUS_LIFE, mergeCampusLifeContent,
  type CampusLifeContent, type SectionHeading,
} from '../../lib/pagesDefaults';

const iconMap: Record<string, React.ComponentType<any>> = {
  Users, Calendar, Trophy, Music, Palette, BookOpen, Heart, MapPin, Clock,
  Phone, Sparkles, Camera, Star, PlayCircle, School, Leaf, Bus, ShieldCheck,
  Shield, GraduationCap, Award, Lightbulb, Compass, Quote, GalleryHorizontalEnd,
  Mail, ArrowRight, ArrowDown, CheckCircle, FileText, UserPlus, Zap, Target,
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

const CampusLifePage: React.FC = () => {
  const [content, setContent] = useState<CampusLifeContent>(DEFAULT_CAMPUS_LIFE);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API.PAGES('campusLife'));
        if (!cancelled && res.data?.success && res.data.data) {
          setContent(mergeCampusLifeContent(res.data.data));
        }
      } catch (e) {
        console.error('Erreur chargement vie du campus:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (currentImageIndex >= content.gallery.length && content.gallery.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [content.gallery.length, currentImageIndex]);

  const nextImage = () => {
    if (content.gallery.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % content.gallery.length);
  };
  const prevImage = () => {
    if (content.gallery.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + content.gallery.length) % content.gallery.length);
  };

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
    hero, marquee, gallerySection, gallery,
    organizationsSection, organizations,
    eventsSection, events,
    facilitiesSection, facilities,
    servicesSection, services,
    cta,
  } = content;

  const ctaSecondary = (cta.secondaryButtonText || cta.secondaryButtonLink)
    ? {
        label: cta.secondaryButtonText,
        to: cta.secondaryButtonLink?.startsWith('tel:') || cta.secondaryButtonLink?.startsWith('mailto:') ? '#' : (cta.secondaryButtonLink || '#'),
        href: cta.secondaryButtonLink?.startsWith('tel:') || cta.secondaryButtonLink?.startsWith('mailto:') ? cta.secondaryButtonLink : undefined,
        icon: <PlayCircle className="w-5 h-5" />,
      }
    : undefined;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-primary)]">
      {/* Hero */}
      <LivingHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        primary={{ label: hero.primaryButtonText, to: hero.primaryButtonLink || '#gallery', icon: <Camera className="w-5 h-5" /> }}
        secondary={{ label: hero.secondaryButtonText, to: hero.secondaryButtonLink || '#events', icon: <Calendar className="w-5 h-5" /> }}
        trust={hero.trustItems.map((t) => ({ icon: renderIcon(t.icon), label: t.label }))}
        videoSrc={hero.videoSrc}
        poster={hero.posterSrc}
        scrollCueTarget="gallery"
      />

      {/* Marquee */}
      {marquee.length > 0 && (
        <MarqueeStrip items={marquee.map((m) => ({ icon: renderIcon(m.icon), label: m.label }))} />
      )}

      {/* Gallery */}
      <section className="py-24 bg-[var(--color-bg-primary)] section" id="gallery">
        <div className="section-content">
          <Reveal className="mb-12">
            <SectionHeader data={gallerySection} />
          </Reveal>

          <Reveal delay={1}>
            <div className="relative max-w-5xl mx-auto px-4 md:px-6">
              {gallery.length > 0 && gallery[currentImageIndex] ? (
                <>
                  <div className="aspect-video w-full max-h-[420px] md:max-h-[520px] rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)] oak-spotlight"
                    style={{ border: '1px solid color-mix(in oklch, var(--oak-olive) 15%, transparent)' }}>
                    {gallery[currentImageIndex].type === 'video' ? (
                      <video key={gallery[currentImageIndex].src} src={gallery[currentImageIndex].src} controls autoPlay muted loop className="w-full h-full object-cover">
                        Votre navigateur ne supporte pas la vidéo.
                      </video>
                    ) : (
                      <img src={gallery[currentImageIndex].src} alt={gallery[currentImageIndex].alt} className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder-campus.jpg'; }} />
                    )}

                    {gallery.length > 1 && (
                      <>
                        <button onClick={prevImage}
                          className="absolute left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg hover:scale-110">
                          <ChevronLeft className="w-6 h-6 text-[var(--oak-dark)]" />
                        </button>
                        <button onClick={nextImage}
                          className="absolute right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg hover:scale-110">
                          <ChevronRight className="w-6 h-6 text-[var(--oak-dark)]" />
                        </button>
                      </>
                    )}
                  </div>

                  {gallery.length > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {gallery.map((_, index) => (
                        <button key={index} onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${index === currentImageIndex ? 'bg-[var(--oak-olive)] scale-125' : 'bg-[var(--color-border)] hover:bg-[var(--color-border-hover)]'}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)] flex items-center justify-center">
                  <p className="text-[var(--color-text-secondary)]">Aucune image disponible</p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Organizations */}
      {organizations.length > 0 && (
        <section className="py-24 relative overflow-hidden" style={{ background: 'color-mix(in oklch, var(--oak-sage) 10%, white)' }}>
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="oak-blob oak-blob-sage" style={{ top: '10%', right: '-10%' }} />
          </div>
          <div className="section-content relative z-10">
            <Reveal className="mb-16"><SectionHeader data={organizationsSection} /></Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org, index) => {
                const Icon = iconMap[org.icon] || Users;
                const accent = featureAccents[index % featureAccents.length];
                return (
                  <Reveal key={org.id} delay={(index % 3) as 0 | 1 | 2}>
                    <div className="card oak-tilt oak-spotlight p-6 h-full group"
                      style={{ borderColor: accent.ring, background: accent.bg }}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: accent.tint }}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{org.name}</h3>
                          <span className="text-sm font-medium" style={{ color: accent.tint }}>{org.members}</span>
                        </div>
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">{org.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      {events.length > 0 && (
        <section id="events" className="py-24 bg-[var(--color-bg-primary)] section">
          <div className="section-content">
            <Reveal className="mb-16"><SectionHeader data={eventsSection} /></Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event, index) => (
                <Reveal key={event.id} delay={(index % 2) as 0 | 1 | 2 | 3}>
                  <div className="card oak-spotlight p-6 group" style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 12%, transparent)' }}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in oklch, var(--oak-gold) 20%, white)' }}>
                        <Calendar className="w-7 h-7" style={{ color: 'var(--oak-gold)' }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">{event.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm mb-3">
                          <span className="flex items-center gap-1" style={{ color: 'var(--oak-olive)' }}>
                            <Clock className="w-4 h-4" />
                            {event.date}{event.time ? ` · ${event.time}` : ''}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Facilities */}
      {facilities.length > 0 && (
        <section className="py-24 relative overflow-hidden" style={{ background: 'color-mix(in oklch, var(--oak-peach) 10%, white)' }}>
          <div className="section-content">
            <Reveal className="mb-16"><SectionHeader data={facilitiesSection} /></Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility, index) => {
                const accent = featureAccents[index % featureAccents.length];
                return (
                  <Reveal key={facility.id} delay={(index % 3) as 0 | 1 | 2}>
                    <div className="card oak-spotlight p-6 h-full" style={{ borderColor: accent.ring, background: accent.bg }}>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{facility.name}</h3>
                      <p className="text-[var(--color-text-secondary)] text-sm mb-4">{facility.description}</p>
                      <ul className="space-y-2">
                        {facility.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent.tint }} />
                            <span className="text-[var(--color-text-muted)]">{feature}</span>
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

      {/* Services */}
      {services.length > 0 && (
        <section className="py-24 bg-[var(--color-bg-primary)] section">
          <div className="section-content">
            <Reveal className="mb-16"><SectionHeader data={servicesSection} /></Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => {
                const Icon = iconMap[service.icon] || Heart;
                const accent = featureAccents[index % featureAccents.length];
                return (
                  <Reveal key={service.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                    <div className="card oak-spotlight oak-tilt p-6 text-center h-full group" style={{ borderColor: accent.ring, background: accent.bg }}>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: accent.tint }}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{service.title}</h3>
                      <p className="text-[var(--color-text-secondary)] text-sm">{service.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <LivingCTA
        eyebrow={cta.eyebrow}
        title={cta.title}
        description={cta.description}
        primary={{
          label: cta.primaryButtonText,
          to: cta.primaryButtonLink?.startsWith('tel:') || cta.primaryButtonLink?.startsWith('mailto:') ? '#' : (cta.primaryButtonLink || '/admissions'),
          icon: <Phone className="w-5 h-5" />,
        }}
        secondary={ctaSecondary}
        badges={cta.badges.map((b) => ({ icon: renderIcon(b.icon), label: b.label }))}
      />
    </div>
  );
};

export default CampusLifePage;
