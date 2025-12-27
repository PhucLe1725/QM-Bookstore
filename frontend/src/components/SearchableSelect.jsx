import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

/**
 * SearchableSelect Component
 * A custom select dropdown with search functionality
 * 
 * @param {Array} options - Array of {id, name, displayName, level} objects
 * @param {string|number} value - Selected value (id)
 * @param {function} onChange - Callback when value changes
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional CSS classes
 */
const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Chọn...', 
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Find selected option
  const selectedOption = options.find(opt => opt.id === value)
  const displayText = selectedOption ? selectedOption.displayName || selectedOption.name : placeholder

  // Filter options based on search - only search by name (string)
  // displayName can be JSX, so we can't call .toLowerCase() on it
  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (optionId) => {
    onChange(optionId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between ${
          disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        } ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {displayText}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <X 
              className="w-4 h-4 text-gray-400 hover:text-gray-600" 
              onClick={handleClear}
            />
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors ${
                    option.id === value ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'
                  }`}
                >
                  {option.displayName || option.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
