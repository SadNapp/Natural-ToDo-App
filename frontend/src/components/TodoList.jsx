import TodoItem from './TodoItem';

function TodoList({ todos, onToggle, onDelete, selectedIds = [], onSelectToggle }) {
    if (todos.length === 0) return <div className="empty-state"><span aria-hidden="true">✦</span><strong>Поки що тут тихо</strong><span>Додайте першу справу або нотатку вище.</span></div>;
    return <ul className="todo-list">{todos.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} selected={selectedIds.includes(todo.id)} onSelectToggle={onSelectToggle} />)}</ul>;
}

export default TodoList;
