"use client";
import { useMemo, useState } from "react";

interface FinancialModelOutputProps {
  data: any;
}

export default function FinancialModelOutput({ data }: FinancialModelOutputProps) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showDetailedTables, setShowDetailedTables] = useState(false);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showKPIs, setShowKPIs] = useState(false);

  if (!data) {
    return <div className="text-gray-500 text-sm">No model data available</div>;
  }

  // Parse JSON if it's a string
  let modelData = data;
  if (typeof data === 'string') {
    try {
      modelData = JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse model data:', error);
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm text-red-900 mb-2">Failed to parse model data</h3>
          <p className="text-xs text-red-700">The response is not valid JSON. Check the Raw API Response below.</p>
        </div>
      );
    }
  }

  console.log('Financial Model Data:', modelData);
  console.log('Model Data Keys:', Object.keys(modelData));
  console.log('Tables:', modelData.tables);
  console.log('Has pnl_summary?', modelData.tables?.pnl_summary ? 'YES' : 'NO');

  const { meta, assumptions, drivers, tables, notes } = modelData;

  // Show diagnostic if no tables found
  if (!tables) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm text-yellow-900 mb-2">No tables found in response</h3>
        <p className="text-xs text-yellow-700 mb-2">The response structure doesn't contain a "tables" field.</p>
        <details className="text-xs text-gray-700">
          <summary className="cursor-pointer mb-1">Response structure:</summary>
          <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-40">
            {JSON.stringify(Object.keys(modelData), null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (!tables.pnl_summary) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm text-yellow-900 mb-2">No P&L summary found in tables</h3>
        <p className="text-xs text-yellow-700 mb-2">The response has a "tables" field but no "pnl_summary".</p>
        <details className="text-xs text-gray-700">
          <summary className="cursor-pointer mb-1">Available tables:</summary>
          <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-40">
            {JSON.stringify(Object.keys(tables), null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Helper function to format currency (without $ sign)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper function to format percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Generate month labels
  const generateMonthLabels = () => {
    if (!meta?.start_month || !meta?.model_horizon_months) return [];
    
    const [year, month] = meta.start_month.split('-').map(Number);
    const labels = [];
    
    for (let i = 0; i < meta.model_horizon_months; i++) {
      const date = new Date(year, month - 1 + i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const yearShort = date.getFullYear().toString().slice(-2);
      labels.push(`${monthName} ${yearShort}`);
    }
    
    return labels;
  };

  const monthLabels = generateMonthLabels();

  // Render P&L Summary Table
  const renderPnLTable = () => {
    if (!tables) {
      console.log('No tables found');
      return null;
    }

    console.log('Tables structure:', tables);
    
    // Extract data from the row-based tables structure
    const extractColumnData = (tableArray: any[], fieldName: string) => {
      if (!Array.isArray(tableArray)) return null;
      return tableArray.map(row => row[fieldName]);
    };

    // Extract revenue from income table
    const revenue = tables.income ? extractColumnData(tables.income, 'Revenue') : null;
    
    // Extract COGS from cogs table
    const cogs = tables.cogs ? extractColumnData(tables.cogs, 'Total COGS') : null;
    
    // Extract Gross Profit from gross_profit_summary table
    const grossProfit = tables.gross_profit_summary ? extractColumnData(tables.gross_profit_summary, 'Gross Profit') : null;
    
    // Extract S&M from sm table
    const salesMarketing = tables.sm ? extractColumnData(tables.sm, 'Total S&M') : null;
    
    // Extract R&D from rnd table
    const rnd = tables.rnd ? extractColumnData(tables.rnd, 'Total R&D') : null;
    
    // Extract G&A from ga table
    const ga = tables.ga ? extractColumnData(tables.ga, 'Total G&A') : null;
    
    // Calculate Total OpEx
    const totalOpex = (salesMarketing && rnd && ga) ? 
      salesMarketing.map((sm: number, idx: number) => sm + rnd[idx] + ga[idx]) : null;
    
    // Extract Operating Income from pnl_summary table
    const operatingIncome = tables.pnl_summary ? extractColumnData(tables.pnl_summary, 'Operating Income') : null;

    // Drivers & KPIs aligned arrays (trim to month count)
    const monthCount = monthLabels.length;
    const trim = (arr: any[] | null | undefined) => Array.isArray(arr) ? arr.slice(0, monthCount) : null;
    const dVolume = trim((drivers as any)?.volume);
    const dUnitPrice = trim((drivers as any)?.unit_price);
    const dRetention = trim((drivers as any)?.retention);
    const dRevenue = trim((drivers as any)?.revenue);
    const dRatios = (drivers as any)?.ratios;
    const dRatiosCogs = trim(dRatios?.cogs);
    const dRatiosSm = trim(dRatios?.sm);
    const dHeadcount = (drivers as any)?.headcount;
    const dHeadRND = trim(dHeadcount?.rnd);
    const dHeadGA = trim(dHeadcount?.ga);

    const kpiTable = tables?.kpi_summary as Array<Record<string, any>> | undefined;
    const kpiAligned = Array.isArray(kpiTable) ? kpiTable.slice(0, monthCount) : [];
    const kpiCust = kpiAligned.length ? kpiAligned.map(r => Number(r['Customer Count']) || 0) : null;
    const kpiChurn = kpiAligned.length ? kpiAligned.map(r => Number(r['Churn Rate']) || 0) : null;
    const kpiExpansion = kpiAligned.length ? kpiAligned.map(r => Number(r['Expansion Rate']) || 0) : null;

    console.log('Extracted data:', { revenue, cogs, grossProfit, salesMarketing, rnd, ga, totalOpex, operatingIncome, dVolume, dUnitPrice, dRetention, dRevenue, dRatiosCogs, dRatiosSm, dHeadRND, dHeadGA, kpiCust, kpiChurn, kpiExpansion });
    
    return (
      <div className="mb-6">
        <h3 className="text-base text-gray-900 mb-3">Profit & Loss ($)</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Line Item
                </th>
                {monthLabels.map((label, idx) => (
                  <th key={idx} className="px-3 py-2 text-right text-xs text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* INCOME GROUP */}
              <tr className="bg-gray-100">
                <td colSpan={monthLabels.length + 1} className="px-3 py-1.5 text-xs text-gray-700 uppercase">Income</td>
              </tr>
              {Array.isArray(dVolume) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">Volume (Customers)</td>
                  {dVolume.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{Number(val).toLocaleString()}</td>
                  ))}
                </tr>
              )}
              {Array.isArray(dUnitPrice) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">Unit Price</td>
                  {dUnitPrice.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatCurrency(Number(val))}</td>
                  ))}
                </tr>
              )}
              {Array.isArray(dRetention) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">Retention</td>
                  {dRetention.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatPercent(Number(val))}</td>
                  ))}
                </tr>
              )}
              {Array.isArray(dRevenue) ? (
                <tr className="bg-blue-50">
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-blue-50">Revenue</td>
                  {dRevenue.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatCurrency(Number(val))}</td>
                  ))}
                </tr>
              ) : (revenue && Array.isArray(revenue) && (
                <tr className="bg-blue-50">
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-blue-50">Revenue</td>
                  {revenue.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatCurrency(val)}</td>
                  ))}
                </tr>
              ))}
              {Array.isArray(kpiCust) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">Customer Count</td>
                  {kpiCust.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{Number(val).toLocaleString()}</td>
                  ))}
                </tr>
              )}
              {Array.isArray(kpiChurn) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">Churn Rate</td>
                  {kpiChurn.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatPercent(Number(val))}</td>
                  ))}
                </tr>
              )}
              {Array.isArray(kpiExpansion) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">Expansion Rate</td>
                  {kpiExpansion.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatPercent(Number(val))}</td>
                  ))}
                </tr>
              )}
              
              {/* COGS */}
              {cogs && Array.isArray(cogs) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">COGS</td>
                  {cogs.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              )}
              {Array.isArray(dRatiosCogs) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-white">Variable COGS</td>
                  {dRatiosCogs.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatCurrency(Number(val))}</td>
                  ))}
                </tr>
              )}
              
              {/* Gross Profit */}
              {grossProfit && Array.isArray(grossProfit) && (
                <tr className="bg-green-50">
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-green-50">Gross Profit</td>
                  {grossProfit.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              )}
              
              {/* Operating Expenses Header */}
              <tr className="bg-gray-100">
                <td colSpan={monthLabels.length + 1} className="px-3 py-1.5 text-xs text-gray-700 uppercase">
                  Operating Expenses
                </td>
              </tr>
              
              {/* Sales & Marketing */}
              {salesMarketing && Array.isArray(salesMarketing) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 pl-6 sticky left-0 bg-white">Sales & Marketing</td>
                  {salesMarketing.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              )}
              {Array.isArray(dRatiosSm) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 pl-6 sticky left-0 bg-white">S&M (Variable)</td>
                  {dRatiosSm.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{formatCurrency(Number(val))}</td>
                  ))}
                </tr>
              )}
              
              {/* R&D */}
              {rnd && Array.isArray(rnd) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 pl-6 sticky left-0 bg-white">R&D</td>
                  {rnd.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              )}
              {Array.isArray(dHeadRND) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 pl-6 sticky left-0 bg-white">Headcount - R&D</td>
                  {dHeadRND.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{Number(val).toLocaleString()}</td>
                  ))}
                </tr>
              )}
              
              {/* G&A */}
              {ga && Array.isArray(ga) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 pl-6 sticky left-0 bg-white">G&A</td>
                  {ga.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              )}
              {Array.isArray(dHeadGA) && (
                <tr>
                  <td className="px-3 py-2 text-xs text-gray-900 pl-6 sticky left-0 bg-white">Headcount - G&A</td>
                  {dHeadGA.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{Number(val).toLocaleString()}</td>
                  ))}
                </tr>
              )}
              
              {/* Total Operating Expenses */}
              {totalOpex && Array.isArray(totalOpex) && (
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-gray-50">Total Operating Expenses</td>
                  {totalOpex.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              )}
              
              {/* Operating Income */}
              {operatingIncome && Array.isArray(operatingIncome) && (
                <tr className="bg-yellow-50 border-t-2 border-gray-300">
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-yellow-50">Operating Income</td>
                  {operatingIncome.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Working Assumptions
  const renderAssumptions = () => {
    if (!assumptions || assumptions.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base text-gray-900">Working Assumptions</h3>
          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            {showAssumptions ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showAssumptions && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-gray-700 uppercase">Assumption</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-700 uppercase">Value</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-700 uppercase">Rationale</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-700 uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assumptions.map((assumption: any, idx: number) => (
                  <tr key={idx} className={assumption.source === 'working' ? 'bg-yellow-50' : ''}>
                    <td className="px-3 py-2 text-xs text-gray-900">{assumption.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{assumption.value}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{assumption.rationale}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        assumption.source === 'working' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {assumption.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // KPIs table from tables.kpi_summary aligned to months
  const renderKPITable = () => {
    const kpi = tables?.kpi_summary as Array<Record<string, any>> | undefined;
    if (!Array.isArray(kpi) || kpi.length === 0) return null;
    const aligned = kpi.slice(0, monthLabels.length);
    const customerCounts = aligned.map(r => Number(r["Customer Count"]) || 0);
    const churnRates = aligned.map(r => Number(r["Churn Rate"]) || 0);
    const expansionRates = aligned.map(r => Number(r["Expansion Rate"]) || 0);

    return (
      <div className="mb-6">
        <h3 className="text-base text-gray-900 mb-2">Key Performance Indicators</h3>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-700 uppercase">KPI</th>
                {monthLabels.map((label, idx) => (
                  <th key={idx} className="px-3 py-2 text-right text-xs text-gray-700 uppercase whitespace-nowrap">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-3 py-2 text-xs text-gray-900">Customer Count</td>
                {customerCounts.map((v, i) => (
                  <td key={i} className="px-3 py-2 text-xs text-gray-900 text-right">{v.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-xs text-gray-900">Churn Rate</td>
                {churnRates.map((v, i) => (
                  <td key={i} className="px-3 py-2 text-xs text-gray-900 text-right">{formatPercent(v)}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-xs text-gray-900">Expansion Rate</td>
                {expansionRates.map((v, i) => (
                  <td key={i} className="px-3 py-2 text-xs text-gray-900 text-right">{formatPercent(v)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Drivers
  const renderDrivers = () => {
    if (!drivers) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base text-gray-900">Business Drivers</h3>
          <button
            onClick={() => setShowDrivers(!showDrivers)}
            className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            {showDrivers ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showDrivers && (
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-gray-700 uppercase">Driver</th>
                  {monthLabels.map((label, idx) => (
                    <th key={idx} className="px-3 py-2 text-right text-xs text-gray-700 uppercase whitespace-nowrap">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const rows: Array<{ label: string; values: Array<number | string>; type: 'currency' | 'percent' | 'int' }>
                    = [];

                  const monthCount = monthLabels.length;
                  const sliceToMonths = (arr: any[]): any[] => Array.isArray(arr) ? arr.slice(0, monthCount) : [];

                  // Simple arrays
                  if (Array.isArray((drivers as any).volume)) rows.push({ label: 'Volume (Customers)', values: sliceToMonths((drivers as any).volume), type: 'int' });
                  if (Array.isArray((drivers as any).unit_price)) rows.push({ label: 'Unit Price', values: sliceToMonths((drivers as any).unit_price), type: 'currency' });
                  if (Array.isArray((drivers as any).retention)) rows.push({ label: 'Retention', values: sliceToMonths((drivers as any).retention), type: 'percent' });
                  if (Array.isArray((drivers as any).revenue)) rows.push({ label: 'Revenue', values: sliceToMonths((drivers as any).revenue), type: 'currency' });

                  // Ratios nested
                  const ratios = (drivers as any).ratios;
                  if (ratios && typeof ratios === 'object') {
                    if (Array.isArray(ratios.cogs)) rows.push({ label: 'COGS (Variable Ratio)', values: sliceToMonths(ratios.cogs), type: 'currency' });
                    if (Array.isArray(ratios.sm)) rows.push({ label: 'S&M (Variable Ratio)', values: sliceToMonths(ratios.sm), type: 'currency' });
                  }

                  // Headcount nested
                  const headcount = (drivers as any).headcount;
                  if (headcount && typeof headcount === 'object') {
                    if (Array.isArray(headcount.rnd)) rows.push({ label: 'Headcount - R&D', values: sliceToMonths(headcount.rnd), type: 'int' });
                    if (Array.isArray(headcount.ga)) rows.push({ label: 'Headcount - G&A', values: sliceToMonths(headcount.ga), type: 'int' });
                  }

                  return rows.map((row, rIdx) => (
                    <tr key={rIdx} className={row.label.toLowerCase().includes('revenue') ? 'bg-blue-50' : ''}>
                      <td className={`px-3 py-2 text-xs text-gray-900`}>
                        {row.label}
                      </td>
                      {Array.from({ length: monthLabels.length }).map((_, i) => {
                        const v = (row.values[i] as any);
                        let display = '';
                        if (v === null || v === undefined || v === '') display = '';
                        else if (row.type === 'currency') display = formatCurrency(Number(v));
                        else if (row.type === 'percent') display = formatPercent(Number(v));
                        else display = Number(v).toLocaleString();
                        return (
                          <td key={i} className="px-3 py-2 text-xs text-gray-900 text-right">{display}</td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Build list of unallocatable items (not month-alignable)
  const unallocatableItems = useMemo(() => {
    const items: string[] = [];
    const monthCount = monthLabels.length;

    // Drivers entries that do not align to months
    if (drivers && typeof drivers === 'object') {
      Object.keys(drivers).forEach((key) => {
        const val: any = (drivers as any)[key];
        if (Array.isArray(val) && val.length !== monthCount) {
          items.push(`drivers.${key}`);
        }
      });
    }

    // Tables that are not row arrays or mismatch
    if (tables && typeof tables === 'object') {
      Object.keys(tables).forEach((tname) => {
        const tval: any = (tables as any)[tname];
        if (Array.isArray(tval)) {
          // If it has Month field, check alignment count
          const hasMonth = tval.length > 0 && tval[0] && Object.prototype.hasOwnProperty.call(tval[0], 'Month');
          if (hasMonth && tval.length !== monthCount) {
            items.push(`tables.${tname} (rows: ${tval.length})`);
          }
        } else if (tval && typeof tval === 'object') {
          // Non-tabular table entry
          items.push(`tables.${tname}`);
        }
      });
    }

    // Notes object (non-month)
    if (notes && typeof notes === 'object') {
      items.push('notes');
    }

    // CSV export blocks
    if ((modelData as any).csv_blocks) {
      items.push('csv_blocks');
    }

    return items;
  }, [drivers, tables, notes, monthLabels.length]);

  return (
    <div className="space-y-6">
      {/* Meta Information */}
      {meta && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-700">Start Month:</span>
              <span className="ml-2 text-gray-900">{meta.start_month}</span>
            </div>
            <div>
              <span className="text-gray-700">Currency:</span>
              <span className="ml-2 text-gray-900">{meta.currency}</span>
            </div>
            <div>
              <span className="text-gray-700">Horizon:</span>
              <span className="ml-2 text-gray-900">{meta.model_horizon_months} months</span>
            </div>
            <div>
              <span className="text-gray-700">Retention Mode:</span>
              <span className="ml-2 text-gray-900">{meta.retention_mode || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main P&L Table */}
      {renderPnLTable()}

      {/* Working Assumptions */}
      {renderAssumptions()}

      {/* KPIs & Drivers are merged into the main P&L table groups above */}

      {/* Unallocatable */}
      {unallocatableItems.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm text-gray-900 mb-2">Unallocatable</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {unallocatableItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

