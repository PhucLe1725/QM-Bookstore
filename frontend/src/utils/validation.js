import * as Yup from 'yup'

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone number validation (Vietnam format)
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+84|0)[3-9]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Password strength validation
export const validatePasswordStrength = (password) => {
  const minLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  const score = [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
  
  return {
    isValid: score >= 3,
    score,
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  }
}

// Common validation schemas
export const validationSchemas = {
  email: Yup.string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
    
  password: Yup.string()
    .required('Mật khẩu là bắt buộc')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    
  confirmPassword: Yup.string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
    
  phone: Yup.string()
    .required('Số điện thoại là bắt buộc')
    .matches(/^(\+84|0)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
    
  name: Yup.string()
    .required('Tên là bắt buộc')
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được quá 50 ký tự'),
    
  required: (fieldName) => Yup.string().required(`${fieldName} là bắt buộc`)
}

// Form validation schemas
export const loginSchema = Yup.object({
  email: validationSchemas.email,
  password: Yup.string().required('Mật khẩu là bắt buộc')
})

export const registerSchema = Yup.object({
  name: validationSchemas.name,
  email: validationSchemas.email,
  password: validationSchemas.password,
  confirmPassword: validationSchemas.confirmPassword,
  phone: validationSchemas.phone
})

export const contactSchema = Yup.object({
  name: validationSchemas.name,
  email: validationSchemas.email,
  subject: validationSchemas.required('Chủ đề'),
  message: Yup.string()
    .required('Tin nhắn là bắt buộc')
    .min(10, 'Tin nhắn phải có ít nhất 10 ký tự')
})