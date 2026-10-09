import { useCallback, useEffect, useMemo, useState } from 'react';
import { todoService } from './services/api';
import { financeService } from './services/financeService';
import Clock from './components/Clock';
import NatureFactWidget from './components/NatureFactWidget';
import OverviewView from './components/finance/OverviewView';
import OperationsView from './components/finance/OperationsView';
import BudgetView from './components/finance/BudgetView';
import GoalsView from './components/finance/GoalsView';
import NotesView from './components/finance/NotesView';
import ArchiveView from './components/finance/ArchiveView';
import { dateInput } from './utils/finance';
import './styles/TodoApp.css';

const tabs = [
    { id: 'overview', label: 'Огляд' },
    { id: 'operations', label: 'Операції' },
    { id: 'budget', label: 'Бюджет' },
    { id: 'goals', label: 'Цілі' },
    { id: 'notes', label: 'Нотатки та справи' },
    { id: 'archive', label: 'Архів / кошик' },
];
const currentMonth = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; };
const defaultBudget = (month) => ({ month, template: '50-30-20', netIncome: null, allocations: { needs: 50, wants: 30, savings: 20 }, categoryGroups: {} });

function App() {
    const [view, setView] = useState('overview');
    const [month, setMonth] = useState(currentMonth);
    const [financeData, setFinanceData] = useState(null);
    const [financeLoading, setFinanceLoading] = useState(true);
    const [financeError, setFinanceError] = useState('');
    const [tasks, setTasks] = useState([]);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [taskError, setTaskError] = useState('');
    const [isFallback, setIsFallback] = useState(false);

    const loadTasks = useCallback(async () => {
        setTasksLoading(true);
        try { setTasks(await todoService.getAll()); setTaskError(''); }
        catch { setTaskError('Не вдалося завантажити нотатки та справи.'); }
        finally { setTasksLoading(false); }
    }, []);

    const loadFinanceData = useCallback(async () => {
        setFinanceLoading(true);
        try { setFinanceData(await financeService.load()); setFinanceError(''); }
        catch (error) { setFinanceError(error.message || 'Не вдалося завантажити фінансові дані.'); }
        finally { setFinanceLoading(false); }
    }, []);

    useEffect(() => {
        todoService.onFallbackStatusChange = setIsFallback;
        todoService.onNetworkError = (message) => { setTaskError(message); setIsFallback(true); };
        loadFinanceData(); loadTasks();
        return () => { todoService.onFallbackStatusChange = null; todoService.onNetworkError = null; };
    }, [loadFinanceData, loadTasks]);

    useEffect(() => {
        if (view === 'archive') todoService.getDeleted().then(setArchivedTasks);
    }, [view]);

    const activeBudget = useMemo(() => financeData?.budgets.find((item) => item.month === month) || defaultBudget(month), [financeData?.budgets, month]);
    const activeOperations = useMemo(() => financeData?.operations.filter((item) => !item.isDeleted) || [], [financeData]);
    const deletedOperations = useMemo(() => financeData?.operations.filter((item) => item.isDeleted) || [], [financeData]);

    const saveResource = async (resource, value, existingId) => {
        const saved = await financeService.saveResource(resource, value, existingId) || value;
        setFinanceData((current) => {
            if (!current) return current;
            if (resource === 'budgets') return { ...current, budgets: [...current.budgets.filter((item) => item.month !== saved.month), saved] };
            const records = current[resource];
            return { ...current, [resource]: existingId ? records.map((item) => item.id === existingId ? saved : item) : [...records, saved] };
        });
        setFinanceError('');
        return saved;
    };

    const deleteResource = async (resource, id) => {
        await financeService.removeResource(resource, id);
        setFinanceData((current) => {
            if (!current) return current;
            if (resource === 'operations') return { ...current, operations: current.operations.map((item) => item.id === id ? { ...item, isDeleted: true } : item) };
            return { ...current, [resource]: current[resource].filter((item) => item.id !== id) };
        });
    };

    const saveCategories = async (categories) => {
        const saved = await financeService.saveCategories(categories) || categories;
        setFinanceData((current) => current ? { ...current, categories: saved } : current);
    };

    const restoreOperation = async (operation) => {
        await financeService.restoreOperation(operation.id);
        setFinanceData((current) => ({ ...current, operations: current.operations.map((item) => item.id === operation.id ? { ...item, isDeleted: false } : item) }));
    };

    const hardDeleteOperation = async (id) => {
        await financeService.hardDeleteOperation(id);
        setFinanceData((current) => ({ ...current, operations: current.operations.filter((item) => item.id !== id) }));
    };

    const addContribution = async (goal, contribution) => {
        const savedContribution = await financeService.contribute(goal.id, { ...contribution, date: dateInput() });
        const updatedGoal = { ...goal, savedAmount: Number(goal.savedAmount) + Number(contribution.amount) };
        await financeService.saveResource('goals', updatedGoal, goal.id);
        setFinanceData((current) => ({ ...current, goals: current.goals.map((item) => item.id === goal.id ? updatedGoal : item), contributions: [...current.contributions, savedContribution] }));
    };

    const changeMonth = (increment) => setMonth((value) => {
        const [year, monthNumber] = value.split('-').map(Number);
        const date = new Date(year, monthNumber - 1 + increment, 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });

    const createTask = async (task) => { await todoService.create(task); await loadTasks(); };
    const toggleTask = async (todo) => { const updated = { ...todo, isCompleted: !todo.isCompleted, completedAt: !todo.isCompleted ? new Date().toISOString() : null }; setTasks((current) => current.map((item) => item.id === todo.id ? updated : item)); await todoService.update(updated); };
    const deleteTask = async (id) => { if (!window.confirm('Перемістити цей запис до кошика?')) return; await todoService.delete(id); await loadTasks(); if (view === 'archive') todoService.getDeleted().then(setArchivedTasks); };
    const restoreTask = async (todo) => { await todoService.restore(todo.id); setArchivedTasks((current) => current.filter((item) => item.id !== todo.id)); await loadTasks(); };
    const hardDeleteTask = async (id) => { await todoService.hardDelete(id); setArchivedTasks((current) => current.filter((item) => item.id !== id)); };

    const renderView = () => {
        if (!financeData) return null;
        if (view === 'overview') return <OverviewView month={month} onMonthChange={changeMonth} operations={activeOperations} categories={financeData.categories} goals={financeData.goals} contributions={financeData.contributions} />;
        if (view === 'operations') return <OperationsView operations={activeOperations} categories={financeData.categories} onSave={(value, id) => saveResource('operations', value, id)} onDelete={(id) => deleteResource('operations', id)} loading={financeLoading} />;
        if (view === 'budget') return <BudgetView budget={activeBudget} categories={financeData.categories} operations={activeOperations} month={month} onSave={(value) => saveResource('budgets', value, value.month)} onSaveCategories={saveCategories} />;
        if (view === 'goals') return <GoalsView goals={financeData.goals} contributions={financeData.contributions} categories={financeData.categories} onSave={(value, id) => saveResource('goals', value, id)} onDelete={(id) => deleteResource('goals', id)} onContribute={addContribution} />;
        if (view === 'notes') return <NotesView todos={tasks} operations={activeOperations} goals={financeData.goals} categories={financeData.categories} loading={tasksLoading} onCreate={createTask} onToggle={toggleTask} onDelete={deleteTask} onRefresh={loadTasks} />;
        return <ArchiveView todos={archivedTasks} operations={deletedOperations} categories={financeData.categories} onRestoreTodo={restoreTask} onHardDeleteTodo={hardDeleteTask} onRestoreOperation={restoreOperation} onHardDeleteOperation={hardDeleteOperation} />;
    };

    return <main className="main-wrapper"><div className="background-overlay" />
        <section className="glass-container finance-shell" aria-label="Особистий фінансовий записник">
            <header className="todo-header"><div className="brand-lockup"><span className="brand-mark" aria-hidden="true">✳</span><div><p className="eyebrow">ВАШ ПРОСТІР ДЛЯ ПЛАНІВ</p><h1>Фінансовий записник</h1><Clock /></div></div><span className={`data-mode-badge ${financeService.mode === 'mock' ? 'mock-mode' : ''}`}>{financeService.mode === 'mock' ? 'Локальні дані' : 'API'}</span></header>
            <nav className="finance-nav" aria-label="Головні розділи">{tabs.map((tab) => <button key={tab.id} className={`nav-tab ${view === tab.id ? 'active' : ''}`} onClick={() => setView(tab.id)} aria-current={view === tab.id ? 'page' : undefined}>{tab.label}{tab.id === 'archive' && (archivedTasks.length + deletedOperations.length > 0) && <span className="nav-count">{archivedTasks.length + deletedOperations.length}</span>}</button>)}</nav>
            {isFallback && <div className="status-banner" role="status">Офлайн режим · справи зберігаються на цьому пристрої</div>}
            {(financeError || taskError) && <div className="error-banner" role="alert"><span>{financeError || taskError}</span>{financeError && <button className="text-button" onClick={loadFinanceData}>Спробувати знову</button>}<button onClick={() => { setFinanceError(''); setTaskError(''); }} aria-label="Закрити повідомлення">×</button></div>}
            {financeLoading ? <div className="empty-state loading-state">Завантаження записів…</div> : renderView()}
        </section>
        <NatureFactWidget />
    </main>;
}

export default App;
