
import React from 'react';
import type { Language } from '../types';
import { LogoIcon } from './Icons';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const Header: React.FC<HeaderProps> = ({ language, setLanguage, t }) => {
  const buttonBaseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const activeClasses = "bg-primary text-white shadow";
  const inactiveClasses = "text-dark-text hover:bg-primary/10";

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-primary">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
          <button 
            onClick={() => setLanguage('es')}
            className={`${buttonBaseClasses} ${language === 'es' ? activeClasses : inactiveClasses}`}
          >
            {t('spanish')}
          </button>
          <button 
            onClick={() => setLanguage('pt')}
            className={`${buttonBaseClasses} ${language === 'pt' ? activeClasses : inactiveClasses}`}
          >
            {t('portuguese')}
          </button>
        </div>
      </div>
    </header>
  );
};
