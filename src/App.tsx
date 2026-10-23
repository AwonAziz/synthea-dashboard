import { useState, useEffect, useCallback } from 'react';


const API_BASE = import.meta.env.VITE_SYNTHEA_API_BASE_URL || '';

interface Profile {
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  payer: string;
  coverageStatus: string;
  scenario: number;
  copay?: string;
  coinsurance?: string;
  deductible?: string;
  outOfPocket?: string;
  provenance: Record<string, string>;
  syntheaPatientId: string;
}

interface Summary {
  totalProfiles: number;
  uniquePayers: number;
  payerCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  scenarioCounts: Record<string, number>;
  manifest: { appendNumbersToPersonNames?: boolean; generatedPatients?: number; importedProfiles?: number };
}

interface EligibilityResult {
  status: string;
  source: string;
  lines: string[];
  planName?: string;
  payerName?: string;
  copay?: string;
  coinsurance?: string;
  deductible?: string;
  outOfPocket?: string;
  limitations?: string[];
  testMode: boolean;
  error?: string;
  checkId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  inactive: '#dc2626',
  pending: '#d97706',
  unknown: '#6b7280',
};

export default function App() {
  const [view, setView] = useState<'overview' | 'explorer' | 'detail' | 'test'>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [payerFilter, setPayerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test console state
  const [testForm, setTestForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', memberId: '' });
  const [testResult, setTestResult] = useState<EligibilityResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/dev/synthetic-insurance/summary`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      if (payerFilter) params.set('payer', payerFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (scenarioFilter) params.set('scenario', scenarioFilter);
      const res = await fetch(`${API_BASE}/api/dev/synthetic-insurance/profiles?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfiles(data.items);
      setTotalProfiles(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, payerFilter, statusFilter, scenarioFilter]);

  useEffect(() => {
    if (view === 'overview') fetchSummary();
    if (view === 'explorer') fetchProfiles();
  }, [view, fetchSummary, fetchProfiles]);

  const runTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/synthetic-insurance/eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ status: 'error', source: 'synthea', lines: [e.message], testMode: true });
    } finally {
      setTestLoading(false);
    }
  };

  const copyProfile = (p: Profile) => {
    const text = `Name: ${p.firstName} ${p.lastName}\nDOB: ${p.dateOfBirth}\nMember ID: ${p.memberId}`;
    navigator.clipboard.writeText(text);
  };

  const testProfile = (p: Profile) => {
    setTestForm({ firstName: p.firstName, lastName: p.lastName, dateOfBirth: p.dateOfBirth, memberId: p.memberId });
    setView('test');
  };

  const payers = summary ? Object.keys(summary.payerCounts) : [];
  const statuses = summary ? Object.keys(summary.statusCounts) : [];
  const scenarios = summary ? Object.keys(summary.scenarioCounts) : [];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Header */}
      <header style={{ background: '#0f172a', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Synthetic Insurance Lab</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>Explore synthetic insurance profiles, inspect benefits, and test eligibility responses.</p>
        </div>
        <nav style={{ display: 'flex', gap: 8 }}>
          {(['overview', 'explorer', 'test'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? '#14b8a6' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'capitalize',
            }}>{v}</button>
          ))}
        </nav>
      </header>

      {/* Synthetic notice */}
      <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', padding: '10px 24px', fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>⚠ Synthetic Data:</span> All records and benefits are synthetic test data. This is not a real insurance verification system.
      </div>

      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

        {/* Overview */}
        {view === 'overview' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Overview</h2>
            {loading && <p>Loading...</p>}
            {summary && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Total Profiles', value: summary.totalProfiles },
                    { label: 'Unique Payers', value: summary.uniquePayers },
                    { label: 'Active', value: summary.statusCounts.active || 0 },
                    { label: 'Inactive', value: summary.statusCounts.inactive || 0 },
                    { label: 'Pending', value: summary.statusCounts.pending || 0 },
                    { label: 'Scenarios', value: Object.keys(summary.scenarioCounts).length },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{m.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Payer Distribution</h3>
                    {Object.entries(summary.payerCounts).map(([payer, count]) => (
                      <div key={payer} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                        <span>{payer}</span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Status Distribution</h3>
                    {Object.entries(summary.statusCounts).map(([status, count]) => (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: STATUS_COLORS[status] || '#6b7280', fontWeight: 500 }}>{status}</span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Benefit Scenarios</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                    {Object.entries(summary.scenarioCounts).map(([sc, count]) => (
                      <div key={sc} style={{ background: '#f1f5f9', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{sc}</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Explorer */}
        {view === 'explorer' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Patient Explorer</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <input placeholder="Search name or member ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }} />
              <select value={payerFilter} onChange={e => { setPayerFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}>
                <option value="">All Payers</option>
                {payers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}>
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={scenarioFilter} onChange={e => { setScenarioFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}>
                <option value="">All Scenarios</option>
                {scenarios.map(s => <option key={s} value={s.replace('scenario-', '')}>{s}</option>)}
              </select>
              <button onClick={() => { setSearch(''); setPayerFilter(''); setStatusFilter(''); setScenarioFilter(''); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: '#fff' }}>Clear</button>
            </div>

            {loading && <p>Loading...</p>}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['Name', 'Member ID', 'DOB', 'Payer', 'Status', 'Scenario', 'Copay', 'Deductible', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.memberId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px' }}>{p.firstName} {p.lastName}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{p.memberId}</td>
                      <td style={{ padding: '8px 12px' }}>{p.dateOfBirth}</td>
                      <td style={{ padding: '8px 12px' }}>{p.payer}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ color: STATUS_COLORS[p.coverageStatus] || '#6b7280', fontWeight: 500, fontSize: 12 }}>{p.coverageStatus}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>S{p.scenario}</td>
                      <td style={{ padding: '8px 12px' }}>{p.copay || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{p.deductible || '—'}</td>
                      <td style={{ padding: '8px 12px', display: 'flex', gap: 4 }}>
                        <button onClick={() => { setSelectedProfile(p); setView('detail'); }} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>View</button>
                        <button onClick={() => testProfile(p)} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #14b8a6', borderRadius: 6, cursor: 'pointer', background: '#f0fdfa', color: '#0f766e' }}>Test</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>Showing {profiles.length} of {totalProfiles}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: page <= 1 ? 'not-allowed' : 'pointer', background: '#fff', opacity: page <= 1 ? 0.5 : 1 }}>Prev</button>
                <span style={{ padding: '6px 12px' }}>Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={profiles.length < pageSize} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: profiles.length < pageSize ? 'not-allowed' : 'pointer', background: '#fff', opacity: profiles.length < pageSize ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          </div>
        )}

        {/* Detail */}
        {view === 'detail' && selectedProfile && (
          <div>
            <button onClick={() => setView('explorer')} style={{ marginBottom: 16, padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13 }}>← Back</button>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Profile Details</h2>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#0f766e' }}>Demographics (Synthea)</h3>
                  {[
                    ['Name', `${selectedProfile.firstName} ${selectedProfile.lastName}`],
                    ['DOB', selectedProfile.dateOfBirth],
                    ['Gender', selectedProfile.gender],
                    ['Payer', selectedProfile.payer],
                    ['Plan Name', 'Not available'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#0f766e' }}>Synthetic Benefits (Neural Hub Overlay)</h3>
                  {[
                    ['Member ID', selectedProfile.memberId],
                    ['Status', selectedProfile.coverageStatus],
                    ['Scenario', `Scenario ${selectedProfile.scenario}`],
                    ['Copay', selectedProfile.copay || 'Unknown'],
                    ['Coinsurance', selectedProfile.coinsurance || 'Unknown'],
                    ['Deductible', selectedProfile.deductible || 'Unknown'],
                    ['Out-of-Pocket', selectedProfile.outOfPocket || 'Unknown'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: '#f0fdfa', borderRadius: 8, fontSize: 12, color: '#134e4a' }}>
                <strong>Provenance:</strong> Patient/payer/coverage-status = Synthea-generated. Member ID = Neural Hub synthetic. Benefits = Neural Hub synthetic overlay. Plan name = not available.
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => copyProfile(selectedProfile)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 13 }}>Copy Test Details</button>
                <button onClick={() => testProfile(selectedProfile)} style={{ padding: '8px 16px', border: '1px solid #14b8a6', borderRadius: 8, cursor: 'pointer', background: '#f0fdfa', color: '#0f766e', fontSize: 13 }}>Test Eligibility</button>
              </div>
            </div>
          </div>
        )}

        {/* Test Console */}
        {view === 'test' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Eligibility Test Console</h2>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, maxWidth: 600 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 4 }}>First Name</label>
                  <input value={testForm.firstName} onChange={e => setTestForm(f => ({ ...f, firstName: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 4 }}>Last Name</label>
                  <input value={testForm.lastName} onChange={e => setTestForm(f => ({ ...f, lastName: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 4 }}>Date of Birth</label>
                  <input value={testForm.dateOfBirth} onChange={e => setTestForm(f => ({ ...f, dateOfBirth: e.target.value }))} placeholder="YYYY-MM-DD" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 4 }}>Member ID</label>
                  <input value={testForm.memberId} onChange={e => setTestForm(f => ({ ...f, memberId: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={runTest} disabled={testLoading} style={{ padding: '10px 20px', background: '#14b8a6', color: '#fff', border: 'none', borderRadius: 8, cursor: testLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: testLoading ? 0.7 : 1 }}>
                  {testLoading ? 'Testing...' : 'Test Eligibility'}
                </button>
                <button onClick={() => { setTestForm({ firstName: '', lastName: '', dateOfBirth: '', memberId: '' }); setTestResult(null); }} style={{ padding: '10px 20px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                  Reset
                </button>
              </div>

              {testResult && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Result</span>
                    <span style={{ fontSize: 12, color: STATUS_COLORS[testResult.status] || '#6b7280', fontWeight: 600 }}>{testResult.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Source: {testResult.source} | Test Mode: {String(testResult.testMode)}</div>
                  {testResult.payerName && <div style={{ fontSize: 13, padding: '4px 0' }}><strong>Payer:</strong> {testResult.payerName}</div>}
                  {testResult.planName && <div style={{ fontSize: 13, padding: '4px 0' }}><strong>Plan:</strong> {testResult.planName}</div>}
                  {testResult.copay && <div style={{ fontSize: 13, padding: '4px 0' }}><strong>Copay:</strong> {testResult.copay}</div>}
                  {testResult.coinsurance && <div style={{ fontSize: 13, padding: '4px 0' }}><strong>Coinsurance:</strong> {testResult.coinsurance}</div>}
                  {testResult.deductible && <div style={{ fontSize: 13, padding: '4px 0' }}><strong>Deductible:</strong> {testResult.deductible}</div>}
                  {testResult.outOfPocket && <div style={{ fontSize: 13, padding: '4px 0' }}><strong>Out-of-Pocket:</strong> {testResult.outOfPocket}</div>}
                  {testResult.error && <div style={{ fontSize: 13, padding: '4px 0', color: '#dc2626' }}><strong>Error:</strong> {testResult.error}</div>}
                  <div style={{ marginTop: 8 }}>
                    <strong style={{ fontSize: 12 }}>Lines:</strong>
                    {testResult.lines.map((l, i) => <div key={i} style={{ fontSize: 12, color: '#475569', padding: '2px 0' }}>{l}</div>)}
                  </div>
                  <button onClick={() => setShowJson(!showJson)} style={{ marginTop: 8, padding: '4px 8px', fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>
                    {showJson ? 'Hide' : 'Show'} JSON
                  </button>
                  {showJson && <pre style={{ marginTop: 8, background: '#1e293b', color: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 300 }}>{JSON.stringify(testResult, null, 2)}</pre>}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
