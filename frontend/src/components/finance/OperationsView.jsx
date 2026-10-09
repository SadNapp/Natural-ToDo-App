import { useMemo, useState } from 'react';
import { dateInput, formatMoney } from '../../utils/finance';

const blankOperation = () => ({ title: '', amount: '', type: 'expense', categoryId: '', date: dateInput(), status: 'planned', account: '', note: '', recurring: false, frequency: 'monthly' });

function OperationsView({ operations, categories, onSave, onDelete, loading }) {
    const [form, setForm] = useState(blankOperation());
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ search: '', from: '', to: '', type: 'all', category: 'all', status: 'all' });
    const [error, setError] = useState('');
    const filtered = useMemo(() => operations.filter((item) => {
        const textMatches = `${item.title} ${item.note || ''}`.toLocaleLowerCase('uk-UA').includes(filters.search.toLocaleLowerCase('uk-UA'));
        return textMatches && (!filters.from || item.date >= filters.from) && (!filters.to || item.date <= filters.to)
            && (filters.type === 'all' || item.type === filters.type)
            && (filters.category === 'all' || item.categoryId === filters.category)
            && (filters.status === 'all' || item.status === filters.status);
    }).sort((a, b) => b.date.localeCompare(a.date)), [operations, filters]);
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

    const submit = async (event) => {
        event.preventDefault();
        const amount = Number(form.amount);
        const categoryId = form.categoryId || categories[0]?.id;
        if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !categoryId || !form.date) {
            setError('Заповніть назву, категорію й дату та вкажіть суму більше нуля.'); return;
        }
        setError('');
        try {
            await onSave({ ...form, categoryId, title: form.title.trim(), amount, note: form.note.trim(), id: editingId || crypto.randomUUID() }, editingId);
            setForm(blankOperation()); setEditingId(null);
        } catch (saveError) { setError(saveError.message || 'Не вдалося зберегти операцію.'); }
    };

    const edit = (item) => { setForm({ ...blankOperation(), ...item }); setEditingId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const remove = async (item) => {
        if (!window.confirm(`Видалити операцію «${item.title}»?`)) return;
        try { await onDelete(item.id); } catch (deleteError) { setError(deleteError.message || 'Не вдалося видалити операцію.'); }
    };

    return <div className="finance-view">
        <section className="panel form-panel"><div className="section-heading compact"><div><p className="eyebrow">ОБЛІК ГРОШЕЙ</p><h2>{editingId ? 'Редагувати операцію' : 'Нова операція'}</h2></div></div>
            <form onSubmit={submit}>
                <div className="form-grid operation-grid">
                    <label className="field-label wide-field">Назва<input className="text-input" value={form.title} onChange={(event) => set('title', event.target.value)} maxLength="120" required placeholder="Наприклад, продукти на тиждень" /></label>
                    <label className="field-label">Сума, ₴<input className="text-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => set('amount', event.target.value)} required /></label>
                    <label className="field-label">Тип<select className="text-input" value={form.type} onChange={(event) => set('type', event.target.value)}><option value="expense">Витрата</option><option value="income">Дохід</option></select></label>
                    <label className="field-label">Категорія<select className="text-input" value={form.categoryId || categories[0]?.id || ''} onChange={(event) => set('categoryId', event.target.value)} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                    <label className="field-label">Дата<input className="text-input" type="date" value={form.date} onChange={(event) => set('date', event.target.value)} required /></label>
                    <label className="field-label">Статус<select className="text-input" value={form.status} onChange={(event) => set('status', event.target.value)}><option value="planned">Заплановано</option><option value="completed">Виконано</option></select></label>
                    <label className="field-label">Рахунок або спосіб оплати<input className="text-input" value={form.account} onChange={(event) => set('account', event.target.value)} maxLength="80" placeholder="Готівка, картка…" /></label>
                    <label className="field-label wide-field">Нотатка<input className="text-input" value={form.note} onChange={(event) => set('note', event.target.value)} maxLength="500" placeholder="Необов’язково" /></label>
                </div>
                <div className="recurring-row"><label><input type="checkbox" checked={form.recurring} onChange={(event) => set('recurring', event.target.checked)} /> Регулярний платіж</label>{form.recurring && <label className="field-label">Періодичність<select className="text-input" value={form.frequency} onChange={(event) => set('frequency', event.target.value)}><option value="weekly">Щотижня</option><option value="monthly">Щомісяця</option><option value="yearly">Щороку</option></select></label>}</div>
                {error && <p className="inline-error" role="alert">{error}</p>}
                <div className="form-actions"><button className="primary-button" type="submit">{editingId ? 'Зберегти зміни' : 'Додати операцію'}</button>{editingId && <button className="secondary-button" type="button" onClick={() => { setForm(blankOperation()); setEditingId(null); setError(''); }}>Скасувати</button>}</div>
            </form>
        </section>

        <section className="panel"><div className="section-heading compact"><div><p className="eyebrow">ІСТОРІЯ ГРОШОВИХ РУХІВ</p><h2>Операції</h2></div><span className="muted-label">{filtered.length} записів</span></div>
            <div className="filter-grid"><label className="field-label">Пошук<input className="text-input" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Назва або нотатка" /></label><label className="field-label">Від<input className="text-input" type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} /></label><label className="field-label">До<input className="text-input" type="date" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} /></label><label className="field-label">Тип<select className="text-input" value={filters.type} onChange={(event) => setFilter('type', event.target.value)}><option value="all">Усі</option><option value="income">Дохід</option><option value="expense">Витрата</option></select></label><label className="field-label">Категорія<select className="text-input" value={filters.category} onChange={(event) => setFilter('category', event.target.value)}><option value="all">Усі категорії</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="field-label">Статус<select className="text-input" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}><option value="all">Усі</option><option value="completed">Виконано</option><option value="planned">Заплановано</option></select></label></div>
            {loading ? <div className="empty-state">Завантаження операцій…</div> : filtered.length === 0 ? <div className="empty-state"><strong>Операцій поки немає</strong><span>Додайте дохід або витрату, щоб побачити історію.</span></div> : <ul className="data-list operation-list">{filtered.map((item) => <li key={item.id} className="data-row"><div className="data-main"><strong>{item.title}</strong><span>{item.date} · {categories.find((category) => category.id === item.categoryId)?.name || 'Інше'} · {item.status === 'completed' ? 'Виконано' : 'Заплановано'}{item.account ? ` · ${item.account}` : ''}</span>{item.note && <small>{item.note}</small>}</div><strong className={`operation-amount ${item.type === 'income' ? 'amount-income' : ''}`}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount)}</strong><div className="row-actions"><button className="text-button" onClick={() => edit(item)}>Змінити</button><button className="text-button danger-text" onClick={() => remove(item)}>Видалити</button></div></li>)}</ul>}
        </section>
    </div>;
}

export default OperationsView;
