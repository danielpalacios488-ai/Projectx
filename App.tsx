import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DataSource } from './components/DataSource';
import { Dashboard } from './components/Dashboard';
import { Loader } from './components/Loader';
import { useLocalization } from './localization';
import { fetchAndParseSheet, calculateMetrics } from './services/dataService';
import { analyzeSentiment, generateSuggestions, findPositiveHighlights } from './services/geminiService';
import type { Language, FeedbackData, Metrics, SentimentAnalysisResult, Suggestion, PositiveHighlight } from './types';

// The data source is now hardcoded for a permanent connection.
const HARDCODED_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1p3R72zbazDiZ-jqfwIseEptZztagqt1z4FpAwbYmBz4/edit?gid=557438093#gid=557438093';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('es');
  const { t } = useLocalization(language); // Pass language directly to the hook

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [feedbackData, setFeedbackData] = useState<FeedbackData[] | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [positiveHighlights, setPositiveHighlights] = useState<PositiveHighlight[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  
  const handleAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!dataLoaded) {
      setFeedbackData(null);
      setMetrics(null);
      setSentiment(null);
      setSuggestions([]);
      setPositiveHighlights([]);
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setError(t('errorDateRange'));
        setIsLoading(false);
        return;
    }

    try {
      const data = await fetchAndParseSheet(HARDCODED_SHEET_URL);

      const filteredData = data.filter(item => {
        // If there's no date on the item, it cannot be part of a date-filtered set.
        if (!item.date) return false;
        
        const dateParts = item.date.split(' ')[0].split('/'); // "DD/MM/YYYY"
        if (dateParts.length !== 3) return false;

        // Create a UTC date object for midnight on that day for reliable comparison.
        const itemDateUTC = new Date(Date.UTC(
            parseInt(dateParts[2], 10),
            parseInt(dateParts[1], 10) - 1, // Month is 0-indexed
            parseInt(dateParts[0], 10)
        ));
        
        if (isNaN(itemDateUTC.getTime())) return false;

        // If no date range is selected, include all items with a valid date.
        if (!startDate && !endDate) return true;
        
        let passes = true;
        if (startDate) {
            const start = new Date(startDate);
            const startDateUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
            if (itemDateUTC < startDateUTC) passes = false;
        }
        if (endDate) {
            const end = new Date(endDate);
            const endDateUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
            if (itemDateUTC > endDateUTC) passes = false;
        }
        return passes;
      });

      if (filteredData.length === 0) {
        throw new Error(t('errorNoData'));
      }
      setFeedbackData(filteredData);
      
      const calculatedMetrics = calculateMetrics(filteredData);
      setMetrics(calculatedMetrics);

      const allFeedbackText = filteredData.map(row => `${row.whyUs || ''} ${row.whatBetter || ''} ${row.wowIdeas || ''}`).join('\n');
      const [sentimentResult, suggestionsResult, highlightsResult] = await Promise.all([
        analyzeSentiment(allFeedbackText),
        generateSuggestions(filteredData, language),
        findPositiveHighlights(filteredData, language)
      ]);

      setSentiment(sentimentResult);
      setSuggestions(suggestionsResult);
      setPositiveHighlights(highlightsResult);
      setDataLoaded(true);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('errorUnknown'));
      }
      setDataLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, language, t, dataLoaded]);
  
  useEffect(() => {
    const getSuggestionsInNewLanguage = async () => {
        if (feedbackData && feedbackData.length > 0 && !isLoading) {
            setIsLoading(true);
            try {
                const [suggestionsResult, highlightsResult] = await Promise.all([
                    generateSuggestions(feedbackData, language),
                    findPositiveHighlights(feedbackData, language)
                ]);
                setSuggestions(suggestionsResult);
                setPositiveHighlights(highlightsResult);
            } catch (err) {
                 if (err instanceof Error) {
                    setError(t('errorSuggestions') + ': ' + err.message);
                } else {
                    setError(t('errorSuggestions'));
                }
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    // To avoid running on mount, we check if metrics are already present
    if (metrics) {
        getSuggestionsInNewLanguage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return (
    <div className="min-h-screen bg-background text-dark-text font-sans">
      <Header language={language} setLanguage={setLanguage} t={t} />
      <main className="container mx-auto p-4 md:p-8">
        <DataSource 
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onAnalyze={handleAnalysis}
          isLoading={isLoading}
          dataLoaded={dataLoaded}
          t={t}
        />

        {isLoading && !metrics && <Loader t={t} />}

        {error && (
          <div className="mt-8 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md" role="alert">
            <strong className="font-bold">{t('errorTitle')}</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {!error && metrics && sentiment && (
          <Dashboard 
            metrics={metrics}
            sentiment={sentiment}
            suggestions={suggestions}
            positiveHighlights={positiveHighlights}
            t={t}
          />
        )}
      </main>
    </div>
  );
};

export default App;