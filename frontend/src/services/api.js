const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5186/api/todo').replace(/\/$/, '');
const STORAGE_KEY = 'finance-todo.entries.v1';

function readLocal() {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function writeLocal(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (error) { console.error('Could not save local entries', error); }
}

function notifyFallback(active) { todoService.onFallbackStatusChange?.(active); }
function notifyNetworkError() {
    notifyFallback(true);
    todoService.onNetworkError?.('Немає зв’язку з сервером. Зміни збережено локально.');
}

async function request(path = '', options) {
    const response = await fetch(`${API_URL}${path}`, options);
    notifyFallback(response.headers.get('x-fallback-mode') === 'true');
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return response;
}

export const todoService = {
    onFallbackStatusChange: null,
    onNetworkError: null,

    async getAll() {
        try {
            const response = await request(); const items = await response.json();
            const localFinancialData = new Map(readLocal().map((item) => [String(item.id), item]));
            const hydrated = items.map((item) => ({ ...localFinancialData.get(String(item.id)), ...item }));
            const remoteIds = new Set(items.map((item) => String(item.id)));
            const localOnly = readLocal().filter((item) => !remoteIds.has(String(item.id)));
            writeLocal([...hydrated, ...localOnly]);
            return [...hydrated, ...localOnly].filter((item) => !item.isDeleted);
        } catch { notifyNetworkError(); return readLocal().filter((item) => !item.isDeleted); }
    },

    async create(todo) {
        const localItems = readLocal();
        try {
            const payload = { ...todo };
            delete payload.id;
            const response = await request('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            let saved = todo;
            if (response.status !== 204 && response.status !== 202) {
                const body = await response.text(); if (body) saved = { ...todo, ...JSON.parse(body), amount: todo.amount, kind: todo.kind, notes: todo.notes };
            }
            saved = { ...saved, amount: todo.amount, kind: todo.kind, notes: todo.notes };
            writeLocal([...localItems.filter((item) => String(item.id) !== String(todo.id)), saved]);
            return saved;
        } catch {
            notifyNetworkError(); const saved = { ...todo, id: todo.id ?? Date.now() };
            writeLocal([...localItems, saved]); return saved;
        }
    },

    async update(todo) {
        const localItems = readLocal();
        try {
            await request(`/${todo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(todo) });
            writeLocal(localItems.map((item) => String(item.id) === String(todo.id) ? { ...item, ...todo } : item)); return true;
        } catch {
            notifyNetworkError(); writeLocal(localItems.map((item) => String(item.id) === String(todo.id) ? { ...item, ...todo } : item)); return true;
        }
    },

    async delete(id) {
        const items = readLocal();
        try {
            await request(`/${id}`, { method: 'DELETE' });
            writeLocal(items.map((item) => String(item.id) === String(id) ? { ...item, isDeleted: true } : item)); return true;
        } catch {
            notifyNetworkError(); writeLocal(items.map((item) => String(item.id) === String(id) ? { ...item, isDeleted: true } : item)); return true;
        }
    },

    async getDeleted() {
        try {
            const response = await request('/deleted'); const deleted = await response.json();
            const localItems = readLocal();
            return deleted.map((item) => ({ ...localItems.find((local) => String(local.id) === String(item.id)), ...item }));
        } catch { notifyNetworkError(); return readLocal().filter((item) => item.isDeleted); }
    },

    async restore(id) {
        const items = readLocal();
        try { await request(`/${id}/restore`, { method: 'PUT' }); }
        catch { notifyNetworkError(); }
        writeLocal(items.map((item) => String(item.id) === String(id) ? { ...item, isDeleted: false } : item)); return true;
    },

    async hardDelete(id) {
        const items = readLocal();
        try { await request(`/${id}/hard`, { method: 'DELETE' }); }
        catch { notifyNetworkError(); }
        writeLocal(items.filter((item) => String(item.id) !== String(id))); return true;
    },
};
