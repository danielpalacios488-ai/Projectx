import React from 'react';
import { AnalyzeIcon, RefreshIcon } from './Icons';

interface DataSourceProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  dataLoaded: boolean;
  t: (key:string) => string;
}

export const DataSource: React.FC<DataSourceProps> = ({ 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  onAnalyze, 
  isLoading, 
  dataLoaded,
  t 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/50 mb-8">
      <h2 className="text-2xl font-bold text-primary mb-2">{t('dataSourceTitle')}</h2>
      <p className="text-gray-500 mb-4">{t('dataSourceSubtitle')}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="block text-md font-bold text-primary mb-2">{t('filterByDateTitle')}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">{t('startDate')}</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-1">{t('endDate')}</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                disabled={isLoading}
              />
            </div>
          </div>
        </fieldset>
        
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-lg hover:bg-orange-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
          disabled={isLoading}
        >
          {dataLoaded ? <RefreshIcon className="h-5 w-5" /> : <AnalyzeIcon className="h-5 w-5"/>}
          <span>{isLoading ? t('analyzing') : (dataLoaded ? t('refresh') : t('analyze'))}</span>
        </button>
      </form>
    </div>
  );
};