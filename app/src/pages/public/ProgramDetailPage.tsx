import type React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Users, ChevronLeft, ChevronRight,
  CheckCircle, Target, Zap, ArrowLeft, Calendar, Phone,
  GraduationCap, Sparkles, Award, MapPin, Trophy, ShieldCheck,
  Star, Lightbulb, Heart, Shield, FileText, UserPlus, Mail,
  Compass, School, Leaf, Music, Palette, Camera, Bus, Quote,
  GalleryHorizontalEnd, PlayCircle,
} from 'lucide-react';
import { LivingHero, LivingCTA, Reveal } from '../../components/public/living';
import { api } from '../../lib/api';
import { API } from '../../lib/apiRoutes';
import {
  DEFAULT_PROGRAMS, mergeProgramsContent,
  type ProgramsContent, type ProgramItem,
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

const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState<ProgramsContent>(DEFAULT_PROGRAMS);
  const [loading, setLoading] = useState(true);

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

  const programs = content.programs;

  // Find by string id (NEW behaviour); fall back to numeric index for legacy URLs
  // like `/programmes/3` so external bookmarks don't break.
  let program: ProgramItem | undefined = programs.find((p) => p.id === id);
  if (!program && id && /^\d+$/.test(id)) {
    const numeric = parseInt(id, 10);
    program = programs[numeric - 1]; // legacy 1-based indices
  }

  const currentIndex = program ? programs.findIndex((p) => p.id === program!.id) : -1;
  const prevProgram = currentIndex > 0 ? programs[currentIndex - 1] : undefined;
  const nextProgram = currentIndex >= 0 && currentIndex < programs.length - 1
    ? programs[currentIndex + 1]
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 animate-spin mb-4"
            style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 20%, transparent)', borderTopColor: 'var(--oak-olive)' }}
          />
          <p className="text-[var(--color-text-secondary)]">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            Programme non trouvé
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Ce programme n'existe pas ou a été déplacé.
          </p>
          <button onClick={() => navigate('/programs')} className="btn-primary">
            Retour aux programmes
          </button>
        </div>
      </div>
    );
  }

  const objectives = program.objectives ?? [];
  const curriculum = program.curriculum ?? [];
  const teachingApproach = program.teachingApproach ?? '';
  const enrollment = program.enrollment ?? '';
  const price = program.price ?? '';

  // Build CTA from page-level cta but personalise the title/desc with the
  // current program; fall back to sane defaults if cta is missing.
  const pageCta = content.cta;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-primary)]">
      {/* ───────── Cinematic Living Hero ───────── */}
      <LivingHero
        eyebrow={`${program.level} · ${program.department}`}
        title={program.title}
        subtitle={program.description}
        primary={{ label: 'Demander des informations', to: '/admissions#contact', icon: <Calendar className="w-5 h-5" /> }}
        secondary={{ label: 'Tous les programmes', to: '/programs', icon: <GraduationCap className="w-5 h-5" /> }}
        trust={[
          { icon: <Clock className="w-4 h-4" />, label: program.duration },
          { icon: <Users className="w-4 h-4" />, label: `${program.credits} élèves max` },
          { icon: <Sparkles className="w-4 h-4" />, label: program.department },
        ]}
        scrollCueTarget="detail"
        minHeight="min(70vh, 640px)"
      />

      {/* Quick navigation row */}
      <div
        className="border-b"
        style={{ borderColor: 'color-mix(in oklch, var(--oak-olive) 12%, transparent)', background: 'var(--color-bg-card)' }}
      >
        <div className="section-content py-4 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => navigate('/programs')}
            className="oak-magnetic-link inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--oak-olive)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux programmes
          </button>
          <div className="flex gap-2 items-center">
            {prevProgram && (
              <button
                onClick={() => navigate(`/programmes/${prevProgram.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: 'color-mix(in oklch, var(--oak-olive) 10%, white)',
                  color: 'var(--oak-olive)',
                  border: '1px solid color-mix(in oklch, var(--oak-olive) 22%, transparent)',
                }}
                title={`Précédent : ${prevProgram.title}`}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
            {nextProgram && (
              <button
                onClick={() => navigate(`/programmes/${nextProgram.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white oak-shine"
                style={{ background: 'var(--oak-olive)' }}
                title={`Suivant : ${nextProgram.title}`}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <section id="detail" className="py-16 section relative overflow-hidden">
        <div className="oak-blob oak-blob-chartreuse absolute opacity-25 -z-0"
          style={{ width: 320, height: 320, top: '-8%', right: '-6%' }} />
        <div className="oak-blob oak-blob-peach absolute opacity-20 -z-0"
          style={{ width: 260, height: 260, bottom: '-6%', left: '-4%' }} />
        <div className="section-content relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Overview */}
              <Reveal>
                <div className="card oak-spotlight mb-8">
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                      À propos de ce programme
                    </h2>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                      {program.description}
                    </p>
                    {teachingApproach && (
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {teachingApproach}
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>

              {/* Objectives */}
              {objectives.length > 0 && (
                <Reveal delay={1}>
                  <div className="card oak-spotlight mb-8">
                    <div className="p-8">
                      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                        <Target className="w-6 h-6 text-[var(--color-primary-navy)]" />
                        Objectifs pédagogiques
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {objectives.map((objective, idx) => (
                          <div key={idx} className="flex gap-3">
                            <CheckCircle className="w-5 h-5 text-[var(--color-primary-gold)] flex-shrink-0 mt-0.5" />
                            <span className="text-[var(--color-text-secondary)]">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Curriculum */}
              {curriculum.length > 0 && (
                <Reveal delay={2}>
                  <div className="card oak-spotlight">
                    <div className="p-8">
                      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-[var(--color-primary-navy)]" />
                        Programme d'études
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {curriculum.map((subject, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-primary-navy)] mt-2 flex-shrink-0" />
                            <span className="text-[var(--color-text-secondary)]">{subject}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Reveal delay={1}>
                <div className="card oak-spotlight oak-tilt mb-8 sticky top-20">
                  <div className="p-8">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
                      Informations clés
                    </h3>

                    <div className="space-y-6">
                      {/* Duration */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-5 h-5 text-[var(--color-primary-navy)]" />
                          <span className="font-medium text-[var(--color-text-primary)]">Durée</span>
                        </div>
                        <p className="text-[var(--color-text-secondary)] ml-8">
                          {program.duration}
                        </p>
                      </div>

                      {/* Capacity */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-[var(--color-primary-navy)]" />
                          <span className="font-medium text-[var(--color-text-primary)]">Capacité</span>
                        </div>
                        <p className="text-[var(--color-text-secondary)] ml-8">
                          {program.credits} élèves par classe
                        </p>
                      </div>

                      {/* Features */}
                      {program.features.length > 0 && (
                        <div>
                          <span className="font-medium text-[var(--color-text-primary)] block mb-3">
                            Caractéristiques
                          </span>
                          <div className="space-y-2 ml-8">
                            {program.features.map((feature, idx) => (
                              <div
                                key={idx}
                                className="inline-block badge bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                              >
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {(enrollment || price) && (
                      <div className="border-t border-[var(--color-border)] pt-6 mt-6 space-y-3">
                        {enrollment && (
                          <p className="text-xs text-[var(--color-text-muted)]">{enrollment}</p>
                        )}
                        {price && (
                          <p className="text-xs text-[var(--color-text-muted)]">{price}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Living CTA — built from page CTA but personalised ───────── */}
      <LivingCTA
        eyebrow={pageCta.eyebrow}
        title={`Inscrivez votre enfant en ${program.level}`}
        description={pageCta.description}
        primary={{
          label: pageCta.primaryButtonText,
          to: pageCta.primaryButtonLink || '/admissions#contact',
          icon: <Calendar className="w-5 h-5" />,
        }}
        secondary={{
          label: pageCta.secondaryButtonText,
          to: pageCta.secondaryButtonLink?.startsWith('tel:') || pageCta.secondaryButtonLink?.startsWith('mailto:')
            ? '#'
            : (pageCta.secondaryButtonLink || '/programs'),
          href: pageCta.secondaryButtonLink?.startsWith('tel:') || pageCta.secondaryButtonLink?.startsWith('mailto:')
            ? pageCta.secondaryButtonLink
            : undefined,
          icon: <Phone className="w-5 h-5" />,
        }}
        badges={[
          ...(pageCta.badges || []).slice(0, 1).map((b) => ({ icon: renderIcon(b.icon), label: b.label })),
          { icon: <BookOpen className="w-4 h-4" />, label: `${curriculum.length || program.features.length} matières` },
          { icon: <Users className="w-4 h-4" />, label: `${program.credits} élèves max` },
        ]}
      />
    </div>
  );
};

export default ProgramDetailPage;
