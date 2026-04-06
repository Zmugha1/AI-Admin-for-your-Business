import {
  useState, useEffect,
  type CSSProperties,
} from 'react';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface TaxQuarter {
  quarter_id: string;
  year: number;
  quarter: string;
  period_label: string;
  due_date: string;
  income: number;
  expenses: number;
  profit: number;
  reasonable_salary: number;
  distributions: number;
  estimated_tax_llc: number;
  estimated_tax_scorp_federal: number;
  estimated_tax_scorp_state: number;
  estimated_tax_total: number;
  paid: number;
  paid_date: string | null;
  notes: string | null;
}

interface Expense {
  expense_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  quarter: string | null;
  year: number | null;
  deductible: number;
  payment_method: string;
  notes: string | null;
}

const EXPENSE_CATEGORIES = [
  'Software & Subscriptions',
  'Home Office',
  'Equipment & Hardware',
  'Travel',
  'Professional Development',
  'Contractor Payments',
  'Marketing & Advertising',
  'Professional Services',
  'Office Supplies',
  'Other',
];

const PAYMENT_METHODS = [
  'credit_card', 'debit_card',
  'bank_transfer', 'cash', 'check',
];

const TAX_RATES = {
  federal_se: 0.153,
  federal_income: 0.24,
  wi_corporate: 0.0765,
  wi_personal: 0.0765,
  fica_employee: 0.0765,
  fica_employer: 0.0765,
};

function calcLLC(profit: number) {
  const se_tax = profit * TAX_RATES.federal_se * 0.9235;
  const se_deduction = se_tax * 0.5;
  const taxable = profit - se_deduction;
  const federal = taxable * TAX_RATES.federal_income;
  const state = profit * TAX_RATES.wi_personal;
  return {
    se_tax,
    federal,
    state,
    total: se_tax + federal + state,
  };
}

function calcSCorp(
  profit: number,
  salary: number
) {
  const dist = Math.max(0, profit - salary);
  const fica = salary *
    (TAX_RATES.fica_employee +
     TAX_RATES.fica_employer);
  const federal_salary =
    salary * TAX_RATES.federal_income;
  const federal_dist =
    dist * TAX_RATES.federal_income;
  const state =
    profit * TAX_RATES.wi_personal;
  const corp_wi =
    profit * TAX_RATES.wi_corporate;
  return {
    fica,
    federal: federal_salary + federal_dist,
    state,
    corp_wi,
    total: fica + federal_salary +
      federal_dist + state,
    distributions: dist,
  };
}

function suggestSalary(annualProfit: number) {
  if (annualProfit < 40000) return 0;
  if (annualProfit < 80000)
    return Math.round(annualProfit * 0.5);
  if (annualProfit < 150000)
    return Math.round(annualProfit * 0.45);
  return Math.round(annualProfit * 0.40);
}

