import type React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import './reportCardA4.css';

// ============================================================
// ReportCardA4
// ------------------------------------------------------------
// Composant 100% présentationnel : aucune requête réseau,
// aucun state. Toutes les données sont passées en props pour
// permettre une réutilisation cross-rôles (étudiant, parent,
// prof, admin) et un test isolé. Les calculs (moyenne pondérée,
// mention) sont faits ici à partir des `entries` reçues.
//
// USAGE :
//   import { ReportCardA4 } from '@/components/reportcard/ReportCardA4';
//   <div className="rc-print-host">
//     <ReportCardA4 school={...} student={...} period={...} entries={...} />
//   </div>
//   // puis window.print() — le @media print masque le shell
//   // de l'app et n'imprime que le ou les bulletins du host.
// ============================================================

export interface ReportCardEntry {
  /** Nom de la matière, ex: "Mathématiques". */
  subject: string;
  /** Nom complet de l'enseignant (optionnel). */
  teacher?: string;
  /** Note obtenue, exprimée dans l'échelle de `maxGrade`. `null` si non notée. */
  grade: number | null;
  /**
   * Barème de la note (ex: 40, 35, 20). Par défaut 20.
   * Permet de reproduire le format sénégalais où chaque matière a
   * sa propre échelle (Français /40, Mathématiques /40, EDD /24…).
   */
  maxGrade?: number;
  /**
   * Coefficient de la matière. Sert de pondération pour calculer
   * TOTAL OBTENU = Σ(grade × coef) et TOTAL MAX = Σ(maxGrade × coef).
   * La MOYENNE finale = (TOTAL OBTENU / TOTAL MAX) × gradeScale.
   * Default = 1.
   */
  coefficient: number;
  /** Appréciation libre / observation pour cette matière. */
  appreciation?: string;
}

/** Compositions trimestrielles + moyenne annuelle (optionnel). */
export interface ReportCardCompositions {
  first?: number | null;
  second?: number | null;
  third?: number | null;
  annual?: number | null;
}

/** Décision de passage du conseil de classe. */
export type ReportCardDecision = 'promoted' | 'redoubling' | 'excluded';

/** Observation globale cochée par le conseil des maîtres. */
export type ReportCardCouncilObservation =
  | 'congrats'
  | 'encouragement'
  | 'honor'
  | 'warning'
  | 'blame';

export interface ReportCardSchool {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Nom du chef d'établissement (apparaît bloc signature). */
  principal?: string;
  /** URL d'un logo carré ou rond. Tombe sur l'initiale du nom si absent. */
  logoUrl?: string;
  /** Année scolaire (ex: "2025-2026"). */
  year?: string;
}

export interface ReportCardStudent {
  fullName: string;
  /** Matricule / numéro étudiant. */
  studentId?: string;
  className?: string;
  /** Date de naissance (déjà formatée FR si possible). */
  dateOfBirth?: string;
  /** URL d'une photo identité (24×30 mm rendu). */
  photoUrl?: string;
}

export interface ReportCardPeriod {
  /** Ex: "Trimestre 1", "Semestre 2". */
  trimester: string;
  /** Ex: "2025-2026". */
  academicYear?: string;
}

export interface ReportCardA4Props {
  school: ReportCardSchool;
  student: ReportCardStudent;
  period: ReportCardPeriod;
  entries: ReportCardEntry[];
  /**
   * Échelle finale de la moyenne. 20 par défaut. À passer à 10
   * pour un bulletin de primaire (au Sénégal la moyenne primaire
   * s'exprime sur 10).
   */
  gradeScale?: 10 | 20;
  /**
   * Quand `true`, ce bulletin est le bulletin annuel (3ᵉ trimestre).
   * Il affiche en plus :
   *   - la section "Moyennes par composition" (1er, 2ème, 3ème, annuelle)
   *   - la "Décision du conseil de classe"
   *   - les "Observations du conseil des maîtres"
   * Pour les bulletins de 1er ou 2ème trimestre, ces sections sont
   * masquées (le conseil ne décide qu'en fin d'année).
   */
  isAnnual?: boolean;
  /** Appréciation du conseil de classe (texte libre, multi-ligne). */
  generalAppreciation?: string;
  /** Stats d'assiduité affichées en bas du bulletin. */
  attendance?: {
    present?: number;
    absent?: number;
    late?: number;
  };
  /** Permet d'écraser les noms affichés au-dessus des signatures. */
  signatures?: {
    principal?: string;
    mainTeacher?: string;
  };
  /** Date d'émission affichée en pied (par défaut : aujourd'hui). */
  issuedAt?: string;

