import { formatMoney } from '../../utils/finance';

function ArchiveView({ todos, operations, categories, onRestoreTodo, onHardDeleteTodo, onRestoreOperation, onHardDeleteOperation }) {
    const hasItems = todos.length || operations.length;
    return <div className="finance-view"><section className="panel"><div className="section-heading compact"><div><p className="eyebrow">АРХІВ / КОШИК</p><h2>Видалені записи</h2></div><span className="muted-label">{todos.length + operations.length}</span></div>
        {!hasItems ? <div className="empty-state"><strong>Кошик порожній</strong><span>Видалені справи та операції можна буде відновити звідси.</span></div> : <ul className="data-list">{operations.map((operation) => <li className="data-row" key={`op-${operation.id}`}><div className="data-main"><strong>{operation.title}</strong><span>Операція · {categories.find((item) => item.id === operation.categoryId)?.name || 'Інше'} · {operation.date}</span></div><strong>{operation.type === 'income' ? '+' : '−'}{formatMoney(operation.amount)}</strong><div className="row-actions"><button className="text-button" onClick={() => onRestoreOperation(operation)}>Відновити</button><button className="text-button danger-text" onClick={() => { if (window.confirm(`Видалити операцію «${operation.title}» назавжди?`)) onHardDeleteOperation(operation.id); }}>Видалити назавжди</button></div></li>)}{todos.map((todo) => <li className="data-row" key={`todo-${todo.id}`}><div className="data-main"><strong>{todo.title}</strong><span>Нотатка / справа · {todo.category || 'Інше'}</span></div><div className="row-actions"><button className="text-button" onClick={() => onRestoreTodo(todo)}>Відновити</button><button className="text-button danger-text" onClick={() => { if (window.confirm(`Видалити «${todo.title}» назавжди?`)) onHardDeleteTodo(todo.id); }}>Видалити назавжди</button></div></li>)}</ul>}
    </section></div>;
}

export default ArchiveView;
