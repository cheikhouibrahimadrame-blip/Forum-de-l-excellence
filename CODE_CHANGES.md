# Code Changes Reference

## 1. Validation Utility File (NEW)

**File:** `app/src/utils/validation.ts`

```typescript
// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Check if email is from a disposable/temporary service
export const isDisposableEmail = (email: string): boolean => {
  const disposableDomains = [
    'tempmail.com',
    '10minutemail.com',
    'mailinator.com',
    'guerrillamail.com',
    'temp-mail.org',
    'throwaway.email',
    'yopmail.com',
    'maildrop.cc',
    'mailnesia.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
};

// Phone validation
export const validatePhone = (phone: string): boolean => {
  // Senegal: +221XXXXXXXXX or XXXXXXXXX
  const senegalPhone = /^(\+221|0)?[0-9]{9}$/;
  // International: +XXX followed by 6-14 digits
  const internationalPhone = /^\+[0-9]{1,3}[0-9]{6,14}$/;
  
  return senegalPhone.test(phone) || internationalPhone.test(phone);
};

// Format phone number for display
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('221') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  return phone;
};

// Validate password strength
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule (A-Z)');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule (a-z)');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre (0-9)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## 2. RegisterPage.tsx Changes

### Import Statement (ADDED)
```typescript
import { validateEmail, validatePhone, isDisposableEmail, validatePasswordStrength } from '../../utils/validation';
```

### Email Field (UPDATED)
```tsx
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
```

### Password Field (UPDATED with Strength Indicator)
```tsx
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
  {/* Confirm Password on right side */}
</div>
```

### Phone Field (UPDATED with Validation)
```tsx
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
```

### Validation Function (UPDATED)
```typescript
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
```

## 3. Backend Controller Changes

### File: `backend/src/controllers/authController.ts`

#### Validation Rules (UPDATED)
```typescript
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
    .isLength({ max: 254 })
    .withMessage('Email trop long'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe requis (minimum 8 caractères)')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('firstName').isLength({ min: 2 }).withMessage('Prénom requis (minimum 2 caractères)'),
  body('lastName').isLength({ min: 2 }).withMessage('Nom requis (minimum 2 caractères)'),
  body('phone')
    .optional({ checkFalsy: true })
    .custom((value) => {
      const senegalPhone = /^(\+221|0)?[0-9]{9}$/;
      const internationalPhone = /^\+[0-9]{1,3}[0-9]{6,14}$/;
      if (!senegalPhone.test(value) && !internationalPhone.test(value)) {
        throw new Error('Numéro de téléphone invalide. Format Sénégal: +221XXXXXXXXX ou international: +XXX...');
      }
      return true;
    }),
  body('role').isIn(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']).withMessage('Rôle invalide')
];
```

#### Register Function (UPDATED)
```typescript
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { email, password, firstName, lastName, role, phone, ...profileData } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email déjà utilisé'
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        phone: phone || null,
        // ... rest of user creation
      },
      include: {
        student: true,
        parent: true,
        teacher: true,
        admin: true
      }
    });
    
    // ... rest of function
  } catch (error) {
    // ... error handling
  }
};
```

## Summary of Changes

| Component | Change | Type | Lines |
|-----------|--------|------|-------|
| validation.ts | NEW file with 5 validation functions | Create | 70 |
| RegisterPage.tsx | Email validation feedback | Modify | +25 |
| RegisterPage.tsx | Phone validation feedback | Modify | +20 |
| RegisterPage.tsx | Password strength indicator | Modify | +25 |
| RegisterPage.tsx | validateStep1 function | Modify | +12 |
| authController.ts | registerValidation rules | Modify | +15 |
| authController.ts | register function (phone storage) | Modify | +2 |

**Total Changes: 7 modifications, 1 new file, 169 lines of code**

