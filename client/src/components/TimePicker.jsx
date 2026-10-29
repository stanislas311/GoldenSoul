import { useState } from 'react';
import { Clock as ClockIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TimePicker({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('commun.choisirHeure');
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const selectedHour = value ? parseInt(value.split(':')[0]) : null;
  const selectedMinute = value ? parseInt(value.split(':')[1]) : null;

  const handleHourClick = (hour) => {
    const minute = selectedMinute || 0;
    onChange(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  };

  const handleMinuteClick = (minute) => {
    const hour = selectedHour || 0;
    onChange(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 px-4 text-ivory/70 focus:outline-none focus:border-gold transition-colors flex items-center justify-between"
      >
        <span>{value ? value : defaultPlaceholder}</span>
        <ClockIcon size={18} className="text-ivory/40" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-jade border border-ivory/10 rounded-2xl p-4 shadow-2xl w-full">
          <div className="grid grid-cols-2 gap-4">
            {/* Hours */}
            <div>
              <p className="text-xs text-ivory/50 mb-2 font-medium">{t('commun.heures')}</p>
              <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourClick(hour)}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                      ${selectedHour === hour ? 'bg-gold text-ink' : 'hover:bg-ivory/10 text-ivory/70'}
                    `}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <p className="text-xs text-ivory/50 mb-2 font-medium">{t('commun.minutes')}</p>
              <div className="grid grid-cols-2 gap-1">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteClick(minute)}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                      ${selectedMinute === minute ? 'bg-gold text-ink' : 'hover:bg-ivory/10 text-ivory/70'}
                    `}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 text-sm text-ivory/50 hover:text-ivory transition-colors"
          >
            {t('commun.fermer')}
          </button>
        </div>
      )}
    </div>
  );
}

export default TimePicker;
