import React from 'react';

const TodoItem = ({ todo, onToggle, onDelete }) => {
    return (
        <li className={`todo-item ${todo.isCompleted ? 'completed' : ''}`}>
            <div className="todo-content" onClick={() => onToggle(todo)}>
                <div className="checkbox">
                    {todo.isCompleted && <span>✓</span>}
                </div>

                <div className="todo-info">
                    <span className="todo-text">{todo.title}</span>
                    {todo.createdAt && (
                        <span className="todo-time">
                            {new Date(todo.createdAt).toLocaleString('uk-UA', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    )}
                </div>
            </div>

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