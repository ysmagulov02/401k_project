import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const API_BASE = 'http://localhost:3001/api';

// Format currency
const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
};

// Card component
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [contribution, setContribution] = useState({ type: 'percentage', value: 6 });
  const [pendingValue, setPendingValue] = useState(6);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, contribRes] = await Promise.all([
          fetch(`${API_BASE}/user`),
          fetch(`${API_BASE}/contribution`)
        ]);
        const userData = await userRes.json();
        const contribData = await contribRes.json();
        setUser(userData);
        setContribution(contribData);
        setPendingValue(contribData.value);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data. Is the backend running?');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch projection when contribution changes
  useEffect(() => {
    const fetchProjection = async () => {
      const percent = contribution.type === 'percentage' 
        ? pendingValue 
        : (pendingValue / (user?.annualSalary / 26)) * 100;
      try {
        const res = await fetch(`${API_BASE}/projection?contributionPercent=${percent}`);
        const data = await res.json();
        setProjection(data);
      } catch (err) {
        console.error('Failed to fetch projection');
      }
    };
    if (user) fetchProjection();
  }, [pendingValue, contribution.type, user]);

  // Save contribution
  const saveContribution = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/contribution`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contribution.type, value: pendingValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContribution(data.contribution);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleTypeChange = (type) => {
    if (type === contribution.type) return;
    const paycheckGross = user.annualSalary / 26;
    if (type === 'fixed') {
      setPendingValue(Math.round((pendingValue / 100) * paycheckGross));
    } else {
      setPendingValue(Math.round((pendingValue / paycheckGross) * 100));
    }
    setContribution(prev => ({ ...prev, type }));
  };

  const getPerPaycheckAmount = () => {
    if (!user) return 0;
    const paycheckGross = user.annualSalary / 26;
    return contribution.type === 'percentage' 
      ? (pendingValue / 100) * paycheckGross 
      : pendingValue;
  };

  const getEmployerMatch = () => {
    if (!user) return 0;
    const effectivePercent = contribution.type === 'percentage' 
      ? pendingValue 
      : (pendingValue / (user.annualSalary / 26)) * 100;
    const matchedPercent = Math.min(effectivePercent, user.employerMatch.maxMatchPercent);
    return (matchedPercent / 100) * (user.annualSalary / 26) * (user.employerMatch.matchPercent / 100);
  };

  const hasChanges = pendingValue !== contribution.value;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-gray-800 font-medium">{error}</div>
          <p className="text-gray-500 text-sm mt-2">Make sure to run: npm start in the server directory</p>
        </Card>
      </div>
    );
  }

  const maxValue = contribution.type === 'percentage' ? 27 : Math.round(user.annualSalary / 26 * 0.27);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">401k</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Retirement Savings</h1>
              <p className="text-sm text-gray-500">Manage your 401(k) contributions</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">Age {user.calculatedAge}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* YTD Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5">
            <p className="text-sm text-gray-500 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(user.ytdData.totalBalance)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500 mb-1">Your YTD Contributions</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(user.ytdData.employeeContributions)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500 mb-1">Employer Match YTD</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(user.ytdData.employerContributions)}</p>
            <p className="text-xs text-gray-400 mt-1">50% match up to 6%</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contribution Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Contribution Settings</h2>
            
            {/* Type Toggle */}
            <div className="mb-6">
              <label className="text-sm text-gray-600 mb-2 block">Contribution Type</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleTypeChange('percentage')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    contribution.type === 'percentage' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Percentage of Pay
                </button>
                <button
                  onClick={() => handleTypeChange('fixed')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    contribution.type === 'fixed' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Fixed Amount
                </button>
              </div>
            </div>

            {/* Value Input */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-3">
                <label className="text-sm text-gray-600">
                  {contribution.type === 'percentage' ? 'Contribution Rate' : 'Amount Per Paycheck'}
                </label>
                <span className="text-3xl font-bold text-blue-600">
                  {contribution.type === 'percentage' ? `${pendingValue}%` : formatCurrency(pendingValue)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={maxValue}
                value={pendingValue}
                onChange={(e) => setPendingValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>{contribution.type === 'percentage' ? `${maxValue}%` : formatCurrency(maxValue)}</span>
              </div>
            </div>

            {/* Per Paycheck Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Your contribution</span>
                <span className="font-medium">{formatCurrency(getPerPaycheckAmount())}/paycheck</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Employer match</span>
                <span className="font-medium text-green-600">+{formatCurrency(getEmployerMatch())}/paycheck</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Total to retirement</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(getPerPaycheckAmount() + getEmployerMatch())}/paycheck
                  </span>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                ✓ Contribution updated successfully!
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={saveContribution}
              disabled={!hasChanges || saving}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
            </button>
          </Card>

          {/* Retirement Projection */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Retirement Projection</h2>
            <p className="text-sm text-gray-500 mb-6">
              Estimated balance at age 65 (assumes 7% annual return)
            </p>

            {projection && (
              <>
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-gray-900">
                    {formatCurrency(projection.projectedBalanceAtRetirement)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    in {projection.yearsToRetirement} years
                  </p>
                </div>

                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projection.yearlyProjections}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="age" 
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(v) => [formatCurrency(v), 'Balance']}
                        labelFormatter={(l) => `Age ${l}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        fill="url(#colorBalance)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-gray-600">Annual Contribution</p>
                    <p className="font-semibold text-blue-700">
                      {formatCurrency(projection.annualEmployeeContribution)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-gray-600">Annual Employer Match</p>
                    <p className="font-semibold text-green-700">
                      {formatCurrency(projection.annualEmployerContribution)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}