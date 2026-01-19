import DOMPurify from "isomorphic-dompurify"

export const security = {
  // Sanitize text input (prevent XSS)
  sanitizeText: (input: string): string => {
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email) && email.length <= 254
  },

  // Validate password strength
  isValidPassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) errors.push("At least 8 characters")
    if (password.length > 128) errors.push("Maximum 128 characters")
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter")
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter")
    if (!/[0-9]/.test(password)) errors.push("One number")
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("One special character")

    return { valid: errors.length === 0, errors }
  },

  // Sanitize and validate full name
  sanitizeName: (name: string): string => {
    const sanitized = DOMPurify.sanitize(name.trim())
    const cleaned = sanitized.replace(/[^a-zA-Z\s'-]/g, "")
    return cleaned.slice(0, 100)
  },

  // Sanitize company name
  sanitizeCompanyName: (name: string): string => {
    const sanitized = DOMPurify.sanitize(name.trim())
    const cleaned = sanitized.replace(/[^a-zA-Z0-9\s.,&'-]/g, "")
    return cleaned.slice(0, 200)
  },

  // Prevent brute force - track failed attempts
  checkRateLimit: (key: string, maxAttempts = 5, windowMs = 900000): boolean => {
    const now = Date.now()
    const attempts = JSON.parse(localStorage.getItem(`rl_${key}`) || "[]")

    const recentAttempts = attempts.filter((time: number) => now - time < windowMs)

    if (recentAttempts.length >= maxAttempts) {
      return false
    }

    recentAttempts.push(now)
    localStorage.setItem(`rl_${key}`, JSON.stringify(recentAttempts))
    return true
  },

  // Clear rate limit (on successful login)
  clearRateLimit: (key: string): void => {
    localStorage.removeItem(`rl_${key}`)
  },
}

export const validateEmail = (email: string): boolean => {
  return security.isValidEmail(email)
}

export const sanitizeInput = (input: string): string => {
  return security.sanitizeText(input)
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  return security.isValidPassword(password)
}

export const sanitizeName = (name: string): string => {
  return security.sanitizeName(name)
}

export const sanitizeCompanyName = (name: string): string => {
  return security.sanitizeCompanyName(name)
}

export const checkRateLimit = (key: string, maxAttempts = 5, windowMs = 900000): boolean => {
  return security.checkRateLimit(key, maxAttempts, windowMs)
}

export const clearRateLimit = (key: string): void => {
  return security.clearRateLimit(key)
}
