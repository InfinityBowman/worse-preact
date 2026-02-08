/**
 * Todo List Component
 *
 * Demonstrates: Keyed lists, useRef, event handling
 */

import { useState, useRef } from 'preact/hooks';

export function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn JSX syntax', completed: true },
    { id: 2, text: 'Build a demo app', completed: false },
    { id: 3, text: 'Test keyed reconciliation', completed: false },
  ]);
  const [filter, setFilter] = useState('all');
  const inputRef = useRef(null);

  const addTodo = (e) => {
    e.preventDefault();
    const text = inputRef.current.value.trim();
    if (!text) return;

    setTodos([
      ...todos,
      { id: Date.now(), text, completed: false }
    ]);
    inputRef.current.value = '';
    inputRef.current.focus();
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const shuffleTodos = () => {
    setTodos([...todos].sort(() => Math.random() - 0.5));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.completed));
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const remaining = todos.filter(t => !t.completed).length;

  return (
    <div className="demo-section">
      <h2>Todo List</h2>

      {/* Add todo form */}
      <form onSubmit={addTodo} style={{ display: 'flex', marginBottom: '16px' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="What needs to be done?"
          style={{ flex: 1 }}
        />
        <button type="submit">Add</button>
        <button type="button" className="secondary" onClick={shuffleTodos}>
          🔀 Shuffle
        </button>
      </form>

      {/* Filter tabs */}
      <div className="tabs">
        {['all', 'active', 'completed'].map(f => (
          <div
            key={f}
            className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </div>
        ))}
      </div>

      {/* Todo list with keys */}
      <div className="todo-list">
        {filteredTodos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              className="todo-checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className="todo-text">{todo.text}</span>
            <button className="danger" onClick={() => deleteTodo(todo.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#888' }}>
          {remaining} item{remaining !== 1 ? 's' : ''} left
        </span>
        {todos.some(t => t.completed) && (
          <button className="secondary" onClick={clearCompleted}>
            Clear completed
          </button>
        )}
      </div>

      <p className="hint">
        💡 Keys ensure DOM nodes are reused when shuffling - inspect the DOM!
      </p>
    </div>
  );
}