  // ==========================================================
  // Mode édition inline (style Excel) — réservé à l'admin.
  // Quand `editable = true`, chaque cellule du tableau (matière,
  // note, barème, observation) devient un <input> focusable,
  // et on expose des callbacks pour remonter les changements.
  // ==========================================================
  /** Active l'édition inline. Par défaut : false (readonly). */
  editable?: boolean;
  /** Remontée de la liste mise à jour après chaque modif cellulaire. */
  onEntriesChange?: (entries: ReportCardEntry[]) => void;

  /** Compositions trimestrielles + moyenne annuelle (section bas). */
  compositions?: ReportCardCompositions;
  onCompositionsChange?: (next: ReportCardCompositions) => void;

  /** Décision du conseil (admis / redouble / exclusion). */
  decision?: ReportCardDecision | null;
  onDecisionChange?: (next: ReportCardDecision | null) => void;

  /** Observation du conseil (Félicitations, Encouragement…). */
  councilObservation?: ReportCardCouncilObservation | null;
  onCouncilObservationChange?: (next: ReportCardCouncilObservation | null) => void;

  /** Appréciation générale — rendue éditable si `editable=true`. */
  onGeneralAppreciationChange?: (next: string) => void;

  /** Stats d'assiduité également éditables en mode admin. */
  onAttendanceChange?: (next: {
    present?: number;
    absent?: number;
    late?: number;
  }) => void;
}

// Helpers ----------------------------------------------------

const getMention = (avg: number): string => {
  if (avg >= 16) return 'Excellent';
  if (avg >= 14) return 'Très Bien';
  if (avg >= 12) return 'Bien';
  if (avg >= 10) return 'Assez Bien';
  return 'Insuffisant';
};

/**
 * Retourne une "tonalité" visuelle en fonction du pourcentage (0-100).
 * Utilisé pour colorer les cellules de notes (barre mini, couleur texte).
 */
const getTone = (
  percentage: number,
): 'success' | 'good' | 'ok' | 'warn' | 'bad' => {
  if (percentage >= 80) return 'success';
  if (percentage >= 70) return 'good';
  if (percentage >= 60) return 'ok';
  if (percentage >= 50) return 'warn';
  return 'bad';
};

const formatGrade = (g: number | null): string =>
  g === null || Number.isNaN(g) ? '—' : g.toFixed(1);

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/** Barème par défaut si l'entrée n'en précise pas. */
const DEFAULT_MAX = 20;

/** Libellés des décisions du conseil. */
const DECISION_LABELS: Record<ReportCardDecision, string> = {
  promoted: 'Admis(e) en classe supérieure',
  redoubling: 'Autorisé(e) à redoubler',
  excluded: 'Exclusion',
};

/** Libellés des observations du conseil des maîtres. */
const COUNCIL_LABELS: Record<ReportCardCouncilObservation, string> = {
  congrats: 'Félicitations',
  encouragement: 'Encouragement',
  honor: "Tableau d'honneur",
  warning: 'Avertissement',
  blame: 'Blâme',
};

// ============================================================

