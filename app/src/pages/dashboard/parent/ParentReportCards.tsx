import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  Award,
  TrendingUp,
  Eye,
  ArrowLeft,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { useBranding } from '../../../contexts/BrandingContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';
import {
  ReportCardA4,
  type ReportCardEntry,
} from '../../../components/reportcard';
import {
  loadStudentBulletin,
  computeAverage,
  getMention,
  type SavedReportCard,
} from '../../../lib/reportCardClient';

// ============================================================
// ParentReportCards
// ------------------------------------------------------------
// Vue READ-ONLY du bulletin pour les parents. Le parent choisit
// l'enfant + le trimestre, et voit exactement ce que l'admin
// (et le prof pour les appréciations) ont rempli — temps réel
// via /api/report-cards.
// ============================================================

type Child = {
  /** Student profile id (utilisé pour `/api/report-cards`). */
  studentId: string;
  /** Matricule scolaire (affichage uniquement). */
  studentMatricule?: string;
  firstName: string;
  lastName: string;
  className?: string;
};

type Trimester = {
  id: string;
  name: string;
  isActive: boolean;
};
type AcademicYear = {
  id: string;
  year: string;
  isActive: boolean;
  trimesters: Trimester[];
};

type Bulletin = {
  trimesterIndex: 1 | 2 | 3;
  trimesterLabel: string;
  academicYear: string;
  className: string;
  entries: ReportCardEntry[];
  gradeScale: 10 | 20;
  saved: SavedReportCard | null;
};

const trimesterLabel = (n: 1 | 2 | 3) =>
  n === 1
    ? '1er Trimestre'
    : n === 2
      ? '2ème Trimestre'
      : '3ème Trimestre — Bilan Annuel';

const fullName = (c: Child) => `${c.firstName} ${c.lastName}`.trim();

