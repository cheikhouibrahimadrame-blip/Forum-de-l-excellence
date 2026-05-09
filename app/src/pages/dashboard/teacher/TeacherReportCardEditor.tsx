import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  FileText,
  Eye,
  Printer,
  ArrowLeft,
  AlertCircle,
  Search,
  Save,
  MessageSquare,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useBranding } from '../../../contexts/BrandingContext';
import UserSelect, {
  type UserSelectOption,
} from '../../../components/forms/UserSelect';
import {
  ReportCardA4,
  type ReportCardEntry,
} from '../../../components/reportcard';
import {
  loadStudentBulletin,
  saveReportCard,
  computeAverage,
  type SavedReportCard,
} from '../../../lib/reportCardClient';

// ============================================================
// TeacherReportCardEditor
// ------------------------------------------------------------
// Le professeur peut UNIQUEMENT éditer les appréciations par
// matière (`entries[i].appreciation`). Tous les autres champs
// (notes, barème, coefficient, appréciation générale, conseil,
// présence, compositions, décision) sont en lecture seule —
// remplis par l'administration.
//
// Quand le prof appuie sur "Enregistrer", le backend fusionne
// uniquement les appréciations sur la version persistée et
// préserve le reste (cf. controller). L'élève / parent / admin
// voient donc instantanément les nouvelles appréciations sans
// rien perdre du contenu admin.
// ============================================================

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

const trimesterLabel = (n: 1 | 2 | 3) =>
  n === 1
    ? '1er Trimestre'
    : n === 2
      ? '2ème Trimestre'
      : '3ème Trimestre — Bilan Annuel';