export const ReportCardA4: React.FC<ReportCardA4Props> = ({
  school,
  student,
  period,
  entries,
  gradeScale = 20,
  isAnnual = false,
  generalAppreciation,
  attendance,
  signatures,
  issuedAt,
  editable = false,
  onEntriesChange,
  compositions,
  onCompositionsChange,
  decision,
  onDecisionChange,
  councilObservation,
  onCouncilObservationChange,
  onGeneralAppreciationChange,
  onAttendanceChange,
}) => {
  // ------------------------------------------------------------
  // Helpers d'édition inline (propagation vers le parent via
  // `onEntriesChange` à chaque frappe — la liste reste immutable).
  // ------------------------------------------------------------
  const updateEntry = (index: number, patch: Partial<ReportCardEntry>) => {
    if (!onEntriesChange) return;
    const next = entries.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onEntriesChange(next);
  };

  const addEntry = () => {
    if (!onEntriesChange) return;
    onEntriesChange([
      ...entries,
      {
        subject: 'Nouvelle matière',
        grade: null,
        maxGrade: DEFAULT_MAX,
        coefficient: 1,
        appreciation: '',
      },
    ]);
  };

  const removeEntry = (index: number) => {
    if (!onEntriesChange) return;
    onEntriesChange(entries.filter((_, i) => i !== index));
  };

  const updateCompositions = (patch: Partial<ReportCardCompositions>) => {
    if (!onCompositionsChange) return;
    onCompositionsChange({ ...(compositions ?? {}), ...patch });
  };

  // ------------------------------------------------------------
  // Calculs TOTAL / MOYENNE — convention "bulletin sénégalais
  // primaire / collège avec coefficients" :
  //   - chaque entry a un barème `maxGrade` (défaut 20)
  //   - la NOTE obtenue est dans l'échelle de `maxGrade`
  //   - TOTAL OBTENU = Σ(grade × coef)
  //   - TOTAL MAX    = Σ(maxGrade × coef)
  //   - MOYENNE      = (TOTAL OBTENU / TOTAL MAX) × gradeScale
  //                   où gradeScale = 10 (primaire) ou 20 (collège)
  // ------------------------------------------------------------
  const validEntries = entries.filter(
    (e) => e.grade !== null && !Number.isNaN(e.grade),
  );
  const pointsObtained = validEntries.reduce(
    (sum, e) => sum + (e.grade as number) * (e.coefficient || 1),
    0,
  );
  const pointsTotal = validEntries.reduce(
    (sum, e) => sum + (e.maxGrade ?? DEFAULT_MAX) * (e.coefficient || 1),
    0,
  );
  const average =
    pointsTotal > 0 ? (pointsObtained / pointsTotal) * gradeScale : 0;
  // Mention : on ramène toujours sur /20 pour pouvoir réutiliser
  // les seuils standards (10/12/14/16) quel que soit gradeScale.
  const mention = getMention(
    gradeScale === 20 ? average : (average / gradeScale) * 20,
  );

  const issued =
    issuedAt ??
    new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return (
    <article
      className="rc-a4"
      role="document"
      aria-label={`Bulletin de ${student.fullName}`}
    >
      {/* Bandeaux décoratifs */}
      <div className="rc-top-band" aria-hidden />
      <div className="rc-watermark" aria-hidden>
        BULLETIN OFFICIEL
      </div>

      {/* Header école */}
      <header className="rc-header">
        {school.logoUrl ? (
          <img
            src={school.logoUrl}
            alt={`Logo ${school.name}`}
            className="rc-logo"
          />
        ) : (
          <div className="rc-logo-fallback" aria-hidden>
            {initials(school.name)}
          </div>
        )}

        <div>
          <h1 className="rc-school-name">{school.name}</h1>
          <div className="rc-school-meta">
            {school.address && (
              <span className="rc-school-meta-item">
                <MapPin />
                {school.address}
              </span>
            )}
            {school.phone && (
              <span className="rc-school-meta-item">
                <Phone />
                {school.phone}
              </span>
            )}
            {school.email && (
              <span className="rc-school-meta-item">
                <Mail />
                {school.email}
              </span>
            )}
          </div>
        </div>

        <div className="rc-stamp" aria-hidden>
          <span className="rc-stamp-text">
            Bulletin
            <br />
            Officiel
          </span>
        </div>
      </header>

      {/* Titre */}
      <div className="rc-title-block">
        <p className="rc-eyebrow">
          Année académique {period.academicYear || school.year || ''}
        </p>
        <h2 className="rc-title">Bulletin de Notes — {period.trimester}</h2>
        <div className="rc-title-decoration" aria-hidden>
          <span />
        </div>
      </div>

      {/* Bandeau élève */}
      <section className="rc-student" aria-label="Identité de l'élève">
        <div className="rc-student-photo">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.fullName} />
          ) : (
            <span>{initials(student.fullName)}</span>
          )}
        </div>
        <dl className="rc-student-info">
          <div>
            <dt>Élève</dt>
            <dd>{student.fullName}</dd>
          </div>
          {student.studentId && (
            <div>
              <dt>Matricule</dt>
              <dd>{student.studentId}</dd>
            </div>
          )}
          {student.className && (
            <div>
              <dt>Classe</dt>
              <dd>{student.className}</dd>
            </div>
          )}
          {student.dateOfBirth && (
            <div>
              <dt>Né(e) le</dt>
              <dd>{student.dateOfBirth}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* ============================================================
          Tableau des notes — format sénégalais (MATIÈRES | NOTES |
          NOTES SUR | OBSERVATIONS). En mode `editable`, chaque
          cellule devient un <input> style Excel (dashed border,
          focus ring doré, cellule jaune pâle au focus).
          ============================================================ */}
      <section
        className="rc-grades"
        aria-label="Détail des notes"
        data-editable={editable}
      >
        <table className="rc-table">
          <thead>
            <tr>
              <th className="rc-th-subject">Matières</th>
              <th className="rc-th-grade">Notes</th>
              <th className="rc-th-max">Notes sur</th>
              <th className="rc-th-coef">Coef</th>
              <th className="rc-th-appreciation">Observations</th>
              {editable && <th className="rc-th-actions" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && !editable ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: 'center',
                    padding: '6mm',
                    fontStyle: 'italic',
                    color: '#999',
                  }}
                >
                  Aucune matière saisie pour cette période.
                </td>
              </tr>
            ) : (
              entries.map((entry, i) => {
                const g = entry.grade;
                const max = entry.maxGrade ?? DEFAULT_MAX;
                const pct =
                  g === null || Number.isNaN(g) || max <= 0
                    ? 0
                    : Math.max(0, Math.min(100, (g / max) * 100));
                const tone = g === null ? 'bad' : getTone(pct);
                return (
                  <tr key={`entry-${i}`}>
                    {/* Matière (+ enseignant en petit dessous) */}
                    <td className="rc-td-subject">
                      {editable ? (
                        <input
                          className="rc-edit-input rc-edit-input--text"
                          value={entry.subject}
                          onChange={(e) =>
                            updateEntry(i, { subject: e.target.value })
                          }
                          aria-label={`Matière ${i + 1}`}
                          placeholder="Nom de la matière"
                        />
                      ) : (
                        <>
                          <span className="rc-subject-name">{entry.subject}</span>
                          {entry.teacher && (
                            <span className="rc-subject-teacher">
                              {entry.teacher}
                            </span>
                          )}
                        </>
                      )}
                    </td>

                    {/* NOTE obtenue — barre mini + valeur, ou input number */}
                    <td>
                      {editable ? (
                        <input
                          className="rc-edit-input rc-edit-input--num"
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min={0}
                          max={max}
                          value={g ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateEntry(i, {
                              grade: v === '' ? null : Number(v),
                            });
                          }}
                          aria-label={`Note ${entry.subject}`}
                          placeholder="—"
                        />
                      ) : (
                        <div className="rc-grade-cell">
                          <span className="rc-grade-value">
                            {formatGrade(g)}
                          </span>
                          <div
                            className="rc-grade-bar"
                            aria-hidden
                            role="presentation"
                          >
                            <span
                              className="rc-grade-bar-fill"
                              data-tone={tone}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* NOTES SUR — barème */}
                    <td className="rc-td-max">
                      {editable ? (
                        <input
                          className="rc-edit-input rc-edit-input--num"
                          type="number"
                          inputMode="numeric"
                          step="1"
                          min={1}
                          value={max}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateEntry(i, {
                              maxGrade: Number.isFinite(v) && v > 0 ? v : DEFAULT_MAX,
                            });
                          }}
                          aria-label={`Barème ${entry.subject}`}
                        />
                      ) : (
                        max
                      )}
                    </td>

                    {/* COEF — pondération de la matière. Saisie
                        admin obligatoire pour calculer la moyenne
                        finale (sinon coef=1 par défaut). */}
                    <td className="rc-td-coef">
                      {editable ? (
                        <input
                          className="rc-edit-input rc-edit-input--num"
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min={0}
                          value={entry.coefficient ?? 1}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateEntry(i, {
                              coefficient:
                                Number.isFinite(v) && v >= 0 ? v : 1,
                            });
                          }}
                          aria-label={`Coefficient ${entry.subject}`}
                        />
                      ) : (
                        entry.coefficient ?? 1
                      )}
                    </td>

                    {/* OBSERVATIONS — champ libre */}
                    <td className="rc-td-appreciation">
                      {editable ? (
                        <input
                          className="rc-edit-input rc-edit-input--text"
                          value={entry.appreciation || ''}
                          onChange={(e) =>
                            updateEntry(i, { appreciation: e.target.value })
                          }
                          aria-label={`Observation ${entry.subject}`}
                          placeholder="Observation…"
                        />
                      ) : (
                        entry.appreciation || '—'
                      )}
                    </td>

                    {editable && (
                      <td className="rc-td-actions">
                        <button
                          type="button"
                          onClick={() => removeEntry(i)}
                          className="rc-row-remove"
                          aria-label={`Supprimer la ligne ${entry.subject}`}
                          title="Supprimer cette ligne"
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}

            {editable && (
              <tr className="rc-add-row">
                <td colSpan={6}>
                  <button
                    type="button"
                    onClick={addEntry}
                    className="rc-row-add"
                  >
                    + Ajouter une matière
                  </button>
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            {/* Ligne TOTAL — TOTAL OBTENU = Σ(grade × coef)
                                TOTAL MAX    = Σ(maxGrade × coef) */}
            <tr className="rc-tfoot-total">
              <td className="rc-tfoot-label">TOTAL</td>
              <td className="rc-tfoot-center">
                {validEntries.length > 0 ? pointsObtained.toFixed(1) : '—'}
              </td>
              <td className="rc-tfoot-center">
                {pointsTotal > 0 ? pointsTotal.toFixed(0) : '—'}
              </td>
              <td />
              <td className="rc-tfoot-hint">
                Σ(note × coef) / Σ(barème × coef)
              </td>
              {editable && <td />}
            </tr>
            {/* Ligne MOYENNE — scaled selon gradeScale + mention */}
            <tr className="rc-tfoot-moyenne">
              <td className="rc-tfoot-label">MOYENNE /{gradeScale}</td>
              <td colSpan={3} className="rc-tfoot-avg">
                <span className="rc-tfoot-avg-value">
                  {validEntries.length > 0 ? average.toFixed(2) : '—'}
                </span>
              </td>
              <td>
                {validEntries.length > 0 && (
                  <span className="rc-mention">{mention}</span>
                )}
              </td>
              {editable && <td />}
            </tr>
          </tfoot>
        </table>
      </section>

      {/* ============================================================
          Compositions trimestrielles + moyenne annuelle.
          UNIQUEMENT sur le bulletin annuel (3ᵉ trimestre). Sur les
          bulletins T1 et T2, on ne montre pas de récap puisqu'il
          n'y a qu'une seule note d'ensemble disponible.
          ============================================================ */}
      {isAnnual && (
        <section className="rc-compositions" aria-label="Compositions">
          <h3 className="rc-compositions-title">Moyennes par composition</h3>
          <div className="rc-compositions-grid">
            {(
              [
                { key: 'first', label: '1ʳᵉ Compo.' },
                { key: 'second', label: '2ᵉ Compo.' },
                { key: 'third', label: '3ᵉ Compo.' },
                { key: 'annual', label: 'Moy. Annuelle' },
              ] as const
            ).map(({ key, label }) => {
              const value = compositions?.[key];
              return (
                <div key={key} className="rc-comp-cell">
                  <span className="rc-comp-label">{label}</span>
                  {editable ? (
                    <input
                      className="rc-edit-input rc-edit-input--num rc-comp-input"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      max={gradeScale}
                      value={value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCompositions({
                          [key]: v === '' ? null : Number(v),
                        });
                      }}
                      placeholder="—"
                      aria-label={label}
                    />
                  ) : (
                    <span className="rc-comp-value">
                      {value != null && !Number.isNaN(value)
                        ? Number(value).toFixed(2)
                        : '—'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="rc-compositions-hint">Notes sur {gradeScale}</p>
        </section>
      )}

      {/* ============================================================
          Décision du conseil + Observations du conseil des maîtres.
          UNIQUEMENT sur le bulletin annuel — le conseil ne statue
          qu'en fin d'année, après la 3ᵉ composition.
          ============================================================ */}
      {isAnnual && (
        <section className="rc-council" aria-label="Décision et observations du conseil">
          <div className="rc-council-block">
            <h3 className="rc-block-title">Décision du conseil de classe</h3>
            <ul className="rc-council-list">
              {(Object.keys(DECISION_LABELS) as ReportCardDecision[]).map((key) => (
                <li key={key} className="rc-council-item">
                  <label className="rc-council-label">
                    <input
                      type="radio"
                      name="rc-decision"
                      checked={decision === key}
                      disabled={!editable}
                      onChange={() => onDecisionChange?.(key)}
                    />
                    <span>{DECISION_LABELS[key]}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="rc-council-block">
            <h3 className="rc-block-title">Observations du conseil des maîtres</h3>
            <ul className="rc-council-list">
              {(Object.keys(COUNCIL_LABELS) as ReportCardCouncilObservation[]).map(
                (key) => (
                  <li key={key} className="rc-council-item">
                    <label className="rc-council-label">
                      <input
                        type="radio"
                        name="rc-council-obs"
                        checked={councilObservation === key}
                        disabled={!editable}
                        onChange={() => onCouncilObservationChange?.(key)}
                      />
                      <span>{COUNCIL_LABELS[key]}</span>
                    </label>
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Appréciation générale (texte libre) + assiduité */}
      <section className="rc-bottom">
        <div className="rc-block">
          <h3 className="rc-block-title">
            Appréciation générale du conseil de classe
          </h3>
          {editable ? (
            <textarea
              className="rc-edit-input rc-edit-input--area"
              value={generalAppreciation || ''}
              onChange={(e) =>
                onGeneralAppreciationChange?.(e.target.value)
              }
              rows={3}
              placeholder="Appréciation générale…"
            />
          ) : (
            <p className="rc-appreciation-text">
              {generalAppreciation && generalAppreciation.trim().length > 0
                ? generalAppreciation
                : '—'}
            </p>
          )}
        </div>
        {(attendance || editable) && (
          <div className="rc-block">
            <h3 className="rc-block-title">Assiduité</h3>
            <ul className="rc-attendance-list">
              {(
                [
                  { key: 'present', label: 'Présent' },
                  { key: 'absent', label: 'Absent' },
                  { key: 'late', label: 'Retards' },
                ] as const
              ).map(({ key, label }) => (
                <li key={key} className="rc-attendance-item">
                  <span className="rc-attendance-label">{label}</span>
                  {editable ? (
                    <input
                      className="rc-edit-input rc-edit-input--num rc-attendance-input"
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min={0}
                      value={attendance?.[key] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        onAttendanceChange?.({
                          ...(attendance ?? {}),
                          [key]: v === '' ? undefined : Number(v),
                        });
                      }}
                      placeholder="0"
                      aria-label={label}
                    />
                  ) : (
                    <span className="rc-attendance-value">
                      {attendance?.[key] ?? 0}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Signatures */}
      <footer className="rc-signatures">
        <div className="rc-sign">
          <span className="rc-sign-label">Le Professeur principal</span>
          <span className="rc-sign-name">{signatures?.mainTeacher || ''}</span>
        </div>
        <div className="rc-sign">
          <span className="rc-sign-label">Le Chef d'établissement</span>
          <span className="rc-sign-name">
            {signatures?.principal || school.principal || ''}
          </span>
        </div>
        <div className="rc-sign">
          <span className="rc-sign-label">Signature des parents</span>
          <span className="rc-sign-name" />
        </div>
      </footer>

      <p className="rc-issued-at">
        Édité le {issued}
        {school.name ? ` · ${school.name}` : ''}
      </p>

      <div className="rc-bottom-band" aria-hidden />
    </article>
  );
};

export default ReportCardA4;
