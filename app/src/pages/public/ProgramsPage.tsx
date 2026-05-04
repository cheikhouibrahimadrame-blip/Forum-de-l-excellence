import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { API } from '../../lib/apiRoutes';
import {
  BookOpen, Clock, Users, ChevronRight, Search, Filter,
  Sparkles, GraduationCap, Award, Lightbulb, PlayCircle, Phone, Star,
  MapPin, Trophy, Heart, Shield, Calendar, ShieldCheck, CheckCircle, Target,
  Zap, FileText, UserPlus, Mail, Compass, School, Leaf, Music, Palette, Camera, Bus,
  Quote, GalleryHorizontalEnd,
} from 'lucide-react';
import { Reveal, LivingHero, LivingCTA, MarqueeStrip, SectionTitle, featureAccents } from '../../components/public/living';
import {
  DEFAULT_PROGRAMS, mergeProgramsContent,
  type ProgramsContent, type ProgramItem, type SectionHeading,
} from '../../lib/pagesDefaults';

// ─────────────────────────────────────────────────────────────────
// Icon resolver (string -> lucide component)
// ─────────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<any>> = {
  BookOpen, Clock, Users, GraduationCap, Award, Lightbulb, Star, Sparkles,
  Heart, Shield, Calendar, MapPin, Trophy, ShieldCheck, CheckCircle, Target,
  Zap, FileText, UserPlus, Phone, Mail, Compass, School, Leaf, Music, Palette,
  Camera, Bus, Quote, GalleryHorizontalEnd, ChevronRight, PlayCircle,
};
const renderIcon = (name: string | undefined, className = 'w-4 h-4') => {
  const Cmp = (name && iconMap[name]) || Sparkles;
  return <Cmp className={className} />;
};

// Renders the 3-part "lead [accent] tail" headline with optional description
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

const ProgramsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState<ProgramsContent>(DEFAULT_PROGRAMS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API.PAGES('programs'));
        if (!cancelled && res.data?.success && res.data.data) {
          setContent(mergeProgramsContent(res.data.data));
        }
      } catch (e) {
        console.error('Erreur chargement programmes:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Highlight after returning from program detail page
  useEffect(() => {
    if (location.state?.fromProgramId) {
      const element = document.getElementById(`program-${location.state.fromProgramId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-[var(--color-primary-gold)]', 'ring-offset-2');
            window.history.replaceState({}, document.title);
          }, 2000);
        }, 100);
      } else {
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  const { hero, marquee, filters, programsSection, programs, cta } = content;

  const filteredPrograms: ProgramItem[] = programs.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase())
      || p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || p.department === selectedDepartment;
    const matchesLevel = selectedLevel === 'all' || p.level === selectedLevel;
    return matchesSearch && matchesDepartment && matchesLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 animate-spin mb-4"
            style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 20%, transparent)', borderTopColor: 'var(--oak-olive)' }}
          />
          <p className="text-[var(--color-text-secondary)]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-primary)]">
      {/* Hero */}
      <LivingHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        primary={{ label: hero.primaryButtonText, to: hero.primaryButtonLink || '#filters', icon: <BookOpen className="w-5 h-5" /> }}
        secondary={{ label: hero.secondaryButtonText, to: hero.secondaryButtonLink || '/admissions#contact', icon: <PlayCircle className="w-5 h-5" /> }}
        trust={hero.trustItems.map((t) => ({ icon: renderIcon(t.icon), label: t.label }))}
        videoSrc={hero.videoSrc}
        poster={hero.posterSrc}
        scrollCueTarget="filters"
      />

      {/* Marquee */}
      {marquee.length > 0 && (
        <MarqueeStrip items={marquee.map((m) => ({ icon: renderIcon(m.icon), label: m.label }))} />
      )}

      {/* Filters */}
      <section className="py-8 relative z-20" id="filters" style={{ background: 'var(--color-bg-card)' }}>
        <div className="section-content">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher un programme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 oak-spotlight"
                style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 15%, transparent)' }}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="input-field pl-10 appearance-none oak-spotlight"
                style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 15%, transparent)' }}
              >
                <option value="all">Toutes les sections</option>
                {filters.departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="input-field appearance-none oak-spotlight"
                style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 15%, transparent)' }}
              >
                <option value="all">Tous les cycles</option>
                {filters.levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Programs grid */}
      <section className="py-24 bg-[var(--color-bg-primary)] section relative overflow-hidden">
        <div className="oak-blob oak-blob-chartreuse absolute opacity-30 -z-0" style={{ width: 380, height: 380, top: '-10%', left: '-6%' }} />
        <div className="oak-blob oak-blob-peach absolute opacity-25 -z-0" style={{ width: 280, height: 280, bottom: '-6%', right: '-4%' }} />
        <div className="section-content relative z-10">
          <Reveal>
            <SectionHeader data={programsSection} className="mb-12" />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program, index) => {
              const nextProgram = filteredPrograms[index + 1];
              const Icon = iconMap[program.icon || 'BookOpen'] || BookOpen;
              const accent = featureAccents[index % featureAccents.length];

              return (
                <Reveal key={program.id} delay={(index % 3) as 0 | 1 | 2}>
                  <div
                    id={`program-${program.id}`}
                    className="card oak-spotlight oak-tilt overflow-hidden p-6 h-full group cursor-pointer transition-all duration-300 hover:shadow-xl"
                    style={{ borderColor: accent.ring, background: accent.bg }}
                    onClick={() => navigate(`/programmes/${program.id}`, { state: { fromProgramId: program.id } })}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: accent.tint }}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'color-mix(in oklch, var(--oak-gold) 20%, white)', color: '#7a5b15' }}
                      >
                        {program.level}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--oak-olive)] transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-3">{program.department}</p>
                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">{program.description}</p>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1" style={{ color: 'var(--oak-olive)' }}>
                        <Clock className="w-4 h-4" />
                        {program.duration}
                      </div>
                      <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                        <Users className="w-4 h-4" />
                        {program.credits} élèves max
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {program.features.map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-full text-xs"
                          style={{ background: 'color-mix(in oklch, var(--oak-sage) 20%, white)', color: 'var(--oak-olive)' }}>
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/programmes/${program.id}`, { state: { fromProgramId: program.id } }); }}
                        className="btn-secondary flex items-center justify-center gap-2 group/btn text-sm"
                      >
                        Voir les détails
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/admissions#contact'); }}
                          className="flex-1 btn-primary flex items-center justify-center text-sm"
                          style={{ background: 'var(--oak-olive)' }}
                        >
                          Plus d'infos
                        </button>
                        {nextProgram && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/programmes/${nextProgram.id}`, { state: { fromProgramId: nextProgram.id } });
                              setTimeout(() => {
                                document.getElementById(`program-${nextProgram.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className="px-3 btn-secondary flex items-center justify-center group/btn"
                            style={{ borderColor: accent.tint }}
                            title={`Aller à ${nextProgram.title}`}
                          >
                            <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {filteredPrograms.length === 0 && (
            <Reveal>
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ background: 'color-mix(in oklch, var(--oak-sage) 20%, white)' }}>
                  <Search className="w-10 h-10" style={{ color: 'var(--oak-olive)' }} />
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Aucun programme trouvé</h3>
                <p className="text-[var(--color-text-secondary)]">Essayez de modifier vos filtres de recherche.</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* CTA */}
      <LivingCTA
        eyebrow={cta.eyebrow}
        title={cta.title}
        description={cta.description}
        primary={{
          label: cta.primaryButtonText,
          to: cta.primaryButtonLink || '/admissions',
          icon: <Calendar className="w-5 h-5" />,
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
  );
};

export default ProgramsPage;
