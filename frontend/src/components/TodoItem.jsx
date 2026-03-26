import React from 'react';

const priorityColors = {
    0: '#10b981', // green for low
    1: '#f59e0b', // orange for mid
    2: '#ef4444'  // red for high
};

const TodoItem = ({ todo, onToggle, onDelete, selected, onSelectToggle }) => {
    return (
        <li 
            className={`todo-item ${todo.isCompleted ? 'completed' : ''}`}
            style={{
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                opacity: todo.isCompleted ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--glass-bg)' }}
        >
            <input 
                type="checkbox" 
                checked={selected || false} 
                onChange={() => onSelectToggle && onSelectToggle(todo.id)}
                style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#a855f7' }}
            />
            
            <div className="todo-content" onClick={() => onToggle(todo)} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div className="checkbox" style={{ marginRight: '10px' }}>
                    {todo.isCompleted && <span>✓</span>}
                </div>

                <div className="todo-info">
                    <span className="todo-text" style={{ transition: 'all 0.4s ease', textDecoration: todo.isCompleted ? 'line-through' : 'none', color: todo.isCompleted ? '#94a3b8' : 'white' }}>{todo.title}</span>
                    <div className="todo-meta" style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                        {todo.deadline && (
                            <span className="todo-deadline" style={{fontSize: '11px', color: '#fb923c'}}>
                                ⏳ {new Date(todo.deadline).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {todo.category && (
                            <span className="todo-category" style={{fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px'}}>
                                📁 {todo.category}
                            </span>
                        )}
                        {todo.createdAt && (
                            <span className="todo-time">
                                🕒 {new Date(todo.createdAt).toLocaleString('uk-UA', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="priority-indicator" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: priorityColors[todo.priority] || '#10b981', marginLeft: 'auto', marginRight: '15px' }} title={`Пріоритет: ${todo.priority}`}></div>

            <button className="btn-delete" title="Видалити" onClick={(e) => {
                e.stopPropagation();
                onDelete(todo.id);
            }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </li>
    );
};

export default TodoItem;