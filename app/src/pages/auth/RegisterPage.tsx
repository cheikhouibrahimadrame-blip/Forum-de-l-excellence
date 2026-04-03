import type React from 'react';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { validateEmail, validatePhone, isDisposableEmail, validatePasswordStrength } from '../../utils/validation';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  ChevronDown,
  CheckCircle
} from 'lucide-react';

type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER';

// Registration disabled: Admin creates all accounts
const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') as UserRole || 'STUDENT';
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Student fields
    studentId: '',
    dateOfBirth: '',
    major: '',
    // Teacher fields
    employeeId: '',
    specialization: '',
    // Parent fields
    relationship: '',
    occupation: '',
    address: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('Le prénom est requis');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!validateEmail(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }
    if (isDisposableEmail(formData.email)) {
      setError('Les adresses email temporaires ne sont pas acceptées');
      return false;
    }
    if (formData.phone.trim() && !validatePhone(formData.phone)) {
      setError('Veuillez entrer un numéro de téléphone valide (ex: +221775368254)');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    const passwordCheck = validatePasswordStrength(formData.password);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.errors[0]);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (role === 'STUDENT') {
      if (!formData.studentId.trim()) {
        setError('L\'ID élève est requis');
        return false;
      }
      if (!formData.dateOfBirth) {
        setError('La date de naissance est requise');
        return false;
      }
    } else if (role === 'TEACHER') {
      if (!formData.employeeId.trim()) {
        setError('L\'ID employé est requis');
        return false;
      }
      if (!formData.specialization.trim()) {
        setError('La spécialisation est requise');
        return false;
      }
    } else if (role === 'PARENT') {
      if (!formData.relationship.trim()) {
        setError('La relation est requise');
        return false;
      }
      if (!formData.address.trim()) {
        setError('L\'adresse est requise');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      setError('');
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const profileData: any = {
        phone: formData.phone
      };

      if (role === 'STUDENT') {
        profileData.studentId = formData.studentId;
        profileData.dateOfBirth = formData.dateOfBirth;
        profileData.enrollmentDate = new Date().toISOString().split('T')[0];
      } else if (role === 'TEACHER') {
        profileData.employeeId = formData.employeeId;
        profileData.specialization = formData.specialization;
      } else if (role === 'PARENT') {
        profileData.relationship = formData.relationship;
        profileData.occupation = formData.occupation;
        profileData.address = formData.address;
      }

      setError("L'inscription est gérée par l'administration. Veuillez contacter l'école.");
      return;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };


  return null;
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <img 
          src="/logo.jpeg" 
          alt="Forum de L'excellence" 
          className="w-16 h-16 rounded-lg object-cover mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Inscription
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          Créez votre compte pour rejoindre le Forum de L'excellence
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-[var(--color-primary-navy)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-[var(--color-primary-navy)]' : 'bg-[var(--color-border)]'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-[var(--color-primary-navy)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}>
            2
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 ? (
          /* Step 1: Basic Info */
          <>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Je m'inscris en tant que
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['STUDENT', 'PARENT', 'TEACHER'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      role === r
                        ? 'bg-[var(--color-primary-navy)] text-white border-[var(--color-primary-navy)]'
                        : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary-navy)]'
                    }`}
                  >
                    {r === 'STUDENT' ? 'Élève' : r === 'PARENT' ? 'Parent' : 'Enseignant'}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="Votre prénom"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`input-field pl-10 ${
                    formData.email && isDisposableEmail(formData.email)
                      ? 'border-red-500 focus:ring-red-500'
                      : formData.email && validateEmail(formData.email)
                      ? 'border-green-500 focus:ring-green-500'
                      : ''
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
              {formData.email && isDisposableEmail(formData.email) && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Cet email temporaire n'est pas accepté. Veuillez utiliser un email personnel ou professionnel.
                </p>
              )}
              {formData.email && !validateEmail(formData.email) && !isDisposableEmail(formData.email) && (
                <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Format d'email invalide
                </p>
              )}
              {formData.email && validateEmail(formData.email) && !isDisposableEmail(formData.email) && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Email valide
                </p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-2">Force du mot de passe:</p>
                    <ul className="text-xs space-y-1 text-blue-700">
                      <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Au moins 8 caractères
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Une majuscule (A-Z)
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Une minuscule (a-z)
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        ✓ Un chiffre (0-9)
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input-field ${
                  formData.phone && !validatePhone(formData.phone)
                    ? 'border-red-500 focus:ring-red-500'
                    : formData.phone && validatePhone(formData.phone)
                    ? 'border-green-500 focus:ring-green-500'
                    : ''
                }`}
                placeholder="+221 775368254"
              />
              {formData.phone && !validatePhone(formData.phone) && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Format invalide. Utilisez +221XXXXXXXXX ou +XXX (international)
                </p>
              )}
              {formData.phone && validatePhone(formData.phone) && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Numéro valide
                </p>
              )}
              {!formData.phone && (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Format Sénégal: +221XXXXXXXXX ou numéro international: +XXX ...
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full btn-primary py-3"
            >
              Suivant
            </button>
          </>
        ) : (
          /* Step 2: Role-specific info */
          <>
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-6"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              Retour
            </button>

            {role === 'STUDENT' && (
              <>
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    ID Élève
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="STU-2024-XXXX"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Date de Naissance
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
              </>
            )}

            {role === 'PARENT' && (
              <>
                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Relation avec l'élève
                  </label>
                  <select
                    id="relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    required
                    className="input-field appearance-none bg-no-repeat bg-right"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="">Sélectionnez une relation</option>
                    <option value="Père">Père</option>
                    <option value="Mère">Mère</option>
                    <option value="Tuteur">Tuteur</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="occupation" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Profession (optionnel)
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Votre profession"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Votre adresse complète"
                  />
                </div>
              </>
            )}

            {role === 'TEACHER' && (
              <>
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    ID Employé
                  </label>
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="EMP-2024-XXXX"
                  />
                </div>
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Spécialisation
                  </label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Votre domaine d'expertise"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-[var(--color-primary-navy)] hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;