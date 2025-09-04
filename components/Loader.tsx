
import React from 'react';

interface LoaderProps {
  t: (key: string) => string;
}

export const Loader: React.FC<LoaderProps> = ({ t }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 mt-8 bg-white/50 rounded-lg">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-primary">{t('loading')}</p>
    </div>
  );
};
