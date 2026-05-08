import { describe, expect, test } from 'vitest'
import {
  getCustomerValidationError,
  isEmailFormatValid,
  isSwissPhoneFormatValid,
  normalizeSwissPhone,
  SWISS_PHONE_FORMAT_ERROR
} from './customerValidation'

describe('customerValidation', () => {
  test('validiert optionale E-Mail Formate', () => {
    expect(isEmailFormatValid('')).toBe(true)
    expect(isEmailFormatValid('kunde@example.ch')).toBe(true)
    expect(isEmailFormatValid('kunde.example.ch')).toBe(false)
    expect(isEmailFormatValid('kunde@example')).toBe(false)
  })

  test('normalisiert Schweizer Telefonnummern ins Zielformat', () => {
    expect(normalizeSwissPhone('')).toBe('')
    expect(normalizeSwissPhone('+41 44 123 45 67')).toBe('+41 44 123 45 67')
    expect(normalizeSwissPhone('+41791234567')).toBe('+41 79 123 45 67')
    expect(normalizeSwissPhone('+41 079 123 45 67')).toBe('+41 79 123 45 67')
    expect(normalizeSwissPhone('+41 062 222 22 22')).toBe('+41 62 222 22 22')
    expect(normalizeSwissPhone('0041791234567')).toBe('+41 79 123 45 67')
    expect(normalizeSwissPhone('00410791234567')).toBe('+41 79 123 45 67')
    expect(normalizeSwissPhone('0791234567')).toBe('+41 79 123 45 67')
    expect(normalizeSwissPhone('044 123 45 67')).toBe('+41 44 123 45 67')
  })

  test('validiert normalisierbare Schweizer Telefonnummern', () => {
    expect(isSwissPhoneFormatValid('')).toBe(true)
    expect(isSwissPhoneFormatValid('+41 44 123 45 67')).toBe(true)
    expect(isSwissPhoneFormatValid('+41 79 123 45 67')).toBe(true)
    expect(isSwissPhoneFormatValid('+41 079 123 45 67')).toBe(true)
    expect(isSwissPhoneFormatValid('+41 062 222 22 22')).toBe(true)
    expect(isSwissPhoneFormatValid('044 123 45 67')).toBe(true)
    expect(isSwissPhoneFormatValid('0791234567')).toBe(true)
    expect(isSwissPhoneFormatValid('+41 44 1234567')).toBe(true)
    expect(isSwissPhoneFormatValid('+41 44 123 45 6')).toBe(false)
  })

  test('liefert den ersten Validierungsfehler eines Kunden', () => {
    expect(
      getCustomerValidationError({
        email: 'kontakt@example.ch',
        phone: '+41 44 123 45 67'
      })
    ).toBe('')

    expect(
      getCustomerValidationError({
        email: 'kontakt@example.ch',
        phone: '044 123 45 67'
      })
    ).toBe('')

    expect(
      getCustomerValidationError({
        email: 'kontakt@example.ch',
        phone: '12345'
      })
    ).toBe(SWISS_PHONE_FORMAT_ERROR)
  })
})
