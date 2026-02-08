/**
 * Form Demo Component
 *
 * Demonstrates: Controlled inputs, form handling
 */

import { useState, useRef, useLayoutEffect } from 'preact/hooks';

export function FormDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    color: '#667eea',
    size: 'medium',
    subscribe: true,
    message: ''
  });

  const [submitted, setSubmitted] = useState(null);
  const previewRef = useRef(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  // useLayoutEffect to measure DOM before paint
  useLayoutEffect(() => {
    if (previewRef.current) {
      setPreviewWidth(previewRef.current.offsetWidth);
    }
  }, [formData]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(formData);
    console.log('Form submitted:', formData);
  };

  const sizeMap = { small: 14, medium: 18, large: 24 };

  return (
    <div className="demo-section">
      <h2>Form Controls</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onInput={handleChange('name')}
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="text"
              value={formData.email}
              onInput={handleChange('email')}
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Favorite Color:</label>
            <div className="color-picker">
              {['#667eea', '#f44336', '#4caf50', '#ff9800', '#00bcd4'].map(color => (
                <div
                  key={color}
                  className={`color-swatch ${formData.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Size:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['small', 'medium', 'large'].map(size => (
                <button
                  key={size}
                  type="button"
                  className={formData.size === size ? '' : 'secondary'}
                  onClick={() => setFormData({ ...formData, size })}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Message:</label>
          <textarea
            value={formData.message}
            onInput={handleChange('message')}
            placeholder="Write something..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #1f4068',
              background: '#0f0f23',
              color: '#eee',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.subscribe}
              onChange={handleChange('subscribe')}
            />
            Subscribe to newsletter
          </label>
        </div>

        <button type="submit">Submit Form</button>
      </form>

      {/* Live preview */}
      <div
        ref={previewRef}
        className="preview-box"
        style={{
          background: formData.color,
          fontSize: `${sizeMap[formData.size]}px`
        }}
      >
        {formData.name || 'Preview'} - {previewWidth}px wide
      </div>

      {/* Submitted data */}
      {submitted && (
        <div className="result-box" style={{ marginTop: '16px' }}>
          <strong>Submitted:</strong>
          <pre>{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      )}

      <p className="hint">
        💡 Controlled inputs with value/onInput, useLayoutEffect for measurements
      </p>
    </div>
  );
}
