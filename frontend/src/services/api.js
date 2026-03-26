const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5186/api/todo';

export const todoService = {
    onFallbackStatusChange: null,
    onNetworkError: null,

    _checkFallback: function(res) {
        if (res && res.headers && res.headers.get('x-fallback-mode') === 'true') {
            if (this.onFallbackStatusChange) this.onFallbackStatusChange(true);
        } else {
            if (this.onFallbackStatusChange) this.onFallbackStatusChange(false);
        }
    },

    _handleNetworkError: function(err) {
        console.error("Network error:", err);
        if (this.onNetworkError) this.onNetworkError("Warning: Backend is not responding. Please wait or try again later.");
    },

    _getLocalTodos: () => JSON.parse(localStorage.getItem('offline_todos') || '[]'),
    _saveLocalTodos: (todos) => localStorage.setItem('offline_todos', JSON.stringify(todos)),

    getAll: async function() {
        try {
            const res = await fetch(API_URL);
            this._checkFallback(res);
            if (!res.ok) throw new Error("Не вдалося завантажити дані");
            const data = await res.json();
            this._saveLocalTodos(data);
            return data;
        } catch (err) {
            this._handleNetworkError(err);
            return this._getLocalTodos();
        }
    },

    create: async function(todoData) {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoData)
            });
            this._checkFallback(res);
            if (!res.ok) throw new Error("Не вдалося створити завдання");
            const data = await res.json();
            const localTodos = this._getLocalTodos();
            localTodos.push(data);
            this._saveLocalTodos(localTodos);
            return data;
        } catch (err) {
            this._handleNetworkError(err);
            todoData.id = Date.now(); // Temp ID for offline
            const localTodos = this._getLocalTodos();
            localTodos.push(todoData);
            this._saveLocalTodos(localTodos);
            return todoData;
        }
    },

    update: async function(todo) {
        try {
            const res = await fetch(`${API_URL}/${todo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todo)
            });
            this._checkFallback(res);
            if (!res.ok) throw new Error("Не вдалося оновити завдання");
            return res.ok;
        } catch (err) {
            this._handleNetworkError(err);
            const localTodos = this._getLocalTodos();
            const index = localTodos.findIndex(t => t.id === todo.id);
            if (index !== -1) {
                localTodos[index] = todo;
                this._saveLocalTodos(localTodos);
            }
            return true;
        }
    },

    delete: async function(id) {
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            this._checkFallback(res);
            if (!res.ok) throw new Error("Не вдалося видалити завдання");
            return res.ok;
        } catch (err) {
            this._handleNetworkError(err);
            const localTodos = this._getLocalTodos();
            const index = localTodos.findIndex(t => t.id === id);
            if (index !== -1) {
                localTodos[index].isDeleted = true;
                this._saveLocalTodos(localTodos);
            }
            return true;
        }
    },

    getDeleted: async function() {
        try {
            const res = await fetch(`${API_URL}/deleted`);
            this._checkFallback(res);
            if (!res.ok) throw new Error("Не вдалося завантажити видалені дані");
            return res.json();
        } catch (err) {
            this._handleNetworkError(err);
            return this._getLocalTodos().filter(t => t.isDeleted);
        }
    },
    
    restore: async function(id) {
        try {
            const res = await fetch(`${API_URL}/${id}/restore`, { method: 'PUT' });
            this._checkFallback(res);
            if (!res.ok) throw new Error("Не вдалося відновити завдання");
            return res.ok;
        } catch (err) {
            this._handleNetworkError(err);
            const localTodos = this._getLocalTodos();
            const index = localTodos.findIndex(t => t.id === id);
            if (index !== -1) {
                localTodos[index].isDeleted = false;
                this._saveLocalTodos(localTodos);
            }
            return true;
        }
    },
    
    hardDelete: async function(id) {
        try {
            const res = await fetch(`${API_URL}/${id}/hard`, { method: 'DELETE' });
            this._checkFallback(res);
            if (!res.ok) throw new Error("Не вдалося назавжди видалити завдання");
            return res.ok;
        } catch (err) {
            this._handleNetworkError(err);
            const localTodos = this._getLocalTodos();
            const filtered = localTodos.filter(t => t.id !== id);
            this._saveLocalTodos(filtered);
            return true;
        }
    }
};