function getQuarterFromDate(date: string) {
  const month = new Date(date).getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

type FinancesTab = 'overview' | 'expenses' | 'calculator';

export function MyFinances() {
  const [quarters, setQuarters] = useState<TaxQuarter[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedQ, setSelectedQ] = useState<TaxQuarter | null>(null);
  const [tab, setTab] = useState<FinancesTab>('overview');
  const [editing, setEditing] = useState(false);
  const [showAddExpense, setShowAddExpense] =
    useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [qForm, setQForm] = useState({
    income: 0,
    expenses: 0,
    reasonable_salary: 0,
    notes: '',
    paid: 0,
    paid_date: '',
  });

  const [expForm, setExpForm] = useState({
    category: 'Software & Subscriptions',
    description: '',
    amount: 0,
    expense_date: new Date()
      .toISOString().slice(0, 10),
    deductible: 1,
    payment_method: 'credit_card',
    notes: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const db = await getDb();
      const qs = await db.select<TaxQuarter[]>(
        `SELECT * FROM tax_quarters
         ORDER BY year ASC, quarter ASC`
      );
      setQuarters(qs);
      if (qs.length > 0 && !selectedQ) {
        setSelectedQ(qs[0]);
        setQForm({
          income: qs[0].income,
          expenses: qs[0].expenses,
          reasonable_salary:
            qs[0].reasonable_salary,
          notes: qs[0].notes ?? '',
          paid: qs[0].paid,
          paid_date: qs[0].paid_date ?? '',
        });
      }
      const ex = await db.select<Expense[]>(
        `SELECT * FROM expenses
         ORDER BY expense_date DESC`
      );
      setExpenses(ex);
    } catch (err) {
      console.error('MyFinances load:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveQuarter() {
    if (!selectedQ) return;
    const db = await getDb();
    const profit = Math.max(
      0,
      qForm.income - qForm.expenses
    );
    const annualProfit = profit * 4;
    const salary = qForm.reasonable_salary > 0
      ? qForm.reasonable_salary
      : suggestSalary(annualProfit) / 4;

    const llc = calcLLC(profit);
    const scorp = calcSCorp(profit, salary);

    await db.execute(
      `UPDATE tax_quarters SET
         income = ?,
         expenses = ?,
         profit = ?,
         reasonable_salary = ?,
         distributions = ?,
         estimated_tax_llc = ?,
         estimated_tax_scorp_federal = ?,
         estimated_tax_scorp_state = ?,
         estimated_tax_total = ?,
         paid = ?,
         paid_date = ?,
         notes = ?,
         updated_at = datetime('now')
       WHERE quarter_id = ?`,
      [
        qForm.income,
        qForm.expenses,
        profit,
        salary,
        scorp.distributions,
        llc.total,
        scorp.federal + scorp.fica,
        scorp.state,
        scorp.total,
        qForm.paid,
        qForm.paid_date || null,
        qForm.notes || null,
        selectedQ.quarter_id,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'finances_updated',
               'tax_quarters', ?, ?)`,
      [
        uuidv4(),
        selectedQ.quarter_id,
        `${selectedQ.period_label} updated`,
      ]
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditing(false);
    await load();
  }

  async function addExpense() {
    if (!expForm.description.trim()) return;
    const db = await getDb();
    const id = uuidv4();
    const year = new Date(expForm.expense_date)
      .getFullYear();
    const quarter =
      getQuarterFromDate(expForm.expense_date);
    await db.execute(
      `INSERT INTO expenses
         (expense_id, category, description,
          amount, expense_date, quarter, year,
          deductible, payment_method, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        expForm.category,
        expForm.description.trim(),
        expForm.amount,
        expForm.expense_date,
        quarter,
        year,
        expForm.deductible,
        expForm.payment_method,
        expForm.notes || null,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'expense_added',
               'expenses', ?, ?)`,
      [
        uuidv4(), id,
        `${expForm.category}: ${expForm.description}`,
      ]
    );
    setExpForm({
      category: 'Software & Subscriptions',
      description: '',
      amount: 0,
      expense_date: new Date()
        .toISOString().slice(0, 10),
      deductible: 1,
      payment_method: 'credit_card',
      notes: '',
    });
    setShowAddExpense(false);
    await load();
  }

  async function deleteExpense(id: string) {
    const db = await getDb();
    await db.execute(
      `DELETE FROM expenses
       WHERE expense_id = ?`, [id]
    );
    await load();
  }

  if (loading) {
    return (
      <div style={{
        padding: 32, color: 'var(--slate)',
        fontSize: 12,
        fontFamily: 'Courier New, monospace',
      }}>
        Loading...
      </div>
    );
  }

  const totalIncome = quarters.reduce(
    (s, q) => s + q.income, 0
  );
  const totalProfit = quarters.reduce(
    (s, q) => s + q.profit, 0
  );
  const totalTaxLLC = quarters.reduce(
    (s, q) => s + q.estimated_tax_llc, 0
  );
  const totalTaxSCorp = quarters.reduce(
    (s, q) => s + q.estimated_tax_total, 0
  );
  const totalExpensesLogged = expenses.reduce(
    (s, e) => s + e.amount, 0
  );

  const profit = selectedQ
    ? Math.max(0, qForm.income - qForm.expenses)
    : 0;
  const annualProfit = profit * 4;
  const salary = qForm.reasonable_salary > 0
    ? qForm.reasonable_salary
    : suggestSalary(annualProfit) / 4;
  const llc = calcLLC(profit);
  const scorp = calcSCorp(profit, salary);
  const savings = llc.total - scorp.total;

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid var(--mgray)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--navy)',
    background: 'var(--white)',
    marginBottom: 10,
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>
            My Finances
          </h2>
          <p style={{
            color: 'var(--slate)', fontSize: 13,
          }}>
            LLC vs S-Corp tax comparison ·
            Quarterly estimates · Expense tracking
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(160px,1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {[
          ['Total Income 2026',
            `$${totalIncome.toLocaleString()}`,
            'var(--teal)'],
          ['Total Expenses',
            `$${totalExpensesLogged
              .toLocaleString()}`,
            'var(--coral)'],
          ['Net Profit',
            `$${totalProfit.toLocaleString()}`,
            'var(--navy)'],
          ['Est. Tax — LLC',
            `$${totalTaxLLC.toLocaleString()}`,
            'var(--coral)'],
          ['Est. Tax — S-Corp',
            `$${totalTaxSCorp.toLocaleString()}`,
            'var(--gold)'],
          ['S-Corp Savings',
            `$${Math.max(0,
              totalTaxLLC - totalTaxSCorp)
              .toLocaleString()}`,
            'var(--green)'],
        ].map(([label, value, color]) => (
          <div key={label} style={{
            background: 'var(--white)',
            border: '1px solid var(--mgray)',
            borderTop:
              `3px solid ${color}`,
            borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div className="label"
              style={{ marginBottom: 6 }}>
              {label}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800,
              color: color,
              fontFamily: 'Georgia, serif',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', gap: 8,
        marginBottom: 20,
      }}>
        {([
          ['overview', 'Quarterly Overview'],
          ['expenses', 'Expenses'],
          ['calculator', 'Tax Calculator'],
        ] as const).map(([id, label]) => (
          <button key={id}
            type="button"
            onClick={() =>
              setTab(id)}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              border: `1px solid ${tab === id
                ? 'var(--teal)'
                : 'var(--mgray)'}`,
              background: tab === id
                ? 'var(--teal)' : 'transparent',
              color: tab === id
                ? 'var(--white)' : 'var(--slate)',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(280px,1fr))',
            gap: 12, marginBottom: 20,
          }}>
            {quarters.map(q => (
              <div key={q.quarter_id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedQ(q);
                  setQForm({
                    income: q.income,
                    expenses: q.expenses,
                    reasonable_salary:
                      q.reasonable_salary,
                    notes: q.notes ?? '',
                    paid: q.paid,
                    paid_date: q.paid_date ?? '',
                  });
                  setEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedQ(q);
                    setQForm({
                      income: q.income,
                      expenses: q.expenses,
                      reasonable_salary:
                        q.reasonable_salary,
                      notes: q.notes ?? '',
                      paid: q.paid,
                      paid_date: q.paid_date ?? '',
                    });
                    setEditing(false);
                  }
                }}
                style={{
                  background: 'var(--white)',
                  border: `1px solid ${
                    selectedQ?.quarter_id ===
                    q.quarter_id
                      ? 'var(--teal)'
                      : 'var(--mgray)'}`,
                  borderLeft: `4px solid ${
                    q.paid
                      ? 'var(--green)'
                      : new Date() >
                        new Date(q.due_date)
                      ? 'var(--coral)'
                      : 'var(--gold)'}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  cursor: 'pointer',
                }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}>
                  <div>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--navy)',
                      fontFamily:
                        'Georgia, serif',
                    }}>
                      {q.quarter} {q.year}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--slate)',
                    }}>
                      {q.period_label}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                  }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: q.paid
                        ? '#3A7D5C18'
                        : '#C8974A18',
                      color: q.paid
                        ? 'var(--green)'
                        : 'var(--gold)',
                    }}>
                      {q.paid ? 'PAID' : 'DUE'}
                    </span>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--slate)',
                      fontFamily:
                        'Courier New, monospace',
                    }}>
                      Due: {q.due_date}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                }}>
                  {([
                    ['Income',
                      `$${q.income
                        .toLocaleString()}`],
                    ['Profit',
                      `$${q.profit
                        .toLocaleString()}`],
                    ['LLC Tax',
                      `$${q.estimated_tax_llc
                        .toLocaleString()}`],
                    ['S-Corp Tax',
                      `$${q.estimated_tax_total
                        .toLocaleString()}`],
                  ] as const).map(([k, v]) => (
                    <div key={k}
                      style={{
                        background: 'var(--lgray)',
                        borderRadius: 6,
                        padding: '6px 8px',
                      }}>
                      <div style={{
                        fontSize: 9,
                        color: 'var(--slate)',
                        fontFamily:
                          'Courier New, monospace',
                        textTransform: 'uppercase',
                      }}>
                        {k}
                      </div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--navy)',
                      }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedQ && (
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderTop: '4px solid var(--teal)',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: 'var(--navy)',
                }}>
                  {selectedQ.period_label} —
                  Update Numbers
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditing(!editing)}
                  style={{
                    padding: '6px 14px',
                    background: editing
                      ? 'var(--mgray)'
                      : 'var(--teal)',
                    color: editing
                      ? 'var(--slate)'
                      : 'var(--white)',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editing && (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr 1fr',
                    gap: 12, marginBottom: 12,
                  }}>
                    {([
                      ['Income this quarter ($)',
                        'income'],
                      ['Expenses this quarter ($)',
                        'expenses'],
                      ['Reasonable Salary ($)',
                        'reasonable_salary'],
                    ] as const).map(([label, key]) => (
                      <div key={key}>
                        <div className="label"
                          style={{
                            marginBottom: 4,
                          }}>
                          {label}
                        </div>
                        <input type="number"
                          value={
                            (qForm as Record<
                              string, number | string
                            >)[key]
                          }
                          onChange={e =>
                            setQForm({
                              ...qForm,
                              [key]:
                                Number(
                                  e.target.value
                                ),
                            })}
                          style={inputStyle} />
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'var(--teal3)',
                    border:
                      '1px solid var(--teal2)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 12,
                    fontSize: 12,
                    color: 'var(--navy)',
                  }}>
                    <strong>
                      Suggested salary:
                    </strong>{' '}
                    ${(suggestSalary(
                      profit * 4
                    ) / 4).toLocaleString()}
                    /quarter based on your
                    projected annual profit of
                    ${(profit * 4)
                      .toLocaleString()}.
                    IRS requires reasonable
                    compensation before
                    distributions.
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12, marginBottom: 12,
                  }}>
                    <div>
                      <div className="label"
                        style={{ marginBottom: 4 }}>
                        Mark as Paid
                      </div>
                      <select
                        value={qForm.paid}
                        onChange={e => setQForm({
                          ...qForm,
                          paid: Number(
                            e.target.value
                          ),
                        })}
                        style={inputStyle}>
                        <option value={0}>
                          Not paid
                        </option>
                        <option value={1}>
                          Paid
                        </option>
                      </select>
                    </div>
                    <div>
                      <div className="label"
                        style={{ marginBottom: 4 }}>
                        Date Paid
                      </div>
                      <input type="date"
                        value={qForm.paid_date}
                        onChange={e => setQForm({
                          ...qForm,
                          paid_date: e.target.value,
                        })}
                        style={inputStyle} />
                    </div>
                  </div>

                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Notes
                  </div>
                  <textarea
                    value={qForm.notes}
                    onChange={e => setQForm({
                      ...qForm,
                      notes: e.target.value,
                    })}
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      fontFamily:
                        'Trebuchet MS, sans-serif',
                    }} />

                  <button
                    type="button"
                    onClick={saveQuarter}
                    style={{
                      padding: '8px 24px',
                      background: saved
                        ? 'var(--green)'
                        : 'var(--teal)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                    {saved
                      ? 'Saved ✓'
                      : 'Calculate & Save'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 13, color: 'var(--slate)',
            }}>
              {expenses.length} expenses ·
              ${totalExpensesLogged
                .toLocaleString()} total
            </div>
            <button
              type="button"
              onClick={() =>
                setShowAddExpense(!showAddExpense)}
              style={{
                padding: '7px 16px',
                background: 'var(--teal)',
                color: 'var(--white)',
                border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}>
              + Add Expense
            </button>
          </div>

          {showAddExpense && (
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderTop: '4px solid var(--coral)',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 20,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: 'var(--navy)',
                marginBottom: 14,
              }}>
                Add Expense
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}>
                <div>
                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Category
                  </div>
                  <select
                    value={expForm.category}
                    onChange={e => setExpForm({
                      ...expForm,
                      category: e.target.value,
                    })}
                    style={inputStyle}>
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Amount ($)
                  </div>
                  <input type="number"
                    value={expForm.amount}
                    onChange={e => setExpForm({
                      ...expForm,
                      amount: Number(
                        e.target.value
                      ),
                    })}
                    style={inputStyle} />
                </div>
                <div style={{
                  gridColumn: '1 / -1',
                }}>
                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Description
                  </div>
                  <input type="text"
                    value={expForm.description}
                    onChange={e => setExpForm({
                      ...expForm,
                      description: e.target.value,
                    })}
                    placeholder="What was this expense for?"
                    style={inputStyle} />
                </div>
                <div>
                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Date
                  </div>
                  <input type="date"
                    value={expForm.expense_date}
                    onChange={e => setExpForm({
                      ...expForm,
                      expense_date: e.target.value,
                    })}
                    style={inputStyle} />
                </div>
                <div>
                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Payment Method
                  </div>
                  <select
                    value={expForm.payment_method}
                    onChange={e => setExpForm({
                      ...expForm,
                      payment_method:
                        e.target.value,
                    })}
                    style={inputStyle}>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>
                        {m.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Tax Deductible
                  </div>
                  <select
                    value={expForm.deductible}
                    onChange={e => setExpForm({
                      ...expForm,
                      deductible: Number(
                        e.target.value
                      ),
                    })}
                    style={inputStyle}>
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>
                <div>
                  <div className="label"
                    style={{ marginBottom: 4 }}>
                    Notes
                  </div>
                  <input type="text"
                    value={expForm.notes}
                    onChange={e => setExpForm({
                      ...expForm,
                      notes: e.target.value,
                    })}
                    placeholder="Optional notes"
                    style={inputStyle} />
                </div>
              </div>
              <div style={{
                display: 'flex', gap: 8,
                marginTop: 4,
              }}>
                <button
                  type="button"
                  onClick={addExpense}
                  disabled={
                    !expForm.description.trim()
                  }
                  style={{
                    padding: '8px 20px',
                    background:
                      expForm.description.trim()
                        ? 'var(--teal)'
                        : 'var(--mgray)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  Save Expense
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setShowAddExpense(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--lgray)',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--slate)',
                    cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {expenses.length === 0 ? (
            <div style={{
              background: 'var(--lgray)',
              borderRadius: 10,
              padding: '20px 24px',
              fontSize: 13,
              color: 'var(--slate)',
              textAlign: 'center',
            }}>
              No expenses logged yet.
              Add your first expense above.
            </div>
          ) : (
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {expenses.map((e, idx) => (
                <div key={e.expense_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom:
                    idx < expenses.length - 1
                      ? '1px solid var(--lgray)'
                      : 'none',
                  background: idx % 2 === 0
                    ? 'var(--white)'
                    : 'var(--cream)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--navy)',
                    }}>
                      {e.description}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--slate)',
                      marginTop: 2,
                    }}>
                      {e.category} ·{' '}
                      {e.expense_date} ·{' '}
                      {e.payment_method
                        .replace('_', ' ')}
                      {e.deductible
                        ? ' · deductible' : ''}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--coral)',
                    fontFamily: 'Georgia, serif',
                  }}>
                    ${e.amount.toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      deleteExpense(e.expense_id)}
                    style={{
                      padding: '4px 10px',
                      background: '#F05F5712',
                      border:
                        '1px solid var(--coral)',
                      borderRadius: 6,
                      fontSize: 10,
                      color: 'var(--coral)',
                      cursor: 'pointer',
                    }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'calculator' && (
        <div style={{ maxWidth: 640 }}>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--mgray)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: 'var(--navy)',
              marginBottom: 16,
            }}>
              Live Tax Calculator
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12, marginBottom: 16,
            }}>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Quarterly Income ($)
                </div>
                <input type="number"
                  value={qForm.income}
                  onChange={e => setQForm({
                    ...qForm,
                    income: Number(e.target.value),
                  })}
                  style={inputStyle} />
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Quarterly Expenses ($)
                </div>
                <input type="number"
                  value={qForm.expenses}
                  onChange={e => setQForm({
                    ...qForm,
                    expenses: Number(
                      e.target.value
                    ),
                  })}
                  style={inputStyle} />
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Reasonable Salary ($)
                </div>
                <input type="number"
                  value={qForm.reasonable_salary}
                  onChange={e => setQForm({
                    ...qForm,
                    reasonable_salary: Number(
                      e.target.value
                    ),
                  })}
                  style={inputStyle} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: 10,
              }}>
                <div style={{
                  fontSize: 12,
                  color: 'var(--slate)',
                  fontStyle: 'italic',
                }}>
                  Suggested: $
                  {(suggestSalary(profit * 4) / 4)
                    .toLocaleString()}/qtr
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}>
              <div style={{
                background: '#C8974A10',
                border: '1px solid var(--gold)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: 'var(--gold)',
                  marginBottom: 10,
                }}>
                  Filing as LLC
                </div>
                {([
                  ['Profit', profit],
                  ['SE Tax (15.3%)', llc.se_tax],
                  ['Federal Income', llc.federal],
                  ['WI State', llc.state],
                ] as const).map(([lbl, value]) => (
                  <div key={lbl}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 4,
                      color: 'var(--navy)',
                    }}>
                    <span>{lbl}</span>
                    <span style={{
                      fontWeight: 600,
                    }}>
                      ${value
                        .toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )}
                    </span>
                  </div>
                ))}
                <div style={{
                  borderTop:
                    '1px solid var(--gold)',
                  marginTop: 8, paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'var(--gold)',
                  fontFamily: 'Georgia, serif',
                }}>
                  <span>Total Tax</span>
                  <span>
                    ${llc.total.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#3BBFBF10',
                border: '1px solid var(--teal)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: 'var(--teal)',
                  marginBottom: 10,
                }}>
                  Filing as S-Corp
                </div>
                {([
                  ['Salary', salary],
                  ['Distributions', scorp.distributions],
                  ['FICA (15.3% on salary)',
                    scorp.fica],
                  ['Federal Income', scorp.federal],
                  ['WI State', scorp.state],
                ] as const).map(([lbl, value]) => (
                  <div key={lbl}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 4,
                      color: 'var(--navy)',
                    }}>
                    <span>{lbl}</span>
                    <span style={{
                      fontWeight: 600,
                    }}>
                      ${value
                        .toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )}
                    </span>
                  </div>
                ))}
                <div style={{
                  borderTop:
                    '1px solid var(--teal)',
                  marginTop: 8, paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'var(--teal)',
                  fontFamily: 'Georgia, serif',
                }}>
                  <span>Total Tax</span>
                  <span>
                    ${scorp.total.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )}
                  </span>
                </div>
              </div>
            </div>

            {savings > 0 && (
              <div style={{
                background: '#3A7D5C18',
                border: '1px solid var(--green)',
                borderRadius: 10,
                padding: '12px 16px',
                marginTop: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{
                  fontSize: 13,
                  color: 'var(--navy)',
                }}>
                  S-Corp saves you this quarter
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--green)',
                  fontFamily: 'Georgia, serif',
                }}>
                  ${savings.toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 }
                  )}
                </div>
              </div>
            )}

            <div style={{
              marginTop: 12,
              fontSize: 10,
              color: 'var(--slate)',
              fontFamily: 'Courier New, monospace',
              lineHeight: 1.6,
            }}>
              Estimates only. Federal income tax
              at 24% bracket. WI state at 7.65%.
              SE tax at 15.3% on 92.35% of profit.
              Consult your CPA before filing.
              S-Corp election requires Form 2553.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
