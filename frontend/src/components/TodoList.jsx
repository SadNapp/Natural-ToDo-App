import React from 'react';
import TodoItem from './TodoItem';

const TodoList = ({ todos, onToggle, onDelete, selectedIds, onSelectToggle }) => {
    if (todos.length === 0) {
        return <div className="empty-state">Усі справи виконано! 🙌</div>;
    }

    return (
        <ul className="todo-list">
            {todos.map(todo => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    selected={selectedIds && selectedIds.includes(todo.id)}
                    onSelectToggle={onSelectToggle}
                />
            ))}
        </ul>
    );
};

export default TodoList;