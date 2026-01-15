'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const countries = [
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', dial: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dial: '+41', flag: '🇨🇭' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { code: 'MC', name: 'Monaco', dial: '+377', flag: '🇲🇨' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'DE', name: 'Allemagne', dial: '+49', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', dial: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', dial: '+39', flag: '🇮🇹' },
  { code: 'GB', name: 'Royaume-Uni', dial: '+44', flag: '🇬🇧' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Pays-Bas', dial: '+31', flag: '🇳🇱' },
  { code: 'US', name: 'États-Unis', dial: '+1', flag: '🇺🇸' },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  name?: string
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  className,
  id,
  name,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse initial value to extract country code and number
  useEffect(() => {
    if (value) {
      // Try to find matching country code
      const matchedCountry = countries.find(c => value.startsWith(c.dial))
      if (matchedCountry) {
        setSelectedCountry(matchedCountry)
        setPhoneNumber(value.slice(matchedCountry.dial.length).trim())
      } else {
        // Assume it's a local French number
        setPhoneNumber(value.replace(/^0/, ''))
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country)
    setIsOpen(false)
    // Update the full value
    if (phoneNumber) {
      onChange(`${country.dial} ${phoneNumber}`)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d\s]/g, '')
    setPhoneNumber(newNumber)
    if (newNumber) {
      onChange(`${selectedCountry.dial} ${newNumber}`)
    } else {
      onChange('')
    }
  }

  const formatPlaceholder = () => {
    switch (selectedCountry.code) {
      case 'FR':
        return '6 12 34 56 78'
      case 'BE':
        return '4 12 34 56 78'
      case 'CH':
        return '79 123 45 67'
      default:
        return '123 456 789'
    }
  }

  return (
    <div className={cn('flex', className)} ref={dropdownRef}>
      {/* Country Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-l-xl border-r-0',
            'bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-accent/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="text-sm text-kopro-grey">{selectedCountry.dial}</span>
          <ChevronDown className={cn(
            'h-4 w-4 text-kopro-grey transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-60 overflow-y-auto">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent-light transition-colors',
                  selectedCountry.code === country.code && 'bg-accent-light'
                )}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-sm text-kopro-dark">{country.name}</span>
                <span className="text-sm text-kopro-grey">{country.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <input
        type="tel"
        id={id}
        name={name}
        value={phoneNumber}
        onChange={handlePhoneChange}
        disabled={disabled}
        placeholder={formatPlaceholder()}
        className={cn(
          'flex-1 px-4 py-2.5 rounded-r-xl border border-gray-200',
          'bg-white text-kopro-dark placeholder:text-kopro-grey/50',
          'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
          'transition-all duration-200',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
        )}
      />
    </div>
  )
}
