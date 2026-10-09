const MODE = import.meta.env.VITE_FINANCE_DATA_MODE === 'api' ? 'api' : 'mock';
const API_URL = (import.meta.env.VITE_FINANCE_API_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'finance-notebook.v1';

const emptyData = () => ({
    operations: [],
    categories: [
        { id: 'housing', name: 'Житло та комунальні', group: 'needs' },
        { id: 'food', name: 'Продукти', group: 'needs' },
        { id: 'transport', name: 'Транспорт', group: 'needs' },
        { id: 'health', name: 'Здоров’я', group: 'needs' },
        { id: 'communication', name: 'Зв’язок', group: 'needs' },
        { id: 'subscriptions', name: 'Підписки', group: 'wants' },
        { id: 'clothing', name: 'Одяг', group: 'wants' },
        { id: 'entertainment', name: 'Розваги', group: 'wants' },
        { id: 'education', name: 'Навчання', group: 'wants' },
        { id: 'savings', name: 'Заощадження', group: 'savings' },
        { id: 'other', name: 'Інше', group: 'wants' },
    ],
    budgets: [],
    goals: [],
    contributions: [],
});

function readLocal() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        return saved ? { ...emptyData(), ...saved } : emptyData();
    } catch { return emptyData(); }
}

function writeLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function request(path, options) {
    if (!API_URL) throw new Error('Для режиму API задайте VITE_FINANCE_API_URL.');
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        const validation = body?.errors ? Object.values(body.errors).flat().join(' ') : '';
        const detail = validation || body?.detail || body?.title;
        const error = new Error(detail ? `${detail} (код ${response.status}).` : `Помилка API (${response.status}).`);
        error.status = response.status;
        error.body = body;
        throw error;
    }
    return response.status === 204 ? null : response.json();
}

const resourcePaths = {
    operations: '/operations',
    categories: '/categories',
    budgets: '/budgets',
    goals: '/goals',
    contributions: '/goal-contributions',
};

async function load() {
    if (MODE !== 'api') return readLocal();
    const data = await Promise.all(Object.entries(resourcePaths).map(async ([key, path]) => {
        try {
            const response = await request(key === 'operations' ? `${path}?includeDeleted=true` : path);
            return [key, Array.isArray(response) ? response : (response?.items || response)];
        }
        catch (error) {
            if (error.status === 404 && key === 'budgets') return [key, []];
            throw error;
        }
    }));
    return { ...emptyData(), ...Object.fromEntries(data) };
}

async function saveResource(resource, value, existingId) {
    if (MODE !== 'api') {
        const data = readLocal();
        if (resource === 'budgets') data.budgets = [...data.budgets.filter((item) => item.month !== value.month), value];
        else if (existingId) data[resource] = data[resource].map((item) => item.id === existingId ? value : item);
        else data[resource] = [...data[resource], value];
        writeLocal(data);
        return value;
    }
    if (resource === 'budgets') return (await request(`${resourcePaths.budgets}/${value.month}`, { method: 'PUT', body: JSON.stringify(value) })) || value;
    const path = `${resourcePaths[resource]}${existingId ? `/${existingId}` : ''}`;
    const payload = existingId ? value : Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'id'));
    return (await request(path, { method: existingId ? 'PUT' : 'POST', body: JSON.stringify(payload) })) || value;
}

async function saveCategories(categories) {
    if (MODE !== 'api') { const data = readLocal(); data.categories = categories; writeLocal(data); return categories; }
    const response = await request(resourcePaths.categories, { method: 'PUT', body: JSON.stringify(categories) });
    return Array.isArray(response) ? response : (response?.items || categories);
}

async function removeResource(resource, id) {
    if (MODE !== 'api') {
        const data = readLocal();
        if (resource === 'operations') data.operations = data.operations.map((item) => item.id === id ? { ...item, isDeleted: true } : item);
        else if (resource === 'goals') {
            data.goals = data.goals.filter((item) => item.id !== id);
        } else data[resource] = data[resource].filter((item) => item.id !== id);
        writeLocal(data);
        return;
    }
    await request(`${resourcePaths[resource]}/${id}`, { method: 'DELETE' });
}

async function restoreOperation(id) {
    if (MODE === 'api') await request(`${resourcePaths.operations}/${id}/restore`, { method: 'PUT' });
    else { const data = readLocal(); data.operations = data.operations.map((item) => item.id === id ? { ...item, isDeleted: false } : item); writeLocal(data); }
}

async function hardDeleteOperation(id) {
    if (MODE === 'api') await request(`${resourcePaths.operations}/${id}/hard`, { method: 'DELETE' });
    else { const data = readLocal(); data.operations = data.operations.filter((item) => item.id !== id); writeLocal(data); }
}

async function contribute(goalId, contribution) {
    if (MODE !== 'api') {
        const data = readLocal();
        const saved = { ...contribution, id: crypto.randomUUID(), goalId, createdAt: new Date().toISOString() };
        data.contributions.push(saved);
        writeLocal(data);
        return saved;
    }
    return (await request(resourcePaths.contributions, { method: 'POST', body: JSON.stringify({ ...contribution, goalId }) }))
        || { ...contribution, id: crypto.randomUUID(), goalId, createdAt: new Date().toISOString() };
}

export const financeService = {
    mode: MODE,
    load,
    saveResource,
    saveCategories,
    removeResource,
    restoreOperation,
    hardDeleteOperation,
    contribute,
};
