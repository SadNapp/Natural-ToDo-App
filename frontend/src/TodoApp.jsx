import React, { useState, useEffect } from 'react';
import { todoService } from './services/api';
import TodoList from './components/TodoList'; // Імпортуємо список
import './styles/TodoApp.css';

const App = () => {
    const [todos, setTodos] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        todoService.getAll().then(setTodos).catch(console.error);
        return () => clearInterval(timer);
    }, []);

    const handleAdd = async () => {
        if (!inputValue.trim()) return;
        try {
            const savedItem = await todoService.create(inputValue);
            setTodos(prev => [...prev, savedItem]);
            setInputValue("");
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (await todoService.delete(id)) {
            setTodos(prev => prev.filter(t => t.id !== id));
        }
    };

    const toggleComplete = async (todo) => {
        const updatedTodo = { ...todo, isCompleted: !todo.isCompleted };
        if (await todoService.update(updatedTodo)) {
            setTodos(prev => prev.map(t => t.id === todo.id ? updatedTodo : t));
        }
    };

    return (
        <div className="main-wrapper">
            <div className="background-overlay"></div>
            <div className="glass-container">
                <header className="todo-header">
                    <h1>Мій План</h1>
                    <p className="current-date">
                        {currentTime.toLocaleString('uk-UA', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                    </p>
                </header>

                <div className="input-box">
                    <input
                        type="text"
                        placeholder="Яке наступне завдання?..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd}>Додати</button>
                </div>

                <div className="todo-scroll-area">
                    <TodoList
                        todos={todos}
                        onToggle={toggleComplete}
                        onDelete={handleDelete}
                    />
                </div>

                <footer className="todo-status">
                    <span>Залишилось завдань: {todos.filter(t => !t.isCompleted).length}</span>
                </footer>
            </div>
        </div>
    );
};

export default App;