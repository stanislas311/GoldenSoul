import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function DatePicker({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('commun.choisirDate');
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [position, setPosition] = useState({ top: 'bottom', maxHeight: '60vh' });
  const [manualInput, setManualInput] = useState('');
  const [inputError, setInputError] = useState('');
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedDate = value ? new Date(value) : null;

  // Initialiser l'input manuel avec la valeur existante
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      setManualInput(`${day}/${month}/${year}`);
    } else {
      setManualInput('');
    }
  }, [value]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = [
    t('commun.mois.1'), t('commun.mois.2'), t('commun.mois.3'), t('commun.mois.4'),
    t('commun.mois.5'), t('commun.mois.6'), t('commun.mois.7'), t('commun.mois.8'),
    t('commun.mois.9'), t('commun.mois.10'), t('commun.mois.11'), t('commun.mois.12')
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const calculatePosition = () => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const estimatedDropdownHeight = 350;

    if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
      setPosition({ top: 'top', maxHeight: `${spaceAbove - 20}px` });
    } else {
      setPosition({ top: 'bottom', maxHeight: `${spaceBelow - 20}px` });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      const handleResize = () => calculatePosition();
      const handleScroll = () => calculatePosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen]);

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(newDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handleManualInputChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Supprimer tous les caractères non numériques

    // Limiter à 8 chiffres (jjmmaaaa)
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    // Ajouter les "/" automatiquement
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5);
    }

    setManualInput(value);
    setInputError('');

    // Si le format est complet (jj/mm/aaaa), valider et mettre à jour
    if (value.length === 10) {
      const parts = value.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Validation de base
      if (month < 1 || month > 12) {
        setInputError(t('commun.erreursDate.moisInvalide'));
        return;
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      if (day < 1 || day > daysInMonth) {
        setInputError(t('commun.erreursDate.jourInvalide'));
        return;
      }

      if (year < 1900 || year > 2100) {
        setInputError(t('commun.erreursDate.anneeInvalide'));
        return;
      }

      // Date valide, mettre à jour
      const newDate = new Date(year, month - 1, day);
      onChange(newDate.toISOString().split('T')[0]);
      setIsOpen(false);
    }
  };

  const handleManualInputBlur = () => {
    if (manualInput.length > 0 && manualInput.length !== 10) {
      setInputError(t('commun.erreursDate.formatAttendu'));
    }
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={manualInput}
          onChange={handleManualInputChange}
          onBlur={handleManualInputBlur}
          placeholder={defaultPlaceholder}
          maxLength={10}
          className={`w-full bg-jade/50 border rounded-xl py-3 pl-4 pr-12 text-ivory/70 focus:outline-none transition-colors ${
            inputError ? 'border-red-400 focus:border-red-400' : 'border-ivory/10 focus:border-gold'
          }`}
        />
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-gold transition-colors"
        >
          <CalendarIcon size={18} />
        </button>
      </div>

      {inputError && (
        <p className="text-xs text-red-400 mt-1">{inputError}</p>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 bg-jade border border-ivory/10 rounded-2xl p-4 shadow-2xl w-full overflow-y-auto ${
            position.top === 'top' ? 'bottom-full mb-2' : 'mt-2'
          }`}
          style={{ maxHeight: position.maxHeight }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-ivory/10 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-ivory/70" />
            </button>
            <span className="font-display text-lg">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-ivory/10 rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-ivory/70" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {(Array.isArray(t('commun.jours.court')) ? t('commun.jours.court') : ['L', 'M', 'M', 'J', 'V', 'S', 'D']).map((day) => (
              <div key={day} className="text-center text-xs text-ivory/50 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                    ${selected ? 'bg-gold text-ink' : today ? 'bg-ivory/10 text-ivory' : 'hover:bg-ivory/10 text-ivory/70'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
