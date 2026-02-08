/**
 * TodoList Component (HTM)
 *
 * Demonstrates: Array state management, useRef
 */

import { useState, useRef } from 'preact/hooks';
import { html } from '../html.js';

export function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn Worse Preact', done: true },
    { id: 2, text: 'Try HTM syntax', done: false },
    { id: 3, text: 'Build something awesome', done: false }
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, done: false }]);
    setInput('');
    inputRef.current?.focus();
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const remaining = todos.filter(t => !t.done).length;

  return html`
    <div class="demo-section">
      <h2>Todo List</h2>
      <div class="todo-input">
        <input
          ref=${inputRef}
          type="text"
          placeholder="What needs to be done?"
          value=${input}
          onInput=${(e) => setInput(e.target.value)}
          onKeyDown=${(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick=${addTodo}>Add</button>
      </div>
      <ul class="todo-list">
        ${todos.map(todo => html`
          <li key=${todo.id} class=${todo.done ? 'done' : ''}>
            <input
              type="checkbox"
              checked=${todo.done}
              onChange=${() => toggleTodo(todo.id)}
            />
            <span onClick=${() => toggleTodo(todo.id)}>${todo.text}</span>
            <button class="delete" onClick=${() => removeTodo(todo.id)}>×</button>
          </li>
        `)}
      </ul>
      <p class="hint">${remaining} item${remaining !== 1 ? 's' : ''} remaining</p>
    </div>
  `;
}