const ParentReportCards: React.FC = () => {
  const { branding } = useBranding();
  const refreshTick = useLiveRefresh(30000);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardHeaderRef, isVisible: cardHeaderVisible } = useScrollReveal();
  const { ref: tableRef, isVisible: tableVisible } = useScrollReveal();
  const { ref: commentsRef, isVisible: commentsVisible } = useScrollReveal();

  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');

  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showA4Preview, setShowA4Preview] = useState(false);

  // Charge les enfants liés au parent connecté.
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingChildren(true);
        setChildrenError('');
        const res = await api.get(API.PARENT_STUDENTS_MY);
        const data = res.data;
        const payload = data?.data?.students || data?.data || [];
        const normalized: Child[] = (Array.isArray(payload) ? payload : []).map(
          (item: any) => {
            const student = item.student || item;
            const user = student.user || item.user || {};
            const classInfo = student.class || {};
            return {
              studentId: String(student.id || item.id || ''),
              studentMatricule: student.studentId,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              className: classInfo.name || student.major,
            };
          },
        );
        setChildren(normalized);
        if (normalized.length > 0 && !selectedChildId) {
          setSelectedChildId(normalized[0].studentId);
        }
      } catch (err: any) {
        setChildrenError(
          err?.response?.data?.error ||
            err?.message ||
            'Impossible de charger la liste de vos enfants.',
        );
      } finally {
        setLoadingChildren(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charge l'année active.
  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get(API.ACADEMIC_YEARS);
        const payload = res.data;
        const years: AcademicYear[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        const active = years.find((y) => y.isActive) || years[0] || null;
        if (!active) return;
        setActiveYear(active);
        const sorted = [...active.trimesters].sort((a, b) => {
          const ai = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
          const bi = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
          return ai - bi;
        });
        const activeIndex = sorted.findIndex((t) => t.isActive);
        if (activeIndex >= 0) {
          setSelectedTrimester(((activeIndex + 1) as 1 | 2 | 3));
        }
      } catch {
        // optionnel
      }
    };
    run();
  }, []);

  const availableTrimesters = useMemo<(1 | 2 | 3)[]>(() => {
    if (!activeYear?.trimesters || activeYear.trimesters.length === 0) {
      return [1, 2, 3];
    }
    const sorted = [...activeYear.trimesters].sort((a, b) => {
      const ai = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
      const bi = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
      return ai - bi;
    });
    return sorted.slice(0, 3).map((_, i) => (i + 1) as 1 | 2 | 3);
  }, [activeYear]);

  const selectedChild = useMemo(
    () => children.find((c) => c.studentId === selectedChildId) || null,
    [children, selectedChildId],
  );

  // Charge le bulletin merged dès qu'on a (enfant, année, trimestre).
  useEffect(() => {
    if (!selectedChildId || !activeYear?.id) {
      setBulletin(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const merged = await loadStudentBulletin({
          studentId: selectedChildId,
          yearId: activeYear.id,
          trimester: selectedTrimester,
        });
        if (cancelled) return;
        setBulletin({
          trimesterIndex: selectedTrimester,
          trimesterLabel: trimesterLabel(selectedTrimester),
          academicYear: activeYear.year,
          className: merged.className || selectedChild?.className || '',
          entries: merged.entries,
          gradeScale: merged.saved?.gradeScale ?? 20,
          saved: merged.saved,
        });
      } catch (err: any) {
        if (cancelled) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Erreur lors du chargement du bulletin',
        );
        setBulletin(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    selectedChildId,
    activeYear?.id,
    activeYear?.year,
    selectedTrimester,
    selectedChild?.className,
    refreshTick,
  ]);

  const liveSummary = useMemo(() => {
    if (!bulletin) {
      return {
        gpaScaled: 0,
        mention: 'Insuffisant',
        matieres: 0,
      };
    }
    const onScale = computeAverage(bulletin.entries, bulletin.gradeScale);
    const on20 = computeAverage(bulletin.entries, 20);
    return {
      gpaScaled: onScale === null ? 0 : Number(onScale.toFixed(2)),
      mention: getMention(on20 ?? 0, 20),
      matieres: bulletin.entries.length,
    };
  }, [bulletin]);

  const isAnnual = bulletin?.trimesterIndex === 3;

  const handlePrint = () => {
    if (!bulletin) return;
    window.print();
  };

  const studentFullName = selectedChild ? fullName(selectedChild) : 'Élève';

  return (
    <>
      {bulletin && selectedChild && (
        <div className="rc-print-host" data-screen-hidden={!showA4Preview}>
          <ReportCardA4
            school={{
              name: branding.brand.name,
              address: branding.brand.address,
              phone: branding.brand.phone,
              email: branding.brand.email,
              principal: branding.brand.principal,
              logoUrl: branding.brand.logoUrl,
              year: branding.brand.year,
            }}
            student={{
              fullName: studentFullName,
              studentId: selectedChild.studentMatricule,
              className: bulletin.className,
            }}
            period={{
              trimester: bulletin.trimesterLabel,
              academicYear: bulletin.academicYear,
            }}
            entries={bulletin.entries}
            gradeScale={bulletin.gradeScale}
            isAnnual={isAnnual}
            generalAppreciation={bulletin.saved?.generalAppreciation || undefined}
            compositions={bulletin.saved?.compositions || undefined}
            decision={bulletin.saved?.decision || undefined}
            councilObservation={bulletin.saved?.councilObservation || undefined}
            attendance={bulletin.saved?.attendance || undefined}
            // editable = false par défaut → strictement lecture seule
          />
        </div>
      )}

      {showA4Preview && bulletin && (
        <div className="rc-preview-actions fixed top-4 right-4 z-50 flex gap-2 print:hidden">
          <button
            onClick={() => setShowA4Preview(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-md hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary-navy)] text-white shadow-md hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      )}

      {!showA4Preview && (
        <div className="section">
          <div className="section-content">
            <div className="space-y-8">
              <div
                ref={headerRef}
                className={`flex items-center justify-between gap-4 flex-wrap ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
              >
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                  Bulletins de mes enfants
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {children.length > 0 && (
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="input-field appearance-none bg-no-repeat bg-right pr-10"
                    >
                      {children.map((c) => (
                        <option key={c.studentId} value={c.studentId}>
                          {fullName(c)}
                          {c.className ? ` — ${c.className}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    value={selectedTrimester}
                    onChange={(e) =>
                      setSelectedTrimester(Number(e.target.value) as 1 | 2 | 3)
                    }
                    className="input-field appearance-none bg-no-repeat bg-right pr-10"
                  >
                    {availableTrimesters.map((n) => (
                      <option key={n} value={n}>
                        {trimesterLabel(n)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {childrenError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {childrenError}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loadingChildren && (
                <div className="card p-6 text-center text-[var(--color-text-secondary)]">
                  Chargement de vos enfants...
                </div>
              )}

              {!loadingChildren && children.length === 0 && (
                <div className="card p-8 text-center">
                  <Users className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--color-text-secondary)]">
                    Aucun enfant n'est actuellement rattaché à votre compte.
                    Contactez l'administration pour configurer le lien.
                  </p>
                </div>
              )}

              {loading && children.length > 0 && (
                <div className="card p-6 text-center text-[var(--color-text-secondary)]">
                  Chargement du bulletin...
                </div>
              )}

              {bulletin && !loading && selectedChild && (
                <>
                  <div
                    ref={cardHeaderRef}
                    className={`gradient-card rounded-2xl p-8 text-white ${cardHeaderVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  >
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          {studentFullName}
                        </h2>
                        <p className="text-white/80">
                          {bulletin.trimesterLabel} — Année{' '}
                          {bulletin.academicYear}
                          {bulletin.className ? ` — ${bulletin.className}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowA4Preview(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-[var(--color-primary-navy)] font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Aperçu A4
                        </button>
                        <button
                          onClick={handlePrint}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-[var(--color-primary-navy)] font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-sm"
                        >
                          <Printer className="w-4 h-4" />
                          Imprimer
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">
                          {liveSummary.gpaScaled.toFixed(2)}
                        </div>
                        <p className="text-sm text-white/80">
                          Moyenne /{bulletin.gradeScale}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">
                          {liveSummary.matieres}
                        </div>
                        <p className="text-sm text-white/80">Matières</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">
                          {liveSummary.mention}
                        </div>
                        <p className="text-sm text-white/80">Mention</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">
                          {bulletin.saved?.attendance?.absent ?? '-'}
                        </div>
                        <p className="text-sm text-white/80">Absences</p>
                      </div>
                    </div>
                  </div>

                  <div
                    ref={tableRef}
                    className={`card overflow-hidden ${tableVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
                  >
                    <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between gap-4 flex-wrap">
                      <h3 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                        <Award className="w-5 h-5 text-[var(--color-primary-navy)]" />
                        Détails des matières
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <TrendingUp className="w-4 h-4" />
                        Moyenne : {liveSummary.gpaScaled.toFixed(2)}/
                        {bulletin.gradeScale}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[var(--color-bg-secondary)]">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                              Matière
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                              Enseignant
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                              Note
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                              Coef.
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                              Appréciation
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {bulletin.entries.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-8 text-center text-[var(--color-text-muted)]"
                              >
                                Aucune note enregistrée pour ce trimestre.
                              </td>
                            </tr>
                          )}
                          {bulletin.entries.map((entry, index) => {
                            const max = entry.maxGrade ?? 20;
                            const display =
                              entry.grade === null ||
                              Number.isNaN(entry.grade as number)
                                ? '—'
                                : (entry.grade as number).toFixed(1);
                            return (
                              <tr
                                key={`${entry.subject}-${index}`}
                                className="hover:bg-[var(--color-bg-secondary)]"
                              >
                                <td className="px-6 py-4">
                                  <div className="font-medium text-[var(--color-text-primary)]">
                                    {entry.subject}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                  {entry.teacher || '-'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-semibold text-[var(--color-primary-navy)]">
                                    {display}/{max}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                  {entry.coefficient}
                                </td>
                                <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                  {entry.appreciation || (
                                    <span className="italic text-[var(--color-text-muted)]">
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div
                    ref={commentsRef}
                    className={`card p-6 ${commentsVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
                  >
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[var(--color-primary-navy)]" />
                      Appréciation générale & conseil
                    </h3>
                    <div className="space-y-4 text-[var(--color-text-secondary)]">
                      {bulletin.saved?.generalAppreciation ? (
                        <p className="whitespace-pre-line">
                          {bulletin.saved.generalAppreciation}
                        </p>
                      ) : (
                        <p className="italic text-[var(--color-text-muted)]">
                          Aucune appréciation générale enregistrée.
                        </p>
                      )}
                      {bulletin.saved?.councilObservation && (
                        <p>
                          <strong className="text-[var(--color-text-primary)]">
                            Observation du conseil :
                          </strong>{' '}
                          {bulletin.saved.councilObservation === 'congrats'
                            ? 'Félicitations'
                            : bulletin.saved.councilObservation ===
                                'encouragement'
                              ? 'Encouragement'
                              : bulletin.saved.councilObservation === 'honor'
                                ? "Tableau d'honneur"
                                : bulletin.saved.councilObservation ===
                                    'warning'
                                  ? 'Avertissement'
                                  : 'Blâme'}
                        </p>
                      )}
                      {isAnnual && bulletin.saved?.decision && (
                        <p>
                          <strong className="text-[var(--color-text-primary)]">
                            Décision du conseil :
                          </strong>{' '}
                          {bulletin.saved.decision === 'promoted'
                            ? 'Admis(e) en classe supérieure'
                            : bulletin.saved.decision === 'redoubling'
                              ? 'Autorisé(e) à redoubler'
                              : 'Exclusion'}
                        </p>
                      )}
                      {bulletin.saved?.attendance && (
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 text-center">
                            <div className="text-xl font-bold text-[var(--color-primary-navy)]">
                              {bulletin.saved.attendance.present ?? '-'}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              Présences
                            </div>
                          </div>
                          <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 text-center">
                            <div className="text-xl font-bold text-amber-600">
                              {bulletin.saved.attendance.absent ?? '-'}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              Absences
                            </div>
                          </div>
                          <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 text-center">
                            <div className="text-xl font-bold text-orange-600">
                              {bulletin.saved.attendance.late ?? '-'}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              Retards
                            </div>
                          </div>
                        </div>
                      )}
                      {bulletin.saved?.updatedAt && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Bulletin mis à jour le{' '}
                          {new Date(bulletin.saved.updatedAt).toLocaleString(
                            'fr-FR',
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentReportCards;
