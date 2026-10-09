import { dateInput, formatMoney, monthInput, operationInMonth } from '../../utils/finance';

const monthLabel = (value) => new Date(`${value}-01T12:00:00`).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

function OverviewView({ month, onMonthChange, operations, categories, goals, contributions }) {
    const monthItems = operations.filter((item) => operationInMonth(item, month));
    const actual = monthItems.filter((item) => item.status === 'completed');
    const planned = monthItems.filter((item) => item.status === 'planned');
    const sum = (items, type) => items.filter((item) => item.type === type).reduce((total, item) => total + Number(item.amount || 0), 0);
    const income = sum(actual, 'income'); const expenses = sum(actual, 'expense');
    const saved = contributions.filter((item) => item.date?.slice(0, 7) === month).reduce((total, item) => total + Number(item.amount || 0), 0);
    const upcomingCutoff = month === monthInput() ? dateInput() : `${month}-01`;
    const upcoming = planned.filter((item) => item.type === 'expense' && item.date >= upcomingCutoff).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    const spentByCategory = categories.map((category) => ({ category, amount: actual.filter((item) => item.type === 'expense' && item.categoryId === category.id).reduce((total, item) => total + Number(item.amount || 0), 0) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
    const spentByWeek = [0, 0, 0, 0, 0];
    actual.filter((item) => item.type === 'expense' && item.date?.startsWith(month)).forEach((item) => { const day = Number(item.date.slice(8, 10)); spentByWeek[Math.min(Math.floor((day - 1) / 7), 4)] += Number(item.amount || 0); });
    const maxWeek = Math.max(...spentByWeek, 1);
    const hasActual = actual.length > 0;
    const shown = (value) => hasActual ? formatMoney(value) : '—';
    const nearest = goals.filter((goal) => Number(goal.targetAmount) > Number(goal.savedAmount)).sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999'))[0];

    return <div className="finance-view">
        <section className="month-toolbar"><button className="icon-button" onClick={() => onMonthChange(-1)} aria-label="Попередній місяць">‹</button><h2>{monthLabel(month)}</h2><button className="icon-button" onClick={() => onMonthChange(1)} aria-label="Наступний місяць">›</button></section>
        <section className="finance-grid overview-cards">
            <article className="finance-card income-card"><span>Фактичні доходи</span><strong>{shown(income)}</strong><small>Виконані операції</small></article>
            <article className="finance-card expense-card"><span>Фактичні витрати</span><strong>{shown(expenses)}</strong><small>Виконані операції</small></article>
            <article className="finance-card balance-card"><span>Залишок</span><strong>{shown(income - expenses)}</strong><small>Дохід мінус витрати</small></article>
            <article className="finance-card savings-card"><span>Відкладено на цілі</span><strong>{contributions.some((item) => item.date?.slice(0, 7) === month) ? formatMoney(saved) : '—'}</strong><small>Внески цього місяця</small></article>
        </section>
        {planned.length ? <p className="scheduled-total">Заплановано окремо: надходження {formatMoney(sum(planned, 'income'))} · платежі {formatMoney(sum(planned, 'expense'))}</p> : <p className="scheduled-total">На цей місяць немає запланованих операцій.</p>}
        <div className="overview-columns">
            <section className="panel"><div className="section-heading compact"><div><p className="eyebrow">ФАКТИЧНІ ВИТРАТИ</p><h2>За тижнями</h2></div></div>
                {actual.some((item) => item.type === 'expense' && item.date?.startsWith(month)) ? <div className="weekly-chart" aria-label="Витрати за тижнями місяця">{spentByWeek.map((amount, index) => <div className="chart-column" key={index}><strong>{amount ? formatMoney(amount) : ''}</strong><span className="chart-track"><i style={{ height: `${Math.max(amount / maxWeek * 100, amount ? 10 : 3)}%` }} /></span><small>{index === 4 ? '29+' : `${index * 7 + 1}–${index * 7 + 7}`}</small></div>)}</div> : <div className="empty-state compact-empty">Додайте виконану витрату за цей місяць, щоб побачити графік.</div>}
            </section>
            <section className="panel"><div className="section-heading compact"><div><p className="eyebrow">КАТЕГОРІЇ</p><h2>Розподіл витрат</h2></div></div>
                {spentByCategory.length ? <ul className="category-breakdown">{spentByCategory.map(({ category, amount }) => <li key={category.id}><div><span>{category.name}</span><strong>{formatMoney(amount)}</strong></div><span className="category-track"><i style={{ width: `${amount / spentByCategory[0].amount * 100}%` }} /></span></li>)}</ul> : <div className="empty-state compact-empty">Після першої виконаної витрати тут з’явиться розподіл.</div>}
            </section>
        </div>
        <section className="panel upcoming-panel"><div className="section-heading compact"><div><p className="eyebrow">НЕ ЗМІШУЄМО З ФАКТОМ</p><h2>Найближчі заплановані платежі</h2></div></div>
            {upcoming.length ? <ul className="upcoming-list">{upcoming.map((item) => <li key={item.id}><span>{item.title}<small>{item.date}</small></span><strong>−{formatMoney(item.amount)}</strong></li>)}</ul> : <p className="muted-label">Немає запланованих платежів на цей період.</p>}
            {nearest && <p className="goal-nudge">Найближча ціль: <strong>{nearest.name}</strong> · відкладено {formatMoney(nearest.savedAmount)} з {formatMoney(nearest.targetAmount)}</p>}
        </section>
        <p className="helper-note">Огляд допомагає планувати особисті фінанси й не є фінансовою порадою.</p>
    </div>;
}

export default OverviewView;
