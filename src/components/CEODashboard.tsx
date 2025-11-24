import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getScrapDataForWeek } from '../utils/scrapQueries';

interface KPIData {
  name: string;
  value: number;
  target: number;
  tolerance: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'critical' | 'warning' | 'good';
}

interface WeeklyReport {
  summary: string;
  criticalIssues: string[];
  recommendations: string[];
  generatedAt: string;
}

export function CEODashboard() {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const scrapData = await getScrapDataForWeek();

      const mockKPIs: KPIData[] = [
        {
          name: 'Ausschuss Woche',
          value: scrapData.totalScrap,
          target: scrapData.target,
          tolerance: scrapData.tolerance,
          unit: 'Teile',
          trend: 'up',
          trendPercentage: 12,
          status: scrapData.color === 'red' ? 'critical' : scrapData.color === 'yellow' ? 'warning' : 'good',
        },
      ];

      setKpis(mockKPIs);
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const aggregatedData = {
        period: 'Letzte 7 Tage',
        kpis: kpis.map(kpi => ({
          name: kpi.name,
          value: kpi.value,
          target: kpi.target,
          tolerance: kpi.tolerance,
          status: kpi.status,
          trend: kpi.trend,
          trendPercentage: kpi.trendPercentage,
        })),
      };

      const mockReport: WeeklyReport = {
        summary: `In den letzten 7 Tagen wurden ${kpis[0]?.value || 0} Ausschussteile registriert. Das Ziel von ${kpis[0]?.target || 0} Teilen wurde um ${Math.round(((kpis[0]?.value || 0) / (kpis[0]?.target || 1) - 1) * 100)}% überschritten.`,
        criticalIssues: kpis
          .filter(kpi => kpi.status === 'critical')
          .map(kpi => `${kpi.name}: ${kpi.value} ${kpi.unit} (Ziel: ${kpi.target})`),
        recommendations: [
          'Überprüfen Sie die Maschinen mit dem höchsten Ausschuss',
          'Analysieren Sie die Ursachen für erhöhten Ausschuss',
          'Schulung der Mitarbeiter zur Qualitätssicherung empfohlen',
        ],
        generatedAt: new Date().toISOString(),
      };

      setWeeklyReport(mockReport);
    } catch (error) {
      console.error('Fehler beim Generieren des Reports:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'good':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'good':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CEO Dashboard</h1>
          <p className="text-gray-600 mt-1">Überblick über kritische Kennzahlen</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Aktualisieren</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-6 ${getStatusColor(kpi.status)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">{kpi.name}</h3>
              {getStatusIcon(kpi.status)}
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">{kpi.value}</span>
                <span className="text-sm text-gray-600">{kpi.unit}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                ) : kpi.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : null}
                <span
                  className={
                    kpi.trend === 'up' ? 'text-red-600' : kpi.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                  }
                >
                  {kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '-' : ''}
                  {kpi.trendPercentage}% vs. letzte Woche
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ziel:</span>
                  <span className="font-medium text-gray-900">{kpi.target} {kpi.unit}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Toleranz:</span>
                  <span className="font-medium text-gray-900">{kpi.tolerance} {kpi.unit}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      kpi.status === 'critical'
                        ? 'bg-red-600'
                        : kpi.status === 'warning'
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min((kpi.value / kpi.tolerance) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Wöchentlicher KPI-Report</h2>
            <p className="text-sm text-gray-600 mt-1">
              Automatisch generierte Analyse und Handlungsempfehlungen
            </p>
          </div>
          <button
            onClick={generateWeeklyReport}
            disabled={isGeneratingReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGeneratingReport ? 'Generiere...' : 'Report generieren'}
          </button>
        </div>

        {weeklyReport ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Zusammenfassung</h3>
              <p className="text-gray-700">{weeklyReport.summary}</p>
            </div>

            {weeklyReport.criticalIssues.length > 0 && (
              <div>
                <h3 className="font-medium text-red-900 mb-2 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Kritische Probleme</span>
                </h3>
                <ul className="space-y-2">
                  {weeklyReport.criticalIssues.map((issue, index) => (
                    <li key={index} className="flex items-start space-x-2 text-red-700">
                      <span className="text-red-600 mt-1">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Handlungsempfehlungen</h3>
              <ul className="space-y-2">
                {weeklyReport.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Generiert am: {new Date(weeklyReport.generatedAt).toLocaleString('de-DE')}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Klicken Sie auf "Report generieren", um eine KI-basierte Analyse zu erstellen</p>
          </div>
        )}
      </div>
    </div>
  );
}