const TeacherReportCardEditor: React.FC = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();

  // Sélection
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] =
    useState<UserSelectOption | null>(null);

  // Année / Trimestre
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);

  // Bulletin merged
  const [entries, setEntries] = useState<ReportCardEntry[]>([]);
  const [saved, setSaved] = useState<SavedReportCard | null>(null);
  const [className, setClassName] = useState('');

  // Etats UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState<
    null | { kind: 'ok' } | { kind: 'error'; message: string }
  >(null);

  // Preview A4
  const [showA4Preview, setShowA4Preview] = useState(false);

  // ------------------------------------------------------------
  // Année active + trimestre actif (idem AdminBulletins).
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // Charge le bulletin merged (notes + overlay admin) pour
  // (élève, année, trimestre). Appelé à chaque changement.
  // ------------------------------------------------------------
  const loadFor = useCallback(
    async (studentProfileId: string, yearId: string, trim: 1 | 2 | 3) => {
      setLoading(true);
      setError('');
      try {
        const merged = await loadStudentBulletin({
          studentId: studentProfileId,
          yearId,
          trimester: trim,
        });
        setEntries(merged.entries);
        setSaved(merged.saved);
        setClassName(merged.className);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Erreur lors du chargement des notes de l'élève.",
        );
        setEntries([]);
        setSaved(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedStudentId || !activeYear?.id) return;
    loadFor(selectedStudentId, activeYear.id, selectedTrimester);
  }, [selectedStudentId, activeYear?.id, selectedTrimester, loadFor]);

  const handleStudentChange = (value: string, user?: UserSelectOption) => {
    setSelectedStudentId(value);
    setSelectedStudent(user || null);
    setSavedFlash(null);
    if (!value) {
      setEntries([]);
      setSaved(null);
    }
  };

  // ------------------------------------------------------------
  // Mutation locale — uniquement l'appréciation par matière.
  // ------------------------------------------------------------
  const updateAppreciation = (index: number, value: string) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], appreciation: value };
      return next;
    });
  };

  // ------------------------------------------------------------
  // Sauvegarde via PUT /api/report-cards. Le backend filtre :
  // pour role TEACHER seules les appréciations sont conservées.
  // ------------------------------------------------------------
  const handleSave = async () => {
    if (!selectedStudentId || !activeYear?.id || saving) return;
    setSaving(true);
    setSavedFlash(null);
    try {
      const result = await saveReportCard({
        studentId: selectedStudentId,
        yearId: activeYear.id,
        trimester: selectedTrimester,
        entries,
      });
      if (result) setSaved(result);
      setSavedFlash({ kind: 'ok' });
      window.setTimeout(() => setSavedFlash(null), 2400);
    } catch (err: any) {
      setSavedFlash({
        kind: 'error',
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Échec de l'enregistrement",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (entries.length === 0) return;
    window.print();
  };

  // ------------------------------------------------------------
  // Calculs dérivés (live).
  // ------------------------------------------------------------
  const validEntries = useMemo(
    () => entries.filter((e) => e.grade !== null && !Number.isNaN(e.grade as number)),
    [entries],
  );
  const gradeScale = saved?.gradeScale ?? 20;
  const average = useMemo(
    () => computeAverage(entries, gradeScale),
    [entries, gradeScale],
  );

  const studentFullName = selectedStudent
    ? [selectedStudent.firstName, selectedStudent.lastName]
        .filter(Boolean)
        .join(' ')
        .trim()
    : '';

  const isAnnual = selectedTrimester === 3;

  return (
    <>
      {/* Host A4 — read-only complet (pas d'édition inline ici).
          Les appréciations sont éditées dans le tableau ci-dessous,
          et reflétées dans l'aperçu via la prop `entries`. */}
      {entries.length > 0 && (
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
              fullName: studentFullName || 'Élève',
              className,
            }}
            period={{
              trimester: trimesterLabel(selectedTrimester),
              academicYear: activeYear?.year,
            }}
            entries={entries}
            gradeScale={gradeScale}
            isAnnual={isAnnual}
            generalAppreciation={saved?.generalAppreciation || undefined}
            compositions={saved?.compositions || undefined}
            decision={saved?.decision || undefined}
            councilObservation={saved?.councilObservation || undefined}
            attendance={saved?.attendance || undefined}
          />
        </div>
      )}

      {showA4Preview && entries.length > 0 && (
        <div className="rc-preview-actions fixed top-4 right-4 z-50 flex gap-2 print:hidden">
          <button
            onClick={() => setShowA4Preview(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-md hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'édition
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
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/teacher')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <div className="flex items-center gap-2">
                    <FileText className="w-7 h-7 text-primary-navy" />
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                      Bulletins
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedTrimester}
                    onChange={(e) =>
                      setSelectedTrimester(
                        Number(e.target.value) as 1 | 2 | 3,
                      )
                    }
                    className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-navy)]"
                  >
                    {availableTrimesters.map((n) => (
                      <option key={n} value={n}>
                        {trimesterLabel(n)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowA4Preview(true)}
                    disabled={entries.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-sm hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Aperçu A4
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={entries.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary-navy)] text-white shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                </div>
              </div>

              <p className="text-[var(--color-text-secondary)]">
                Sélectionnez un élève pour consulter son bulletin tel que
                l'administration l'a rempli. Vous pouvez ajouter ou modifier
                l'<strong>appréciation par matière</strong> ; les autres
                informations (notes, décisions, observations du conseil…)
                sont gérées par l'administration.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Sélecteur élève */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-5 h-5 text-primary-navy" />
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Sélection de l'élève
                  </h2>
                </div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Élève
                </label>
                <UserSelect
                  role="STUDENT"
                  valueKind="studentId"
                  value={selectedStudentId}
                  onChange={handleStudentChange}
                  placeholder="Rechercher un élève..."
                  emptyHint="Aucun élève disponible"
                  showEmail
                  className="input-field w-full"
                />
                {selectedStudent && (
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                    <span>
                      <strong>Période :</strong>{' '}
                      {trimesterLabel(selectedTrimester)}
                      {activeYear?.year ? ` — ${activeYear.year}` : ''}
                    </span>
                    {validEntries.length > 0 && average !== null && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-[var(--color-primary-gold)]" />
                        <strong>Moyenne actuelle :</strong>{' '}
                        {average.toFixed(2)}/{gradeScale}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {loading && (
                <div className="card p-8 text-center text-[var(--color-text-secondary)]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto mb-2" />
                  Chargement des notes...
                </div>
              )}

              {!loading &&
                selectedStudentId &&
                entries.length === 0 &&
                !error && (
                  <div className="card p-8 text-center text-[var(--color-text-secondary)]">
                    Aucune note trouvée pour cet élève sur ce trimestre.
                  </div>
                )}

              {/* Tableau édition par matière */}
              {entries.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[var(--color-primary-navy)]" />
                      Appréciations par matière
                    </h3>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {entries.length} matière
                      {entries.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--color-bg-secondary)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Matière
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider w-24">
                            Note
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider w-20">
                            Coef.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Appréciation du professeur
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {entries.map((entry, i) => {
                          const g = entry.grade;
                          const max = entry.maxGrade ?? 20;
                          const tone =
                            g === null
                              ? 'text-[var(--color-text-muted)]'
                              : g >= max * 0.8
                                ? 'text-green-600'
                                : g >= max * 0.7
                                  ? 'text-blue-600'
                                  : g >= max * 0.6
                                    ? 'text-amber-600'
                                    : g >= max * 0.5
                                      ? 'text-orange-600'
                                      : 'text-red-600';
                          return (
                            <tr key={`${entry.subject}-${i}`}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-[var(--color-text-primary)]">
                                  {entry.subject}
                                </div>
                                {entry.teacher && (
                                  <div className="text-xs text-[var(--color-text-muted)]">
                                    {entry.teacher}
                                  </div>
                                )}
                              </td>
                              <td className={`px-4 py-3 font-semibold ${tone}`}>
                                {g === null ? '—' : `${g.toFixed(1)}/${max}`}
                              </td>
                              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                                {entry.coefficient}
                              </td>
                              <td className="px-4 py-3">
                                <textarea
                                  value={entry.appreciation || ''}
                                  onChange={(e) =>
                                    updateAppreciation(i, e.target.value)
                                  }
                                  placeholder="Votre appréciation pour cette matière..."
                                  rows={2}
                                  className="input-field w-full text-sm"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bloc lecture-seule : appréciation générale + conseil
                  + assiduité — tels que l'admin les a remplis. */}
              {entries.length > 0 && saved && (
                <div className="card p-6 space-y-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs uppercase tracking-wide">
                    <Lock className="w-3.5 h-3.5" />
                    Champs gérés par l'administration
                  </div>
                  {saved.generalAppreciation ? (
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">
                      <strong className="text-[var(--color-text-primary)]">
                        Appréciation générale :
                      </strong>{' '}
                      {saved.generalAppreciation}
                    </p>
                  ) : (
                    <p className="text-sm italic text-[var(--color-text-muted)]">
                      Aucune appréciation générale pour le moment.
                    </p>
                  )}
                  {saved.attendance && (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      <strong className="text-[var(--color-text-primary)]">
                        Assiduité :
                      </strong>{' '}
                      {saved.attendance.present ?? '-'} présents,{' '}
                      {saved.attendance.absent ?? '-'} absences,{' '}
                      {saved.attendance.late ?? '-'} retards
                    </p>
                  )}
                </div>
              )}

              {/* Sauvegarde — uniquement quand un bulletin est chargé */}
              {entries.length > 0 && (
                <div className="card p-6 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Save className="w-4 h-4" />
                    {saving
                      ? 'Enregistrement…'
                      : 'Enregistrer les appréciations'}
                  </button>
                  {savedFlash?.kind === 'ok' && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Appréciations enregistrées sur le serveur
                    </span>
                  )}
                  {savedFlash?.kind === 'error' && (
                    <span className="text-sm text-red-600 font-medium">
                      {savedFlash.message}
                    </span>
                  )}
                  {saved?.updatedAt && (
                    <span className="text-xs text-[var(--color-text-muted)] ml-auto">
                      Dernière mise à jour :{' '}
                      {new Date(saved.updatedAt).toLocaleString('fr-FR')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherReportCardEditor;
