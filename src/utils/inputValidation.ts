
// Comprehensive input validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim();
  
  if (!trimmedEmail) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

// Numeric validation
export const validateAmount = (amount: string | number): ValidationResult => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return { isValid: false, message: 'Please enter a valid amount' };
  }
  
  if (numericAmount < 0) {
    return { isValid: false, message: 'Amount cannot be negative' };
  }
  
  if (numericAmount > 999999999.99) {
    return { isValid: false, message: 'Amount is too large' };
  }
  
  return { isValid: true };
};

// Text input validation
export const validateText = (text: string, fieldName: string, minLength = 1, maxLength = 255): ValidationResult => {
  const trimmedText = text.trim();
  
  if (!trimmedText && minLength > 0) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  if (trimmedText.length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters long` };
  }
  
  if (trimmedText.length > maxLength) {
    return { isValid: false, message: `${fieldName} cannot exceed ${maxLength} characters` };
  }
  
  return { isValid: true };
};

// Phone number validation
export const validatePhone = (phone: string): ValidationResult => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[^\d\+]/g, '');
  
  if (!cleanPhone) {
    return { isValid: true }; // Phone is optional in most cases
  }
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }
  
  return { isValid: true };
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// HTML sanitization for rich text
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Validate and sanitize form data
export const validateFormData = (data: Record<string, any>, rules: Record<string, (value: any) => ValidationResult>): { isValid: boolean; errors: Record<string, string>; sanitizedData: Record<string, any> } => {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};
  let isValid = true;
  
  for (const [field, value] of Object.entries(data)) {
    if (rules[field]) {
      const validation = rules[field](value);
      if (!validation.isValid) {
        errors[field] = validation.message || 'Invalid input';
        isValid = false;
      }
    }
    
    // Sanitize string inputs
    if (typeof value === 'string') {
      sanitizedData[field] = sanitizeInput(value);
    } else {
      sanitizedData[field] = value;
    }
  }
  
  return { isValid, errors, sanitizedData };
};

// Rate limiting helper
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const record = attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  };
};
