// Email validation - stricter pattern
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Phone validation for Senegal and international formats
export const validatePhone = (phone: string): boolean => {
  if (!phone.trim()) return true; // Phone is optional
  
  // Remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Senegalese format: +221XXXXXXXXX or 221XXXXXXXXX or XXXXXXXXX (9-10 digits)
  // International format: +XXX followed by digits
  const phoneRegex = /^(\+?221\d{8,9}|\+\d{1,3}\d{6,14}|\d{8,15})$/;
  
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8;
};

// Check if email is not a disposable email
export const isDisposableEmail = (email: string): boolean => {
  const disposableDomains = [
    'tempmail.com',
    'mailinator.com',
    '10minutemail.com',
    'guerrillamail.com',
    'temp-mail.org',
    'maildrop.cc',
    'sharklasers.com',
    'throwaway.email',
    'emailondeck.com'
  ];
  
  const domain = email.toLowerCase().split('@')[1];
  return disposableDomains.includes(domain);
};

// Format phone number for display
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('221')) {
    // Senegalese format: +221 XX XXX XXXX
    return `+221 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.length === 9) {
    // Local Senegalese format: XX XXX XXXX
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
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
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
