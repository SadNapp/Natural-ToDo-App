import React from 'react';

const priorityLabels = ['Спокійний темп', 'Звичайний пріоритет', 'Важливо'];
const currency = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 });

function TodoItem({ todo, onToggle, onDelete, selected, onSelectToggle }) {
    const deadline = todo.deadline && new Date(todo.deadline);
    const isOverdue = deadline && deadline < new Date() && !todo.isCompleted;
    return <li className={`todo-item ${todo.isCompleted ? 'completed' : ''} ${selected ? 'selected' : ''}`}>
        {onSelectToggle && <input className="select-checkbox" type="checkbox" checked={Boolean(selected)} onChange={() => onSelectToggle(todo.id)} aria-label={`Обрати: ${todo.title}`} />}
        <button className="todo-content" type="button" onClick={() => onToggle(todo)} aria-pressed={todo.isCompleted}>
            <span className="checkbox" aria-hidden="true">{todo.isCompleted ? '✓' : ''}</span>
            <span className="todo-info"><span className="todo-text">{todo.title}</span>
                <span className="todo-meta">
                    {todo.category && <span className="todo-category">{todo.category}</span>}
                    <span className={`priority-label priority-${todo.priority ?? 0}`}>{priorityLabels[todo.priority] || priorityLabels[0]}</span>
                    {deadline && <time className={`todo-deadline ${isOverdue ? 'overdue' : ''}`} dateTime={deadline.toISOString()}>{isOverdue ? 'Прострочено · ' : 'До '}{deadline.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>}
                    {Number(todo.amount) > 0 && <span className={`todo-amount ${todo.kind === 'income' ? 'amount-income' : ''}`}>{todo.kind === 'income' ? '+' : '−'}{currency.format(Number(todo.amount))}</span>}
                    {todo.notes && <span className="todo-notes">{todo.notes}</span>}
                </span>
            </span>
        </button>
        <button className="btn-delete" title="Перемістити в кошик" aria-label={`Перемістити в кошик: ${todo.title}`} onClick={() => onDelete(todo.id)}>×</button>
    </li>;
}

export default TodoItem;
