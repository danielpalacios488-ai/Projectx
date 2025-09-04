import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import type { Metrics, SentimentAnalysisResult, Suggestion, PositiveHighlight } from '../types';
import { NpsIcon, SentimentIcon, SuggestionIcon, ThumbsUpIcon } from './Icons';

interface DashboardProps {
  metrics: Metrics;
  sentiment: SentimentAnalysisResult;
  suggestions: Suggestion[];
  positiveHighlights: PositiveHighlight[];
  t: (key: string) => string;
}

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#f59e0b',  // amber-500
  negative: '#ef4444',  // red-500
};
const sentimentColors = [COLORS.positive, COLORS.neutral, COLORS.negative];
const csatColors = ["#024675", "#3b82f6", "#60a5fa"];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 p-2 border border-gray-300 rounded-lg shadow-sm backdrop-blur-sm">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}${payload[0].unit || ''}`}</p>
        </div>
      );
    }
    return null;
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}
const Card: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-200/50 ${className}`}>
        {children}
    </div>
);

interface CardHeaderProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}
const CardHeader: React.FC<CardHeaderProps> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4 mb-4">
        <div className="bg-primary/10 p-3 rounded-lg text-primary">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold text-primary">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ metrics, sentiment, suggestions, positiveHighlights, t }) => {
  const sentimentData = [
    { name: t('positive'), value: sentiment.positive },
    { name: t('neutral'), value: sentiment.neutral },
    { name: t('negative'), value: sentiment.negative },
  ];

  const csatData = [
    { name: t('csatService'), value: metrics.csat.service, unit: '%' },
    { name: t('csatDelivery'), value: metrics.csat.delivery, unit: '%' },
    { name: t('csatPlatform'), value: metrics.csat.platform, unit: '%' },
  ];

  const npsScoreColor = metrics.nps.score > 50 ? COLORS.positive : metrics.nps.score > 0 ? COLORS.neutral : COLORS.negative;
  const npsData = [{ name: 'NPS', value: metrics.nps.score }];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Metrics Section */}
      <div className="lg:col-span-3">
         <Card>
            <CardHeader icon={<NpsIcon className="h-6 w-6"/>} title={t('metricsTitle')} description={t('npsDescription')} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* NPS Gauge */}
                <div className="flex flex-col items-center justify-center p-4 border-r-0 md:border-r border-gray-200">
                    <h4 className="font-bold text-lg mb-2">{t('npsTitle')}</h4>
                    <ResponsiveContainer width="100%" height={200}>
                         <RadialBarChart 
                            innerRadius="70%" 
                            outerRadius="100%" 
                            data={npsData} 
                            startAngle={180} 
                            endAngle={0}
                            barSize={30}
                          >
                          <PolarAngleAxis type="number" domain={[-100, 100]} angleAxisId={0} tick={false} />
                          <RadialBar background dataKey='value' angleAxisId={0} fill={npsScoreColor} cornerRadius={10}/>
                          <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-dark-text">
                            {metrics.nps.score}
                          </text>
                          <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-500">
                            NPS Score
                          </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-sm mt-2">
                        <span><span className="font-bold text-green-600">{metrics.nps.promoters}</span> {t('promoters')}</span>
                        <span><span className="font-bold text-amber-600">{metrics.nps.passives}</span> {t('passives')}</span>
                        <span><span className="font-bold text-red-600">{metrics.nps.detractors}</span> {t('detractors')}</span>
                    </div>
                </div>

                {/* CSAT Bars */}
                <div className="flex flex-col items-center p-4">
                    <h4 className="font-bold text-lg mb-2">{t('csatTitle')}</h4>
                     <p className="text-gray-500 text-center text-xs mb-4">{t('csatDescription')}</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={csatData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                            <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}}/>
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}}/>
                            <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]} label={{ position: 'right', fill: '#31353D', fontSize: 14, formatter: (value: number) => `${value}%` }}>
                                {csatData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={csatColors[index % csatColors.length]}/>
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

             </div>
         </Card>
      </div>

      {/* Sentiment Analysis */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader icon={<SentimentIcon className="h-6 w-6"/>} title={t('sentimentTitle')} description={t('sentimentDescription')} />
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                    return (
                      <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                }}
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={sentimentColors[index % sentimentColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* AI Suggestions */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader icon={<SuggestionIcon className="h-6 w-6"/>} title={t('suggestionsTitle')} description={t('suggestionsDescription')} />
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <div key={index} className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600 mb-1">
                    <strong className="font-semibold text-gray-800">{t('originalCommentLabel')}:</strong> "{item.originalComment}"
                  </p>
                  <p className="text-primary font-medium pl-2 border-l-2 border-accent">
                    {item.suggestion}
                  </p>
                </div>
              ))
            ) : (
                <p className="text-gray-500">{/* No suggestions available. */}</p>
            )}
          </div>
        </Card>
      </div>

      {/* What We Did Well */}
      {positiveHighlights.length > 0 && (
        <div className="lg:col-span-3">
            <Card>
                <CardHeader icon={<ThumbsUpIcon className="h-6 w-6"/>} title={t('whatWeDidWellTitle')} description={t('whatWeDidWellDescription')} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {positiveHighlights.map((item, index) => (
                        <div key={index} className="text-sm p-4 bg-green-50 rounded-lg border border-green-200 flex flex-col">
                            <blockquote className="italic text-green-800 border-l-4 border-green-400 pl-3 mb-2 flex-grow">
                                "{item.positiveComment}"
                            </blockquote>
                            <p className="text-green-700 font-semibold self-end mb-2">
                                NPS: {item.npsScore}
                            </p>
                            <p className="text-xs text-green-600">{item.reason}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      )}

    </div>
  );
};
