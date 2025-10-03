"use client";
import { useState } from "react";

interface FinancialModelOutputProps {
  data: any;
}

export default function FinancialModelOutput({ data }: FinancialModelOutputProps) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showDetailedTables, setShowDetailedTables] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
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
          <h3 className="text-sm font-semibold text-red-900 mb-2">Failed to parse model data</h3>
          <p className="text-xs text-red-700">The response is not valid JSON. Check the Raw API Response below.</p>
        </div>
      );
    }
  }

  console.log('Financial Model Data:', modelData);
  console.log('Model Data Keys:', Object.keys(modelData));
  console.log('Tables:', modelData.tables);
  console.log('Has pnl_summary?', modelData.tables?.pnl_summary ? 'YES' : 'NO');

  const { meta, assumptions, drivers, tables, kpi_summary, notes } = modelData;

  // Show diagnostic if no tables found
  if (!tables) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">No tables found in response</h3>
        <p className="text-xs text-yellow-700 mb-2">The response structure doesn't contain a "tables" field.</p>
        <details className="text-xs text-gray-700">
          <summary className="cursor-pointer font-medium mb-1">Response structure:</summary>
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
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">No P&L summary found in tables</h3>
        <p className="text-xs text-yellow-700 mb-2">The response has a "tables" field but no "pnl_summary".</p>
        <details className="text-xs text-gray-700">
          <summary className="cursor-pointer font-medium mb-1">Available tables:</summary>
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

    console.log('Extracted data:', { revenue, cogs, grossProfit, salesMarketing, rnd, ga, totalOpex, operatingIncome });
    
    return (
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Profit & Loss ($)</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Line Item
                </th>
                {monthLabels.map((label, idx) => (
                  <th key={idx} className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Revenue */}
              {revenue && Array.isArray(revenue) && (
                <tr className="bg-blue-50">
                  <td className="px-3 py-2 text-xs text-gray-900 sticky left-0 bg-blue-50">Revenue</td>
                  {revenue.map((val: number, idx: number) => (
                    <td key={idx} className="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(val)}
                    </td>
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
                <td colSpan={monthLabels.length + 1} className="px-3 py-1.5 text-xs font-medium text-gray-700 uppercase">
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
          <h3 className="text-lg font-semibold text-gray-900">Working Assumptions</h3>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assumption</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rationale</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assumptions.map((assumption: any, idx: number) => (
                  <tr key={idx} className={assumption.source === 'working' ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-3 text-sm text-gray-900">{assumption.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{assumption.value}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{assumption.rationale}</td>
                    <td className="px-4 py-3 text-xs">
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

  // Render KPIs
  const renderKPIs = () => {
    if (!kpi_summary) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h3>
          <button
            onClick={() => setShowKPIs(!showKPIs)}
            className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            {showKPIs ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showKPIs && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpi_summary.grossMargin && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Gross Margin</h4>
                <div className="flex items-baseline gap-2">
                  {kpi_summary.grossMargin.map((val: number, idx: number) => (
                    <span key={idx} className="text-sm text-gray-900">{formatPercent(val)}</span>
                  ))}
                </div>
              </div>
            )}
            
            {kpi_summary.operatingMargin && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Operating Margin</h4>
                <div className="flex items-baseline gap-2">
                  {kpi_summary.operatingMargin.map((val: number, idx: number) => (
                    <span key={idx} className="text-sm text-gray-900">{formatPercent(val)}</span>
                  ))}
                </div>
              </div>
            )}
            
            {kpi_summary.revenueGrowth && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Revenue Growth (MoM)</h4>
                <div className="flex items-baseline gap-2">
                  {kpi_summary.revenueGrowth.map((val: number, idx: number) => (
                    <span key={idx} className="text-sm text-gray-900">{formatPercent(val)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Drivers
  const renderDrivers = () => {
    if (!drivers) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Business Drivers</h3>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Driver</th>
                  {monthLabels.map((label, idx) => (
                    <th key={idx} className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.volume && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Volume (Customers)</td>
                    {drivers.volume.map((val: number, idx: number) => (
                      <td key={idx} className="px-4 py-3 text-sm text-gray-900 text-right">
                        {val.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                )}
                
                {drivers.unitPrice && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Unit Price</td>
                    {drivers.unitPrice.map((val: number, idx: number) => (
                      <td key={idx} className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(val)}
                      </td>
                    ))}
                  </tr>
                )}
                
                {drivers.revenue && (
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">Revenue</td>
                    {drivers.revenue.map((val: number, idx: number) => (
                      <td key={idx} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(val)}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Meta Information */}
      {meta && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Start Month:</span>
              <span className="ml-2 text-gray-900">{meta.start_month}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Currency:</span>
              <span className="ml-2 text-gray-900">{meta.currency}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Horizon:</span>
              <span className="ml-2 text-gray-900">{meta.model_horizon_months} months</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Retention Mode:</span>
              <span className="ml-2 text-gray-900">{meta.retention_mode || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main P&L Table */}
      {renderPnLTable()}

      {/* Working Assumptions */}
      {renderAssumptions()}

      {/* KPIs */}
      {renderKPIs()}

      {/* Drivers */}
      {renderDrivers()}

      {/* Notes */}
      {notes && notes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes & Recommendations</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {notes.map((note: string, idx: number) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

