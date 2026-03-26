import React, { useState, useEffect } from 'react';
import { todoService } from './services/api';
import TodoList from './components/TodoList';
import Clock from './components/Clock';
import NatureFactWidget from './components/NatureFactWidget';
import './styles/TodoApp.css';

const App = () => {
    const [todos, setTodos] = useState([]);
    const [deletedTodos, setDeletedTodos] = useState([]);
    
    const [inputValue, setInputValue] = useState("");
    const [deadline, setDeadline] = useState("");
    const [priority, setPriority] = useState("0");
    const [category, setCategory] = useState("Home");
    
    const [error, setError] = useState(null);
    const [isFallback, setIsFallback] = useState(false);
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [showTrash, setShowTrash] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    useEffect(() => {
        todoService.onFallbackStatusChange = (status) => setIsFallback(status);
        todoService.onNetworkError = (msg) => { setError(msg); setIsFallback(true); };
        
        loadTodos();
    }, []);

    const loadTodos = async () => {
        try {
            const data = await todoService.getAll();
            setTodos(data);
        } catch(e) { console.error(e); }
    };

    const loadDeleted = async () => {
        try {
            const data = await todoService.getDeleted();
            setDeletedTodos(data);
        } catch(e) { console.error(e); }
    };

    useEffect(() => {
        if (showTrash) loadDeleted();
    }, [showTrash]);

    const handleAdd = async () => {
        if (!inputValue.trim()) return;
        
        const optimisticId = Date.now();
        const optimisticItem = {
            id: optimisticId,
            title: inputValue,
            deadline: deadline || null,
            priority: parseInt(priority, 10),
            category: category,
            isCompleted: false,
            createdAt: new Date().toISOString()
        };

        const backupInput = inputValue;
        const backupDeadline = deadline;
        const backupPriority = priority;
        const backupCategory = category;

        setTodos(prev => [...prev, optimisticItem]);
        setInputValue("");
        setDeadline("");
        setPriority("0");
        setCategory("Home");

        try {
            const savedItem = await todoService.create({
                title: backupInput,
                deadline: backupDeadline || null,
                priority: parseInt(backupPriority, 10),
                category: backupCategory,
                isCompleted: false
            });
            setTodos(prev => prev.map(t => t.id === optimisticId ? savedItem : t));
        } catch (err) { 
            console.error("Task creation failed", err);
            setTodos(prev => prev.filter(t => t.id !== optimisticId));
        }
    };

    const handleDelete = async (id) => {
        const backupTodos = [...todos];
        const itemToDelete = todos.find(t => t.id === id);
        
        setTodos(prev => prev.filter(t => t.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id)); // Remove from selection
        
        try {
            const success = await todoService.delete(id);
            if (!success) setTodos(backupTodos);
            else if (showTrash) loadDeleted();
        } catch (err) {
            console.error("Delete failed", err);
            setTodos(backupTodos);
        }
    };

    const handleRestore = async (id) => {
        const itemToRestore = deletedTodos.find(t => t.id === id);
        if(!itemToRestore) return;

        const backupDeleted = [...deletedTodos];
        setDeletedTodos(prev => prev.filter(t => t.id !== id));
        setTodos(prev => [...prev, itemToRestore]);

        try {
            const success = await todoService.restore(id);
            if (!success) {
                setDeletedTodos(backupDeleted);
                setTodos(prev => prev.filter(t => t.id !== id));
            }
        } catch (err) {
            setDeletedTodos(backupDeleted);
            setTodos(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleHardDelete = async (id) => {
        const backupDeleted = [...deletedTodos];
        setDeletedTodos(prev => prev.filter(t => t.id !== id));

        try {
            const success = await todoService.hardDelete(id);
            if(!success) setDeletedTodos(backupDeleted);
        } catch (err) {
            setDeletedTodos(backupDeleted);
        }
    };

    const toggleComplete = async (todo) => {
        const backupTodos = [...todos];
        const updatedTodo = { ...todo, isCompleted: !todo.isCompleted };
        setTodos(prev => prev.map(t => t.id === todo.id ? updatedTodo : t));
        
        try {
            const success = await todoService.update(updatedTodo);
            if (!success) setTodos(backupTodos);
        } catch (err) {
            console.error("Toggle failed", err);
            setTodos(backupTodos);
        }
    };

    const handleBulkDelete = async () => {
        if(selectedIds.length === 0) return;
        
        const backupTodos = [...todos];
        const idsToDelete = [...selectedIds];
        
        setTodos(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        setSelectedIds([]);

        for(let id of idsToDelete) {
            try { await todoService.delete(id); } 
            catch(err) { console.error("Bulk delete item error", err); }
        }
        if (showTrash) loadDeleted();
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // Analytics Data Prep
    const completedLast7Days = todos.filter(t => t.isCompleted && new Date(t.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const lineChartData = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const dayStr = d.toLocaleDateString('uk-UA', { weekday: 'short' });
        const count = completedLast7Days.filter(t => new Date(t.createdAt).getDate() === d.getDate()).length;
        return { name: dayStr, count };
    });

    const categories = todos.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
    }, {});
    
    const pieData = Object.keys(categories).map((k, i) => ({
        name: k || 'Інше', value: categories[k], color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
    }));

    return (
        <div className="main-wrapper" style={{transition: 'all 0.3s ease'}}>
            <div className="background-overlay"></div>
            
            {/* Minimalist Storage Mode Indicator in Corner */}
            {isFallback && (
                <div style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)', padding: '8px 14px', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.85rem', zIndex: 100,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>☁️❌</span>
                    <span>Storage Mode</span>
                </div>
            )}

            <div className="glass-container" style={{maxWidth: '700px', height: 'auto', minHeight: '650px', position: 'relative'}}>
                <header className="todo-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <h1 style={{ fontWeight: '800', letterSpacing: '-1px', margin: 0 }}>Мій План</h1>
                        <Clock />
                    </div>
                    
                    <div className="header-actions" style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => {setShowAnalytics(!showAnalytics); setShowTrash(false);}} style={{background: showAnalytics ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems:'center', gap:'5px', transition: 'all 0.2s', fontSize: '18px'}}>
                            📊
                        </button>
                        <button onClick={() => {setShowTrash(!showTrash); setShowAnalytics(false);}} style={{background: showTrash ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems:'center', gap:'5px', transition: 'all 0.2s', fontSize: '18px'}}>
                            🗑️ {deletedTodos.length > 0 && <span style={{background:'#ef4444', fontSize:'10px', padding:'2px 6px', borderRadius:'10px', color: 'white'}}>{deletedTodos.length}</span>}
                        </button>
                    </div>
                </header>

                {showAnalytics ? (
                    <div className="analytics-dashboard" style={{animation: 'fadeIn 0.3s ease', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
                        <h3 style={{color:'white', marginBottom: '20px'}}>📊 Аналітика продуктивності</h3>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
                            <div style={{flex: 1, minWidth: '250px'}}>
                                <h4 style={{color:'#cbd5e1', fontSize: '12px', textAlign: 'center', marginBottom: '10px'}}>Виконано за 7 днів</h4>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '150px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
                                    {lineChartData.map((d, i) => (
                                        <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30px'}}>
                                            <div style={{color: '#94a3b8', fontSize: '10px', marginBottom: '4px'}}>{d.count}</div>
                                            <div style={{width: '100%', height: `${(d.count / (Math.max(...lineChartData.map(l => l.count)) || 1)) * 100}px`, background: '#6366f1', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease'}}></div>
                                            <div style={{color: '#94a3b8', fontSize: '10px', marginTop: '4px'}}>{d.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{flex: 1, minWidth: '250px'}}>
                                <h4 style={{color:'#cbd5e1', fontSize: '12px', textAlign: 'center', marginBottom: '10px'}}>Категорії завдань</h4>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', height: '150px', overflowY: 'auto'}}>
                                    {pieData.map((p, i) => (
                                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                <div style={{width: '12px', height: '12px', background: p.color, borderRadius: '50%'}}></div>
                                                <span style={{color: '#e2e8f0', fontSize: '12px'}}>{p.name}</span>
                                            </div>
                                            <span style={{color: 'white', fontWeight: 'bold'}}>{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : showTrash ? (
                    <div className="trash-panel" style={{animation: 'fadeIn 0.3s ease'}}>
                        <h3 style={{color: 'white', marginBottom: '15px'}}>🗑️ Кошик</h3>
                        {deletedTodos.length === 0 ? <p style={{color: '#94a3b8', textAlign:'center'}}>Кошик порожній</p> : (
                            <ul style={{listStyle: 'none', padding: 0, margin: 0, maxHeight: '400px', overflowY: 'auto'}} className="custom-scrollbar">
                                {deletedTodos.map(t => (
                                    <li key={t.id} style={{background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                                        <div>
                                            <span style={{color: '#cbd5e1', textDecoration: 'line-through'}}>{t.title}</span>
                                        </div>
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <button onClick={() => handleRestore(t.id)} style={{background: '#10b981', color: 'white', border: 'none', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px'}}>♻️ Відновити</button>
                                            <button onClick={() => handleHardDelete(t.id)} style={{background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px'}}>❌ Назавжди</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Назва завдання..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    className="glass-input-main"
                                    style={{ flex: 1, background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '14px 18px', color: 'white', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input 
                                    type="datetime-local" 
                                    value={deadline} 
                                    onChange={(e) => setDeadline(e.target.value)} 
                                    style={{ background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px', color: 'white', outline: 'none', flex: 1 }}
                                />
                                <select 
                                    value={priority} 
                                    onChange={(e) => setPriority(e.target.value)} 
                                    style={{ background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px', color: 'white', outline: 'none', flex: 1 }}
                                >
                                    <option style={{color: 'black'}} value="0">Low Priority</option>
                                    <option style={{color: 'black'}} value="1">Mid Priority</option>
                                    <option style={{color: 'black'}} value="2">High Priority</option>
                                </select>
                                <input 
                                    type="text" 
                                    placeholder="Категорія (Work, Home...)" 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)} 
                                    style={{ background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px', color: 'white', outline: 'none', flex: 1 }}
                                />
                            </div>
                            <button 
                                onClick={handleAdd}
                                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', color: 'white', padding: '14px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '5px' }}
                            >Додати завдання</button>
                        </div>

                        {/* Bulk Action Panel (Floating) */}
                        {selectedIds.length > 0 && (
                            <div style={{
                                position:'sticky', top: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', backdropFilter: 'blur(12px)',
                                borderRadius: '14px', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'15px', zIndex: 10, animation: 'slideDown 0.3s ease'
                            }}>
                                <span style={{color: 'white', fontWeight: '500'}}>✅ Обрано: {selectedIds.length}</span>
                                <button onClick={handleBulkDelete} style={{background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight:'bold', transition: 'all 0.2s'}}>Видалити обрані</button>
                            </div>
                        )}

                        <div className="todo-scroll-area custom-scrollbar" style={{maxHeight: '400px', overflowY: 'auto', paddingRight: '5px'}}>
                            <TodoList
                                todos={todos}
                                onToggle={toggleComplete}
                                onDelete={handleDelete}
                                selectedIds={selectedIds}
                                onSelectToggle={toggleSelection}
                            />
                        </div>

                        <footer className="todo-status">
                            <span>Залишилось завдань: {todos.filter(t => !t.isCompleted).length}</span>
                        </footer>
                    </>
                )}
            </div>
            
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            
            <NatureFactWidget />
        </div>
    );
};

export default App;