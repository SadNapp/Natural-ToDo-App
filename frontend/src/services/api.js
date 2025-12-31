const API_URL = 'http://localhost:5186/api/todo';

export const todoService = {
    getAll: async () => {
        const res = await fetch(API_URL);
        return res.json();
    },

    create: async (title) => {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, isCompleted: false })
        });
        return res.json();
    },

    update: async (todo) => {
        const res = await fetch(`${API_URL}/${todo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todo)
        });
        return res.ok;
    },

    delete: async (id) => {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        return res.ok;
    }
};