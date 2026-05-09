import type React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, ChevronLeft, AlertCircle, Users, TrendingUp, Eye, Printer, ArrowLeft, Save } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import UserSelect from '../../../components/forms/UserSelect';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useBranding } from '../../../contexts/BrandingContext';
import {
  ReportCardA4,
  mapGradesToEntries,
  extractPeriod,
  type ReportCardEntry,
  type ReportCardCompositions,
  type ReportCardDecision,
  type ReportCardCouncilObservation,
} from '../../../components/reportcard';
import {
  loadStudentBulletin as fetchMergedBulletin,
  saveReportCard,
  computeAverage,
  getMention as deriveMention,
} from '../../../lib/reportCardClient';

type GradeRow = {
  course: string;
  grade: number;
  coefficient: number;
  teacher: string;
};

type BulletinData = {
  studentName: string;
  studentId: string;
  className: string;
  period: string;
  gpa: number;
  mention: string;
  grades: GradeRow[];
  /** Entrées pour le composant A4 réutilisable. */
  a4Entries: ReportCardEntry[];
  /** Période (trimestre + année). */
  a4Period: { trimester: string; academicYear?: string };
};

const AdminBulletins: React.FC = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [bulletin, setBulletin] = useState<BulletinData | null>(null);

  // Batch mode — generate for all students of a class
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classBulletins, setClassBulletins] = useState<BulletinData[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Aperçu A4 — mode immersif (pleine page) pour un seul bulletin
  const [showA4Preview, setShowA4Preview] = useState(false);
  // Contrôle quel host s'imprime : 'single' (individuel) ou 'batch' (classe).
  const [printScope, setPrintScope] = useState<'single' | 'batch' | null>(null);

  // ============================================================
  // Année académique active + trimestre actif (chargé depuis
  // /api/academic-years). Le bulletin est strictement lié à
  // l'année et au trimestre actif :
  //   - T1 actif → bulletin du 1er trimestre uniquement
  //   - T2 actif → bulletin du 2ᵉ trimestre uniquement
  //   - T3 actif → bulletin annuel (compositions + décision)
  // L'admin peut forcer manuellement un autre trimestre via le
  // sélecteur si besoin (ex : ré-imprimer un T1 en juin).
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
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  /** Numéro du trimestre choisi (1, 2, 3). 3 = bulletin annuel. */
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);
  /** Échelle de la moyenne — 10 pour primaire (défaut), 20 pour collège. */
  const [gradeScale, setGradeScale] = useState<10 | 20>(10);

  // ============================================================
  // État d'édition "Excel-like" du bulletin individuel.
  // Toutes ces valeurs sont saisies localement par l'admin dans
  // l'aperçu A4. Elles sont réinitialisées à chaque changement
  // d'élève sélectionné. Persistance backend à venir (modèle
  // ReportCardEntry Prisma).
  // ============================================================
  const [compositions, setCompositions] = useState<ReportCardCompositions>({});
  const [decision, setDecision] = useState<ReportCardDecision | null>(null);
  const [councilObservation, setCouncilObservation] =
    useState<ReportCardCouncilObservation | null>(null);
  const [generalAppreciation, setGeneralAppreciation] = useState('');
  const [attendance, setAttendance] = useState<{
    present?: number;
    absent?: number;
    late?: number;
  }>({});
  // Feedback de sauvegarde serveur (PUT /api/report-cards).
  const [savedFlash, setSavedFlash] = useState<
    null | { kind: 'ok'; at: string } | { kind: 'error'; message: string }
  >(null);
  const [saving, setSaving] = useState(false);

  // Load classes list
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.get(API.CLASSES);
        const data = res.data;
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setClasses(items.map((c: any) => ({ id: c.id, name: c.name })));
      } catch {
        // silent — classes are optional
      }
    };
    loadClasses();
  }, []);

  // Load academic years + détecte automatiquement le trimestre
  // actif (`isActive: true`) pour pré-sélectionner le bon
  // bulletin à générer.
  useEffect(() => {
    const loadAcademicYear = async () => {
      try {
        const res = await api.get(API.ACADEMIC_YEARS);
        const payload = res.data;
        const years: AcademicYear[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        const active =
          years.find((y) => y.isActive) || years[0] || null;
        if (!active) return;
        setActiveYear(active);
        // Trie les trimestres par index pour avoir T1/T2/T3 dans
        // l'ordre, puis trouve celui marqué actif.
        const sorted = [...active.trimesters].sort((a, b) => {
          const ai = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
          const bi = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
          return ai - bi;
        });
        const activeIndex = sorted.findIndex((t) => t.isActive);
        if (activeIndex >= 0) {
          setSelectedTrimester((activeIndex + 1) as 1 | 2 | 3);
        }
      } catch {
        // silent — l'année académique reste optionnelle (on fall
        // back sur "Trimestre en cours" si l'API n'est pas dispo).
      }
    };
    loadAcademicYear();
  }, []);

  // ------------------------------------------------------------
  // Charge le bulletin pour (élève, année, trimestre) :
  //   1. fetch /api/grades/student/:id (notes brutes)
  //   2. fetch /api/report-cards (overlay persisté par admin/prof)
  //   3. merge → entries finales + champs admin pré-remplis
  // Cette fonction est réutilisée à chaque changement d'élève OU
  // de trimestre OU d'année — admin voit toujours la dernière
  // version sauvegardée côté serveur.
  // ------------------------------------------------------------
  const loadStudentBulletinFor = useCallback(
    async (
      studentProfileId: string,
      yearId: string,
      trimester: 1 | 2 | 3,
      studentName?: string,
    ) => {
      try {
        setLoading(true);
        setError('');
        const merged = await fetchMergedBulletin({
          studentId: studentProfileId,
          yearId,
          trimester,
        });

        // Pré-remplit les champs admin depuis la sauvegarde
        // serveur (ou réinitialise si rien de persisté pour ce
        // trimestre).
        if (merged.saved) {
          setCompositions(merged.saved.compositions || {});
          setDecision(merged.saved.decision);
          setCouncilObservation(merged.saved.councilObservation);
          setGeneralAppreciation(merged.saved.generalAppreciation || '');
          setAttendance(merged.saved.attendance || {});
          if (merged.saved.gradeScale === 10 || merged.saved.gradeScale === 20) {
            setGradeScale(merged.saved.gradeScale);
          }
        } else {
          setCompositions({});
          setDecision(null);
          setCouncilObservation(null);
          setGeneralAppreciation('');
          setAttendance({});
        }

        // GradeRow[] pour le tableau de l'aperçu admin (toujours
        // sur /20 — le scaling /10 est fait à l'affichage).
        const grades: GradeRow[] = merged.entries.map((e) => ({
          course: e.subject,
          grade:
            e.grade === null || Number.isNaN(e.grade as number)
              ? 0
              : Number((e.grade as number).toFixed(1)),
          coefficient: e.coefficient || 1,
          teacher: e.teacher || '-',
        }));

        const avg20 = computeAverage(merged.entries, 20);
        const mention = deriveMention(avg20 ?? 0, 20);

        const b: BulletinData = {
          studentName: studentName || selectedStudentName || 'Élève',
          studentId: studentProfileId,
          className: merged.className,
          period: merged.period.trimester
            ? `${merged.period.trimester}${
                merged.period.academicYear ? ` ${merged.period.academicYear}` : ''
              }`.trim()
            : 'Trimestre en cours',
          gpa: avg20 === null ? 0 : Number(avg20.toFixed(2)),
          mention,
          grades,
          a4Entries: merged.entries,
          a4Period: merged.period,
        };

        setBulletin(b);
        return b;
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
            err.message ||
            'Erreur lors du chargement du bulletin',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [selectedStudentName],
  );

  // Handle student selection — déclenche le chargement initial.
  const handleStudentChange = (id: string, user?: any) => {
    setSelectedStudentId(id);
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      setSelectedStudentName(name);
    }
    setBulletin(null);
    setSavedFlash(null);
    // Le chargement effectif est déclenché par le useEffect ci-dessous
    // qui dépend de (studentId, yearId, trimester).
  };

  // Reload à chaque changement d'élève, année ou trimestre.
  useEffect(() => {
    if (!selectedStudentId || !activeYear?.id) return;
    loadStudentBulletinFor(
      selectedStudentId,
      activeYear.id,
      selectedTrimester,
      selectedStudentName,
    );
    // Note: deliberately NOT depending on selectedStudentName so
    // a name update mid-load doesn't trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId, activeYear?.id, selectedTrimester]);

  // Generate bulletins for all students in a class
  const handleGenerateClassBulletins = async () => {
    if (!selectedClassId) return;
    try {
      setBatchLoading(true);
      setError('');
      setClassBulletins([]);

      // Get students in this class
      const usersRes = await api.get(API.USERS, { params: { role: 'STUDENT', limit: 500 } });
      const allStudents = Array.isArray(usersRes.data?.data?.users) ? usersRes.data.data.users : [];
      const className = classes.find(c => c.id === selectedClassId)?.name || '';

      // Filter students by class (using student.major = className)
      const studentsInClass = allStudents
        .filter((u: any) => u.student?.major === className && u.student?.id)
        .map((u: any) => ({
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim(),
          studentId: u.student.id
        }));

      if (studentsInClass.length === 0) {
        setError(`Aucun élève trouvé dans la classe "${className}".`);
        setBatchLoading(false);
        return;
      }

      // Load bulletins for each student
      const bulletins: BulletinData[] = [];
      for (const student of studentsInClass) {
        try {
          const res = await api.get(API.GRADES_BY_STUDENT(student.studentId));
          const result = res.data;
          const courses = Array.isArray(result?.data?.courses) ? result.data.courses : [];

          const grades: GradeRow[] = courses.map((course: any) => {
            const assignments = Array.isArray(course.assignments) ? course.assignments : [];
            let gradeValue = 0;
            if (course.finalGrade != null) {
              gradeValue = Number(course.finalGrade);
            } else if (assignments.length > 0) {
              const totals = assignments.reduce((acc: { earned: number; possible: number }, a: any) => {
                return { earned: acc.earned + (Number(a.pointsEarned) || 0), possible: acc.possible + (Number(a.pointsPossible) || 0) };
              }, { earned: 0, possible: 0 });
              gradeValue = totals.possible > 0 ? (totals.earned / totals.possible) * 20 : 0;
            }
            return {
              course: course.courseName || 'Matière',
              grade: Number(gradeValue.toFixed(1)),
              coefficient: course.credits || 1,
              teacher: course.teacher || '-'
            };
          });

          const wt = grades.reduce((s, r) => s + r.grade * r.coefficient, 0);
          const cs = grades.reduce((s, r) => s + r.coefficient, 0);
          const avg = cs > 0 ? wt / cs : 0;
          const mention = avg >= 16 ? 'Très Bien' : avg >= 14 ? 'Bien' : avg >= 12 ? 'Assez Bien' : avg >= 10 ? 'Passable' : 'Insuffisant';

          bulletins.push({
            studentName: student.name,
            studentId: student.studentId,
            className,
            period: result?.data?.semester ? `${result.data.semester} ${result.data.year || ''}`.trim() : 'Trimestre en cours',
            gpa: Number(avg.toFixed(2)),
            mention,
            grades,
            a4Entries: mapGradesToEntries(result),
            a4Period: extractPeriod(result, result?.data?.semester || 'Trimestre en cours'),
          });
        } catch {
          // skip students with no grades
        }
      }

      setClassBulletins(bulletins.sort((a, b) => b.gpa - a.gpa));
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors de la génération des bulletins');
    } finally {
      setBatchLoading(false);
    }
  };

  const getMentionColor = (mention: string) => {
    switch (mention) {
      case 'Très Bien': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Bien': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Assez Bien': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Passable': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  // ============================================================
  // Trimestres réellement disponibles = trimestres de l'année
  // active marqués `isActive: true` dans /admin/years. Un
  // trimestre absent de cette liste n'est PAS proposé dans le
  // sélecteur ni utilisable pour générer un bulletin.
  //
  // On trie par numéro (1,2,3) extrait du nom du trimestre pour
  // que l'ordre reste stable même si l'admin les a créés dans
  // un ordre différent.
  // ============================================================
  const availableTrimesters = useMemo<(1 | 2 | 3)[]>(() => {
    if (!activeYear?.trimesters) return [];
    const sorted = [...activeYear.trimesters].sort((a, b) => {
      const ai = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
      const bi = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
      return ai - bi;
    });
    const result: (1 | 2 | 3)[] = [];
    sorted.forEach((t, idx) => {
      if (t.isActive && idx < 3) result.push((idx + 1) as 1 | 2 | 3);
    });
    return result;
  }, [activeYear]);

  // Si le trimestre actuellement sélectionné n'est plus actif
  // (par ex. l'admin vient de désactiver T1 dans /admin/years),
  // on se rabat automatiquement sur le premier trimestre actif.
  useEffect(() => {
    if (availableTrimesters.length === 0) return;
    if (!availableTrimesters.includes(selectedTrimester)) {
      setSelectedTrimester(availableTrimesters[0]);
    }
  }, [availableTrimesters, selectedTrimester]);

  // ============================================================
  // Période effective passée au composant A4 — calculée à partir
  // du trimestre sélectionné + année active. C'est elle qui
  // détermine le titre du bulletin ("Bulletin de Notes — 1er
  // Trimestre", etc.) et l'affichage des sections annuelles.
  // ============================================================
  const trimesterLabel = useMemo(() => {
    if (selectedTrimester === 1) return '1er Trimestre';
    if (selectedTrimester === 2) return '2ème Trimestre';
    return '3ème Trimestre — Bilan Annuel';
  }, [selectedTrimester]);

  const isAnnualBulletin = selectedTrimester === 3;
  /** True ⇔ au moins un trimestre est actif dans /admin/years. */
  const hasActiveTrimester = availableTrimesters.length > 0;

  // ------------------------------------------------------------
  // Les GPA stockés dans `bulletin.gpa` / `grades[].grade` sont
  // toujours calculés sur /20 (cf. loadStudentBulletin). Quand
  // l'admin choisit le barème "/10 (Primaire)", il faut les
  // ramener à l'échelle avant affichage dans les cartes résumé.
  // ------------------------------------------------------------
  const scaleValue = (value: number) =>
    gradeScale === 10 ? value / 2 : value;

  const overriddenPeriod = useMemo(
    () => ({
      trimester: trimesterLabel,
      academicYear: activeYear?.year || bulletin?.a4Period.academicYear,
    }),
    [trimesterLabel, activeYear?.year, bulletin?.a4Period.academicYear],
  );

  // ------------------------------------------------------------
  // Résumé "live" (Moyenne générale / Mention / Matières) calculé
  // directement depuis `bulletin.a4Entries` pour rester en sync
  // avec ce que l'admin saisit dans l'aperçu A4 — la cellule du
  // bulletin et la carte récapitulative affichent toujours la
  // même chose, c'est ce que l'élève / parent / prof verront aussi
  // dès que l'admin a enregistré.
  // ------------------------------------------------------------
  const liveSummary = useMemo(() => {
    if (!bulletin) {
      return { gpaOnScale: 0, mention: 'Insuffisant', matieresCount: 0 };
    }
    const avg20 = computeAverage(bulletin.a4Entries, 20);
    const onScale = computeAverage(bulletin.a4Entries, gradeScale);
    return {
      gpaOnScale: onScale === null ? 0 : Number(onScale.toFixed(2)),
      mention: deriveMention(avg20 ?? 0, 20),
      matieresCount: bulletin.a4Entries.length,
    };
  }, [bulletin, gradeScale]);

  // ------------------------------------------------------------
  // Sauvegarde serveur (PUT /api/report-cards). Envoie l'état
  // courant (entries éditées + tous les champs admin) vers le
  // backend, puis recharge le bulletin pour caler le state local
  // sur la version canonique renvoyée par l'API.
  // ------------------------------------------------------------
  const handleAdminSave = async () => {
    if (!bulletin || !activeYear?.id || saving) return;
    setSaving(true);
    setSavedFlash(null);
    try {
      const saved = await saveReportCard({
        studentId: bulletin.studentId,
        yearId: activeYear.id,
        trimester: selectedTrimester,
        gradeScale,
        entries: bulletin.a4Entries,
        generalAppreciation,
        compositions,
        decision,
        councilObservation,
        attendance,
      });
      setSavedFlash({
        kind: 'ok',
        at: saved?.updatedAt || new Date().toISOString(),
      });
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

  // Impression individuelle : on active le host "single", on laisse
  // React committer puis on lance le dialog d'impression du navigateur.
  const handlePrintSingle = () => {
    if (!bulletin) return;
    setPrintScope('single');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintScope(null), 120);
    }, 60);
  };

  // Impression batch : tous les bulletins de la classe sur des pages
  // séparées. Le `page-break-after: always` du CSS s'occupe de la
  // pagination ; le navigateur envoie N pages à l'imprimante.
  const handlePrintBatch = () => {
    if (classBulletins.length === 0) return;
    setPrintScope('batch');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintScope(null), 120);
    }, 150);
  };

  return (
    <>
      {/* ============================================================
          HOSTS D'IMPRESSION A4 — un par mode. Seul le host actif est
          ajouté au DOM au moment du print, pour ne pas imprimer à la
          fois single + batch. Pour l'aperçu A4 à l'écran, on garde le
          host individuel monté en permanence (visible/caché via
          data-screen-hidden) afin que le toggle soit instantané.
          ============================================================ */}
      {bulletin && (showA4Preview || printScope === 'single') && (
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
              fullName: bulletin.studentName,
              className: bulletin.className,
            }}
            period={overriddenPeriod}
            entries={bulletin.a4Entries}
            gradeScale={gradeScale}
            isAnnual={isAnnualBulletin}
            // ----------------------------------------------
            // Mode édition inline (admin uniquement). Les
            // callbacks remontent les changements de cellules
            // dans le state local du composant parent.
            // ----------------------------------------------
            editable={showA4Preview}
            onEntriesChange={(next) =>
              setBulletin((prev) => (prev ? { ...prev, a4Entries: next } : prev))
            }
            compositions={compositions}
            onCompositionsChange={setCompositions}
            decision={decision}
            onDecisionChange={setDecision}
            councilObservation={councilObservation}
            onCouncilObservationChange={setCouncilObservation}
            generalAppreciation={generalAppreciation}
            onGeneralAppreciationChange={setGeneralAppreciation}
            attendance={attendance}
            onAttendanceChange={setAttendance}
          />
        </div>
      )}

      {printScope === 'batch' && classBulletins.length > 0 && (
        <div className="rc-print-host" data-screen-hidden={true}>
          {classBulletins.map((b) => (
            <ReportCardA4
              key={b.studentId}
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
                fullName: b.studentName,
                className: b.className,
              }}
              period={{
                trimester: trimesterLabel,
                academicYear: activeYear?.year || b.a4Period.academicYear,
              }}
              entries={b.a4Entries}
              gradeScale={gradeScale}
              isAnnual={isAnnualBulletin}
            />
          ))}
        </div>
      )}

      {/* Barre d'actions flottante en mode Aperçu A4 immersif.
          En mode admin, on propose aussi un bouton "Enregistrer"
          qui flash le feedback local tant que le backend n'est
          pas branché. */}
      {showA4Preview && bulletin && (
        <div className="rc-preview-actions fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
          {savedFlash?.kind === 'ok' && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium shadow-sm animate-pulse">
              ✓ Enregistré sur le serveur
            </span>
          )}
          {savedFlash?.kind === 'error' && (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium shadow-sm">
              {savedFlash.message}
            </span>
          )}
          <button
            onClick={() => setShowA4Preview(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-md hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button
            onClick={handleAdminSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-semibold shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            title="Sauvegarder le bulletin sur le serveur"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            onClick={handlePrintSingle}
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
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'bulletins' } })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary-navy" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Bulletins Trimestriels
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Générer et consulter les bulletins de notes des élèves
                    {activeYear ? ` — Année ${activeYear.year}` : ''}
                  </p>
                </div>
              </div>

              {/* ============================================================
                  Sélecteurs : trimestre actif + barème de la moyenne.
                  Le trimestre est pré-sélectionné depuis l'année active
                  (champ `isActive` du modèle Trimester) et peut être
                  changé manuellement par l'admin.
                  ============================================================ */}
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Trimestre
                  </label>
                  {hasActiveTrimester ? (
                    <select
                      value={selectedTrimester}
                      onChange={(e) =>
                        setSelectedTrimester(
                          Number(e.target.value) as 1 | 2 | 3,
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-navy)]"
                    >
                      {availableTrimesters.map((n) => {
                        const baseLabel =
                          n === 1
                            ? '1er Trimestre'
                            : n === 2
                            ? '2ème Trimestre'
                            : '3ème Trimestre — Bilan annuel';
                        return (
                          <option key={n} value={n}>
                            {baseLabel}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/years')}
                      className="px-3 py-2 rounded-lg border border-amber-400 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors"
                      title="Aucun trimestre actif dans l'année courante"
                    >
                      Aucun trimestre actif — configurer
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    Barème moyenne
                  </label>
                  <select
                    value={gradeScale}
                    onChange={(e) =>
                      setGradeScale(Number(e.target.value) as 10 | 20)
                    }
                    className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-navy)]"
                  >
                    <option value={10}>/10 (Primaire)</option>
                    <option value={20}>/20 (Collège / Lycée)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Bandeau : aucun trimestre actif → génération bloquée.
              L'admin est redirigé vers /admin/years pour cocher au
              moins un trimestre comme actif. */}
          {!hasActiveTrimester && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-900 font-semibold">
                  Aucun trimestre actif
                </p>
                <p className="text-amber-800 text-sm mt-1">
                  Pour générer un bulletin, activez au moins un trimestre
                  de l'année courante dans{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/admin/years')}
                    className="underline font-medium hover:text-amber-900"
                  >
                    Années &amp; Trimestres
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Individual Student Bulletin — désactivé tant qu'aucun
              trimestre n'est actif dans /admin/years. */}
          <Card
            className={
              'p-6' +
              (hasActiveTrimester
                ? ''
                : ' opacity-50 pointer-events-none select-none')
            }
            aria-disabled={!hasActiveTrimester}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-navy" />
              Bulletin individuel
            </h2>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner un élève
                </label>
                <UserSelect
                  role="STUDENT"
                  valueKind="studentId"
                  value={selectedStudentId}
                  onChange={handleStudentChange}
                  placeholder="Choisir un élève pour voir son bulletin"
                  emptyHint="Aucun élève disponible"
                  showEmail
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement du bulletin...</p>
              </div>
            )}

            {bulletin && !loading && (
              <div className="mt-6 space-y-4">
                {/* Student header */}
                <div className="bg-gradient-to-r from-[var(--color-primary-navy)] to-[var(--color-primary-navy)]/80 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-bold">{bulletin.studentName}</h3>
                      <p className="text-white/80 text-sm">Classe : {bulletin.className} — {bulletin.period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getMentionColor(liveSummary.mention)}`}>
                        {liveSummary.mention}
                      </span>
                      <button
                        onClick={() => setShowA4Preview(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white text-[var(--color-primary-navy)] font-semibold rounded-lg hover:bg-white/90 text-xs transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Aperçu A4
                      </button>
                      <button
                        onClick={handlePrintSingle}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white text-[var(--color-primary-navy)] font-semibold rounded-lg hover:bg-white/90 text-xs transition-colors shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{liveSummary.gpaOnScale.toFixed(2)}/{gradeScale}</p>
                      <p className="text-xs text-white/70">Moyenne générale</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{liveSummary.matieresCount}</p>
                      <p className="text-xs text-white/70">Matières</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{liveSummary.mention}</p>
                      <p className="text-xs text-white/70">Mention</p>
                    </div>
                  </div>
                </div>

                {/* Grades table */}
                {bulletin.grades.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Matière</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Enseignant</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Note</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Coefficient</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Appréciation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {bulletin.grades.map((g, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{g.course}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.teacher}</td>
                            <td className="px-4 py-3 font-semibold text-primary-navy">{scaleValue(g.grade).toFixed(gradeScale === 10 ? 2 : 1)}/{gradeScale}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.coefficient}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                g.grade >= 16 ? 'bg-green-100 text-green-800' :
                                g.grade >= 14 ? 'bg-blue-100 text-blue-800' :
                                g.grade >= 12 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {g.grade >= 16 ? 'Excellent' : g.grade >= 14 ? 'Très bien' : g.grade >= 12 ? 'Bien' : 'À améliorer'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune note enregistrée pour cet élève.</p>
                )}
              </div>
            )}
          </Card>

          {/* Batch Generation by Class — également désactivée sans
              trimestre actif. */}
          <Card
            className={
              'p-6' +
              (hasActiveTrimester
                ? ''
                : ' opacity-50 pointer-events-none select-none')
            }
            aria-disabled={!hasActiveTrimester}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-navy" />
              Bulletins par classe
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Générer les bulletins pour tous les élèves d'une classe
            </p>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner une classe
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => { setSelectedClassId(e.target.value); setClassBulletins([]); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="">Choisir une classe</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerateClassBulletins}
                disabled={!selectedClassId || batchLoading}
                className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {batchLoading ? 'Génération...' : 'Générer les bulletins'}
              </button>
            </div>

            {batchLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Génération des bulletins en cours...</p>
              </div>
            )}

            {classBulletins.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {classBulletins.length} bulletin{classBulletins.length > 1 ? 's' : ''} générés
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      Moyenne de classe : {scaleValue(classBulletins.reduce((s, b) => s + b.gpa, 0) / classBulletins.length).toFixed(2)}/{gradeScale}
                    </div>
                    <button
                      onClick={handlePrintBatch}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary-navy)] text-white text-sm shadow-sm hover:opacity-90 transition-opacity"
                      title="Imprimer tous les bulletins de cette classe"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimer tous
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Rang</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Élève</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Moyenne</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Mention</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Matières</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {classBulletins.map((b, i) => (
                        <tr key={b.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{b.studentName}</td>
                          <td className="px-4 py-3 font-semibold text-primary-navy">{scaleValue(b.gpa).toFixed(2)}/{gradeScale}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getMentionColor(b.mention)}`}>
                              {b.mention}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{b.grades.length}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedStudentId(b.studentId);
                                setSelectedStudentName(b.studentName);
                                setBulletin(b);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Voir le bulletin"
                            >
                              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBulletins;
