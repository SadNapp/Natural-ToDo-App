import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '../../utils/finance';

const templates = {
    '50-30-20': { label: '50 / 30 / 20', groups: [{ id: 'needs', name: 'Необхідне' }, { id: 'wants', name: 'Бажання' }, { id: 'savings', name: 'Заощадження або борги' }], allocations: { needs: 50, wants: 30, savings: 20 } },
    '60-30-10': { label: '60 / 30 / 10', groups: [{ id: 'needs', name: 'Необхідне' }, { id: 'wants', name: 'Бажання' }, { id: 'savings', name: 'Заощадження' }], allocations: { needs: 60, wants: 30, savings: 10 } },
    '70-20-10': { label: '70 / 20 / 10', groups: [{ id: 'needs', name: 'Необхідне' }, { id: 'wants', name: 'Бажання' }, { id: 'savings', name: 'Заощадження' }], allocations: { needs: 70, wants: 20, savings: 10 } },
    '80-20': { label: '80 / 20', groups: [{ id: 'expenses', name: 'Усі поточні витрати' }, { id: 'savings', name: 'Заощадження' }], allocations: { expenses: 80, savings: 20 } },
};

function BudgetView({ budget, categories, operations, month, onSave, onSaveCategories }) {
    const [draft, setDraft] = useState(budget);
    const [incomeText, setIncomeText] = useState(budget.netIncome ?? '');
    const [categoryDraft, setCategoryDraft] = useState(categories);
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');
    useEffect(() => { setDraft(budget); setIncomeText(budget.netIncome ?? ''); }, [budget]);
    useEffect(() => { setCategoryDraft(categories); }, [categories]);

    const config = templates[draft.template] || templates['50-30-20'];
    const isZero = draft.template === 'zero-based';
    const incomeFromOperations = operations.filter((item) => item.type === 'income' && item.status === 'completed' && item.date?.startsWith(month)).reduce((total, item) => total + Number(item.amount || 0), 0);
    const netIncome = incomeText === '' ? incomeFromOperations : Number(incomeText);
    const hasIncome = incomeText !== '' || incomeFromOperations > 0;
    const actualByCategory = useMemo(() => operations.filter((item) => item.type === 'expense' && item.status === 'completed' && item.date?.startsWith(month)).reduce((result, item) => ({ ...result, [item.categoryId]: (result[item.categoryId] || 0) + Number(item.amount || 0) }), {}), [operations, month]);
    const groupIds = isZero ? [] : config.groups.map((group) => group.id);
    const percentageTotal = groupIds.reduce((total, id) => total + Number(draft.allocations?.[id] || 0), 0);
    const distributed = isZero ? categories.reduce((total, category) => total + Number(draft.allocations?.[category.id] || 0), 0) : netIncome;

    const changeTemplate = (template) => {
        const next = template === 'zero-based' ? { ...draft, template, allocations: {} }
            : { ...draft, template, allocations: { ...templates[template].allocations } };
        setDraft(next); setError('');
    };
    const setAllocation = (key, value) => setDraft((current) => ({ ...current, allocations: { ...current.allocations, [key]: value === '' ? '' : Number(value) } }));
    const saveBudget = async (event) => {
        event.preventDefault();
        if (incomeText !== '' && (!Number.isFinite(Number(incomeText)) || Number(incomeText) < 0)) { setError('Дохід має бути невід’ємним числом.'); return; }
        if (!isZero && (groupIds.some((id) => !Number.isFinite(Number(draft.allocations?.[id])) || Number(draft.allocations[id]) < 0 || Number(draft.allocations[id]) > 100) || Math.round(percentageTotal * 100) / 100 !== 100)) { setError(`Розподіл зараз становить ${percentageTotal}%. Укажіть невід’ємні відсотки рівно на 100%.`); return; }
        if (isZero && (categories.some((category) => Number(draft.allocations?.[category.id] || 0) < 0) || remainder < 0)) { setError('Розподіл не може бути від’ємним або перевищувати чистий дохід.'); return; }
        setError('');
        try { await onSave({ ...draft, month, netIncome: incomeText === '' ? null : Number(incomeText) }); }
        catch (saveError) { setError(saveError.message || 'Не вдалося зберегти бюджет.'); }
    };
    const renameCategory = (id, value) => setCategoryDraft((current) => current.map((category) => category.id === id ? { ...category, name: value } : category));
    const changeGroup = (id, group) => setCategoryDraft((current) => current.map((category) => category.id === id ? { ...category, group } : category));
    const addCategory = () => { const name = newCategory.trim(); if (!name) return; setCategoryDraft((current) => [...current, { id: crypto.randomUUID(), name, group: isZero || draft.template === '80-20' ? 'needs' : (groupIds[0] || 'needs') }]); setNewCategory(''); };
    const saveCategories = async () => { try { await onSaveCategories(categoryDraft); setError(''); } catch (saveError) { setError(saveError.message || 'Не вдалося зберегти категорії.'); } };
    const categoryGroupOptions = isZero ? templates['50-30-20'].groups : config.groups;
    const remainder = isZero ? netIncome - distributed : 0;

    return <div className="finance-view">
        <form className="panel" onSubmit={saveBudget}><div className="section-heading compact"><div><p className="eyebrow">ПЛАНУВАННЯ МІСЯЦЯ</p><h2>Бюджет</h2></div><span className="muted-label">Місяць: {month}</span></div>
            <div className="budget-controls"><label className="field-label">Шаблон<select className="text-input" value={draft.template} onChange={(event) => changeTemplate(event.target.value)}><option value="50-30-20">50 / 30 / 20</option><option value="60-30-10">60 / 30 / 10</option><option value="70-20-10">70 / 20 / 10</option><option value="80-20">80 / 20</option><option value="zero-based">Нульовий залишок</option></select></label><label className="field-label">Чистий дохід за місяць, ₴<input className="text-input" type="number" min="0" step="0.01" value={incomeText} onChange={(event) => setIncomeText(event.target.value)} placeholder={`З операцій: ${formatMoney(incomeFromOperations)}`} /></label></div>
            <p className="muted-label budget-explainer">{incomeText === '' ? (incomeFromOperations ? `Використовується фактичний дохід з операцій: ${formatMoney(incomeFromOperations)}.` : 'Додайте дохідну операцію або задайте чистий дохід вручну, щоб розрахувати суми.') : 'Використовується заданий вами чистий дохід.'} Шаблон — інструмент планування, а не фінансова порада.</p>
            {!isZero ? <div className="allocation-editor">{config.groups.map((group) => <label className="field-label" key={group.id}>{group.name} · план {hasIncome ? formatMoney(netIncome * Number(draft.allocations?.[group.id] || 0) / 100) : '—'}<span className="percent-input"><input className="text-input" type="number" min="0" max="100" step="0.01" value={draft.allocations?.[group.id] ?? ''} onChange={(event) => setAllocation(group.id, event.target.value)} /><span>%</span></span></label>)}</div> : <><p className="zero-remainder">Ще не розподілено: <strong>{hasIncome ? formatMoney(remainder) : '—'}</strong></p><div className="zero-allocation-list">{categories.map((category) => <label className="field-label" key={category.id}>{category.name}<span className="money-input"><input className="text-input" type="number" min="0" step="0.01" value={draft.allocations?.[category.id] ?? ''} onChange={(event) => setAllocation(category.id, event.target.value)} placeholder="0" /><span>₴</span></span></label>)}</div></>}
            <p className={`validation-line ${(!isZero && percentageTotal !== 100) || (isZero && remainder !== 0) ? 'needs-attention' : ''}`}>{isZero ? (hasIncome ? `Розподілено ${formatMoney(distributed)} з ${formatMoney(netIncome)}.` : 'Задайте дохід, щоб перевірити розподіл.') : `Сума розподілу: ${percentageTotal}% (потрібно 100%).`}</p>
            {error && <p className="inline-error" role="alert">{error}</p>}<button className="primary-button budget-save" type="submit">Зберегти бюджет</button>
        </form>

        <section className="panel"><div className="section-heading compact"><div><p className="eyebrow">ПЛАН І ФАКТ</p><h2>Витрати за групами</h2></div></div>
            <ul className="budget-group-list">{(isZero ? [{ id: 'all', name: 'Розподілено за категоріями' }] : config.groups).map((group) => {
                const groupCats = isZero ? categories : categories.filter((category) => {
                    const mappedGroup = draft.categoryGroups?.[category.id];
                    const selectedGroup = mappedGroup === 'expenses' && draft.template !== '80-20' ? category.group : (mappedGroup ?? category.group);
                    return draft.template === '80-20' && group.id === 'expenses' ? selectedGroup !== 'savings' : selectedGroup === group.id;
                });
                const actual = groupCats.reduce((total, category) => total + Number(actualByCategory[category.id] || 0), 0);
                const plannedAmount = isZero ? groupCats.reduce((total, category) => total + Number(draft.allocations?.[category.id] || 0), 0) : netIncome * Number(draft.allocations?.[group.id] || 0) / 100;
                const hasActual = Object.values(actualByCategory).some((amount) => amount > 0);
                return <li className="budget-group" key={group.id}><div><strong>{group.name}</strong><span>План {hasIncome ? formatMoney(plannedAmount) : '—'} · факт {hasActual ? formatMoney(actual) : '—'} · залишок {hasIncome ? formatMoney(plannedAmount - actual) : '—'}</span></div><span className="budget-progress"><i className={actual > plannedAmount ? 'over-budget' : ''} style={{ width: `${hasIncome && plannedAmount > 0 ? Math.min(actual / plannedAmount * 100, 100) : (hasIncome && actual ? 100 : 0)}%` }} /></span>{hasIncome && actual > plannedAmount && <small className="inline-error">Фактичні витрати перевищили план на {formatMoney(actual - plannedAmount)}.</small>}</li>;
            })}</ul>
        </section>

        <section className="panel"><div className="section-heading compact"><div><p className="eyebrow">НАЛАШТУВАННЯ</p><h2>Категорії та групи</h2></div></div><ul className="category-editor">{categoryDraft.map((category) => { const savedGroup = draft.categoryGroups?.[category.id] ?? category.group; const selectedGroup = draft.template === '80-20' ? (savedGroup === 'savings' ? 'savings' : 'expenses') : (savedGroup === 'expenses' ? category.group : savedGroup); return <li key={category.id}><input className="text-input" aria-label="Назва категорії" value={category.name} onChange={(event) => renameCategory(category.id, event.target.value)} /><select className="text-input" aria-label={`Група для ${category.name}`} value={selectedGroup} onChange={(event) => { const nextGroup = event.target.value === 'expenses' ? (category.group === 'wants' ? 'wants' : 'needs') : event.target.value; changeGroup(category.id, nextGroup); setDraft((current) => ({ ...current, categoryGroups: { ...current.categoryGroups, [category.id]: event.target.value } })); }}>{categoryGroupOptions.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></li>; })}</ul><div className="add-category-row"><input className="text-input" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Нова категорія" /><button className="secondary-button" type="button" onClick={addCategory}>Додати</button><button className="text-button" type="button" onClick={saveCategories}>Зберегти категорії</button></div></section>
    </div>;
}

export default BudgetView;
