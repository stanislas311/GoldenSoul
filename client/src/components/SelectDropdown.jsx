import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function SelectDropdown({ value, onChange, options, placeholder }) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('commun.choisirOption');
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 px-4 text-ivory/70 focus:outline-none focus:border-gold transition-colors flex items-center justify-between"
      >
        <span>{selectedOption ? selectedOption.label : defaultPlaceholder}</span>
        <ChevronDown size={18} className={`text-ivory/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-jade border border-ivory/10 rounded-2xl shadow-2xl w-full max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-3 text-left flex items-center justify-between transition-colors
                ${value === option.value ? 'bg-gold/10 text-gold' : 'hover:bg-ivory/10 text-ivory/70'}
              `}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectDropdown;
