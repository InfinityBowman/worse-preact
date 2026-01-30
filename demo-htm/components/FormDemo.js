/**
 * FormDemo Component (HTM)
 *
 * Demonstrates: Controlled form inputs
 */

import { useState } from '../../src/index.js';
import { html } from '../html.js';

export function FormDemo() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const updateField = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Submitted:\n${JSON.stringify(form, null, 2)}`);
  };

  const isValid = form.name && form.email && form.message;

  return html`
    <div class="demo-section">
      <h2>Form Handling</h2>
      <form onSubmit=${handleSubmit}>
        <div class="form-row">
          <div class="form-group">
            <label>Name</label>
            <input
              type="text"
              value=${form.name}
              onInput=${updateField('name')}
              placeholder="Your name"
            />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input
              type="text"
              value=${form.email}
              onInput=${updateField('email')}
              placeholder="your@email.com"
            />
          </div>
        </div>
        <div class="form-group">
          <label>Message</label>
          <input
            type="text"
            value=${form.message}
            onInput=${updateField('message')}
            placeholder="Your message"
            style=${{ width: '100%' }}
          />
        </div>
        <button type="submit" disabled=${!isValid}>
          Submit
        </button>
      </form>
      <div class="result-box">
        ${JSON.stringify(form)}
      </div>
      <p class="hint">Controlled inputs with real-time state sync</p>
    </div>
  `;
}
