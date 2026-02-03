/**
 * Modal Demo Component
 *
 * Demonstrates: createPortal for rendering modals outside the component tree
 */

import { useState, useEffect, createPortal } from 'worse-preact';

// Modal component that renders into a portal
function Modal({ isOpen, onClose, title, children }) {
  // Don't render anything if not open
  if (!isOpen) return null;

  // Create or get the modal root element
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // The modal content - rendered into the portal
  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  // Use createPortal to render outside the component tree
  return createPortal(modalContent, modalRoot);
}

export function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Submitted: ${formData.name} (${formData.email})`);
    setIsOpen(false);
    setFormData({ name: '', email: '' });
  };

  return (
    <>
      <div className="demo-section">
        <h2>Portal Demo (Modal)</h2>

        <p>
          Portals render children into a DOM node outside the parent component.
          This is useful for modals, tooltips, and overlays.
        </p>

        <button onClick={() => setIsOpen(true)}>Open Modal</button>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Contact Form"
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Name:
              </label>
              <input
                type="text"
                value={formData.name}
                onInput={(e) =>
                  setFormData((d) => ({ ...d, name: e.target.value }))
                }
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Email:
              </label>
              <input
                type="email"
                value={formData.email}
                onInput={(e) =>
                  setFormData((d) => ({ ...d, email: e.target.value }))
                }
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setIsOpen(false)}
                style={{ marginRight: '10px' }}
              >
                Cancel
              </button>
              <button type="submit">Submit</button>
            </div>
          </form>
        </Modal>

        <p className="hint">
          The modal renders into #modal-root at the document body level,
          escaping any overflow:hidden or z-index stacking contexts
        </p>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          min-width: 300px;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
        }
        .modal-header h3 {
          margin: 0;
          color: #333;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          line-height: 1;
        }
        .modal-close:hover {
          color: #333;
        }
        .modal-body {
          padding: 20px;
        }
      `}</style>
    </>
  );
}
