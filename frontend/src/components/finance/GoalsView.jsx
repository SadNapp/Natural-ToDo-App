import { useMemo, useState } from 'react';
import { formatMoney } from '../../utils/finance';

const blankGoal = () => ({ name: '', targetAmount: '', savedAmount: '0', targetDate: '', priority: 'normal', note: '' });
const addMonths = (date, months) => { const result = new Date(date); result.setMonth(result.getMonth() + months); return result; };

function GoalsView({ goals, contributions, categories, onSave, onDelete, onContribute }) {
    const [form, setForm] = useState(blankGoal());
    const [editingId, setEditingId] = useState(null);
    const [contributionDrafts, setContributionDrafts] = useState({});
    const [scenario, setScenario] = useState({ monthly: '', categoryId: '', cutAmount: '' });
    const [error, setError] = useState('');
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const plannedMonthlyIncome = Number(scenario.monthly) || 0;
    const simulatedSavings = Number(scenario.cutAmount) || 0;
    const saveGoal = async (event) => {
        event.preventDefault();
        const targetAmount = Number(form.targetAmount); const savedAmount = Number(form.savedAmount || 0);
        if (!form.name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(savedAmount) || savedAmount < 0) { setError('Вкажіть назву, цільову суму більше нуля та невід’ємну вже заощаджену суму.'); return; }
        setError('');
        try { await onSave({ ...form, id: editingId || crypto.randomUUID(), name: form.name.trim(), targetAmount, savedAmount, note: form.note.trim() }, editingId); setForm(blankGoal()); setEditingId(null); }
        catch (saveError) { setError(saveError.message || 'Не вдалося зберегти ціль.'); }
    };
    const editGoal = (goal) => { setForm({ ...blankGoal(), ...goal }); setEditingId(goal.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const deleteGoal = async (goal) => { if (window.confirm(`Видалити ціль «${goal.name}»? Її історія внесків також буде видалена.`)) { try { await onDelete(goal.id); } catch (deleteError) { setError(deleteError.message || 'Не вдалося видалити ціль.'); } } };
    const contribute = async (goal) => {
        const amount = Number(contributionDrafts[goal.id]);
        if (!Number.isFinite(amount) || amount <= 0) { setError('Внесок має бути більше нуля.'); return; }
        setError('');
        try { await onContribute(goal, { amount, date: new Date().toISOString().slice(0, 10), note: '' }); setContributionDrafts((current) => ({ ...current, [goal.id]: '' })); }
        catch (contributionError) { setError(contributionError.message || 'Не вдалося зберегти внесок.'); }
    };

    const simulations = useMemo(() => goals.map((goal) => {
        const remaining = Math.max(Number(goal.targetAmount) - Number(goal.savedAmount), 0);
        const monthly = plannedMonthlyIncome + simulatedSavings;
        return { id: goal.id, remaining, monthly, date: monthly > 0 && remaining > 0 ? addMonths(new Date(), Math.ceil(remaining / monthly)) : null };
    }), [goals, plannedMonthlyIncome, simulatedSavings]);

    return <div className="finance-view">
        <section className="panel"><div className="section-heading compact"><div><p className="eyebrow">МАЙБУТНІ ПОКУПКИ ТА МРІЇ</p><h2>{editingId ? 'Змінити ціль' : 'Нова ціль заощадження'}</h2></div></div>
            <form onSubmit={saveGoal}><div className="form-grid goal-form-grid"><label className="field-label">Назва цілі<input className="text-input" value={form.name} onChange={(event) => set('name', event.target.value)} maxLength="100" required placeholder="Наприклад, новий телефон" /></label><label className="field-label">Цільова сума, ₴<input className="text-input" type="number" min="0.01" step="0.01" value={form.targetAmount} onChange={(event) => set('targetAmount', event.target.value)} required /></label><label className="field-label">Вже заощаджено, ₴<input className="text-input" type="number" min="0" step="0.01" value={form.savedAmount} onChange={(event) => set('savedAmount', event.target.value)} /></label><label className="field-label">Бажана дата<input className="text-input" type="date" value={form.targetDate} onChange={(event) => set('targetDate', event.target.value)} /></label><label className="field-label">Пріоритет<select className="text-input" value={form.priority} onChange={(event) => set('priority', event.target.value)}><option value="low">Можна зачекати</option><option value="normal">Звичайний</option><option value="high">Важливий</option></select></label><label className="field-label">Нотатка<input className="text-input" value={form.note} onChange={(event) => set('note', event.target.value)} maxLength="300" /></label></div>{error && <p className="inline-error" role="alert">{error}</p>}<div className="form-actions"><button className="primary-button" type="submit">{editingId ? 'Зберегти ціль' : 'Створити ціль'}</button>{editingId && <button className="secondary-button" type="button" onClick={() => { setForm(blankGoal()); setEditingId(null); }}>Скасувати</button>}</div></form>
        </section>

        {goals.length === 0 ? <div className="empty-state"><strong>Цілей поки немає</strong><span>Створіть ціль — застосунок розрахує потрібний темп заощадження.</span></div> : <section className="goal-grid">{goals.map((goal) => {
            const target = Number(goal.targetAmount) || 0; const saved = Number(goal.savedAmount) || 0; const remaining = Math.max(target - saved, 0); const percent = target > 0 ? Math.min(saved / target * 100, 100) : 0;
            const days = goal.targetDate ? Math.ceil((new Date(`${goal.targetDate}T23:59:59`) - new Date()) / 86400000) : null;
            const months = days !== null ? Math.max(Math.ceil(days / 30.4375), 1) : null; const weeks = days !== null ? Math.max(Math.ceil(days / 7), 1) : null;
            const monthlyNeed = months ? remaining / months : null; const weeklyNeed = weeks ? remaining / weeks : null;
            const achieved = remaining === 0; const expired = days !== null && days < 0 && !achieved;
            const history = contributions.filter((item) => item.goalId === goal.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            const simulation = simulations.find((item) => item.id === goal.id);
            return <article className="goal-card" key={goal.id}><div className="goal-title-row"><div><p className="eyebrow">{goal.priority === 'high' ? 'ВАЖЛИВА ЦІЛЬ' : 'ЦІЛЬ ЗАОЩАДЖЕННЯ'}</p><h3>{goal.name}</h3></div><div className="row-actions"><button className="text-button" onClick={() => editGoal(goal)}>Змінити</button><button className="text-button danger-text" onClick={() => deleteGoal(goal)}>Видалити</button></div></div>
                <div className="goal-values"><strong>{formatMoney(saved)} <small>із {formatMoney(target)}</small></strong><span>{formatMoney(remaining)} залишилося</span></div><div className="goal-progress"><i style={{ width: `${percent}%` }} /></div><p className="goal-percent">{Math.round(percent)}% виконано</p>
                {achieved ? <p className="goal-state success-state">Ціль досягнута 🎉</p> : expired ? <p className="goal-state warning-state">Бажана дата минула. Оновіть дату або залиште ціль без терміну.</p> : goal.targetDate ? <p className="goal-state">{days === 0 ? 'Бажана дата — сьогодні.' : `До бажаної дати ${days} дн.`} Орієнтир: {formatMoney(monthlyNeed)} на місяць або {formatMoney(weeklyNeed)} на тиждень.</p> : <p className="goal-state">Додайте бажану дату, щоб побачити рекомендований темп заощадження.</p>}
                {goal.note && <p className="goal-note">{goal.note}</p>}
                <div className="contribution-row"><label className="field-label">Додати внесок, ₴<input className="text-input" type="number" min="0.01" step="0.01" value={contributionDrafts[goal.id] || ''} onChange={(event) => setContributionDrafts((current) => ({ ...current, [goal.id]: event.target.value }))} /></label><button className="secondary-button" onClick={() => contribute(goal)}>Додати внесок</button></div>
                {history.length > 0 && <details className="contribution-history"><summary>Історія внесків · {history.length}</summary><ul>{history.map((item) => <li key={item.id}><span>{item.date}</span><strong>+{formatMoney(item.amount)}</strong></li>)}</ul></details>}
                {scenario.monthly && simulation?.date && <p className="scenario-result">Якщо відкладати {formatMoney(simulation.monthly)} на місяць, орієнтовна дата досягнення: {simulation.date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}.</p>}
            </article>;
        })}</section>}

        <section className="panel scenario-panel"><div className="section-heading compact"><div><p className="eyebrow">МОЖЛИВИЙ СЦЕНАРІЙ</p><h2>Що, якщо відкладати більше?</h2></div></div><div className="form-grid"><label className="field-label">Додатково відкладати на місяць, ₴<input className="text-input" type="number" min="0" step="0.01" value={scenario.monthly} onChange={(event) => setScenario((current) => ({ ...current, monthly: event.target.value }))} placeholder="0" /></label><label className="field-label">Категорія для моделювання<select className="text-input" value={scenario.categoryId} onChange={(event) => setScenario((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Не обрано</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="field-label">Можлива економія на місяць, ₴<input className="text-input" type="number" min="0" step="0.01" value={scenario.cutAmount} onChange={(event) => setScenario((current) => ({ ...current, cutAmount: event.target.value }))} placeholder="0" /></label></div><p className="helper-note">Це лише умовний розрахунок за вашими припущеннями. Він не змінює бюджет і не означає, що витрати в обраній категорії можна скоротити.</p>{scenario.categoryId && simulatedSavings > 0 && <p className="goal-nudge">У сценарії враховано {formatMoney(simulatedSavings)} можливої економії щомісяця в категорії «{categories.find((item) => item.id === scenario.categoryId)?.name}».</p>}</section>
    </div>;
}

export default GoalsView;
