/**
 * DOM Property Handling
 *
 * This module handles setting properties on DOM elements, including:
 * - Event handlers (using event delegation)
 * - Style objects and strings
 * - SVG attributes
 * - Regular DOM properties and attributes
 */

/**
 * Event proxy function - invoked when any delegated event fires.
 * Uses `this` (the DOM element) to look up the current handler.
 * This allows handlers to be updated without removing/re-adding listeners.
 *
 * @param {Event} e - The DOM event
 */
function eventProxy(e) {
  // Look up current handler from the element's listener map
  const handler = this._listeners[e.type];
  if (handler) {
    // Call handler with correct `this` context
    handler.call(this, e);
  }
}

/**
 * Sets a property/attribute on a DOM element
 *
 * @param {Element} dom - The DOM element to modify
 * @param {string} name - Property/attribute name
 * @param {*} value - New value (null/undefined removes the property)
 * @param {*} oldValue - Previous value (used for cleanup)
 * @param {string|null} namespace - SVG namespace if applicable
 */
export function setProperty(dom, name, value, oldValue, namespace) {
  // Skip children prop - handled separately in diffChildren
  if (name === 'children') {
    return;
  }

  // Handle style property specially
  if (name === 'style') {
    setStyle(dom, value, oldValue);
    return;
  }

  // Handle event handlers (onClick, onInput, etc.)
  if (name[0] === 'o' && name[1] === 'n') {
    setEventHandler(dom, name, value, oldValue);
    return;
  }

  // Handle dangerouslySetInnerHTML
  if (name === 'dangerouslySetInnerHTML') {
    if (value && value.__html != null) {
      dom.innerHTML = value.__html;
    }
    return;
  }

  // Handle ref - not a DOM property
  if (name === 'ref') {
    return;
  }

  // Handle key - not a DOM property
  if (name === 'key') {
    return;
  }

  // For SVG elements, most attributes need setAttribute
  // For HTML elements, prefer direct property assignment when possible
  if (namespace) {
    // SVG mode - use setAttribute for most things
    setAttributeSVG(dom, name, value);
  } else {
    // HTML mode - try property first, fall back to attribute
    setPropertyOrAttribute(dom, name, value);
  }
}

/**
 * Sets the style property on an element
 *
 * @param {Element} dom - The DOM element
 * @param {Object|string} value - New style (object or CSS string)
 * @param {Object|string} oldValue - Previous style
 */
function setStyle(dom, value, oldValue) {
  const style = dom.style;

  // Handle string style (e.g., style="color: red")
  if (typeof value === 'string') {
    style.cssText = value;
    return;
  }

  // Handle object style (e.g., style={{ color: 'red' }})

  // First, remove old styles that aren't in the new value
  if (typeof oldValue === 'object' && oldValue !== null) {
    for (const styleName in oldValue) {
      if (!(value && styleName in value)) {
        // Remove this style
        setStyleProperty(style, styleName, '');
      }
    }
  } else if (typeof oldValue === 'string') {
    // Was a string, now an object - clear everything
    style.cssText = '';
  }

  // Set new styles
  if (typeof value === 'object' && value !== null) {
    for (const styleName in value) {
      const styleValue = value[styleName];
      // Only set if different from current
      if (!oldValue || oldValue[styleName] !== styleValue) {
        setStyleProperty(style, styleName, styleValue);
      }
    }
  }
}

/**
 * Sets a single style property, handling CSS custom properties and units
 *
 * @param {CSSStyleDeclaration} style - The element's style object
 * @param {string} name - CSS property name (can be camelCase or kebab-case)
 * @param {string|number} value - CSS value
 */
function setStyleProperty(style, name, value) {
  // Handle CSS custom properties (--my-var)
  if (name[0] === '-') {
    style.setProperty(name, value == null ? '' : value);
    return;
  }

  // Handle numeric values - add 'px' for properties that need units
  if (typeof value === 'number' && !CSS_NUMBER_PROPERTIES[name]) {
    value = value + 'px';
  }

  // Set the property (camelCase works directly)
  style[name] = value == null ? '' : value;
}

/**
 * CSS properties that are unitless (don't get 'px' appended)
 */
const CSS_NUMBER_PROPERTIES = {
  animationIterationCount: true,
  columnCount: true,
  fillOpacity: true,
  flexGrow: true,
  flexShrink: true,
  fontWeight: true,
  gridColumn: true,
  gridRow: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  strokeOpacity: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
};

/**
 * Sets an event handler using event delegation
 *
 * @param {Element} dom - The DOM element
 * @param {string} name - Event property name (e.g., 'onClick')
 * @param {Function|null} value - New handler
 * @param {Function|null} oldValue - Previous handler
 */
function setEventHandler(dom, name, value, oldValue) {
  // Convert 'onClick' to 'click', 'onInput' to 'input', etc.
  const eventName = name.slice(2).toLowerCase();

  // Initialize listener map if needed
  if (!dom._listeners) {
    dom._listeners = {};
  }

  // Store the handler in the element's listener map
  dom._listeners[eventName] = value;

  // Add listener if this is a new event type for this element
  if (value && !oldValue) {
    dom.addEventListener(eventName, eventProxy);
  }
  // Remove listener if handler was removed
  else if (!value && oldValue) {
    dom.removeEventListener(eventName, eventProxy);
  }
  // If both exist, the handler is already updated in _listeners
}

/**
 * Sets an attribute on an SVG element
 * SVG requires setAttribute for most properties
 *
 * @param {Element} dom - The SVG element
 * @param {string} name - Attribute name
 * @param {*} value - Attribute value
 */
function setAttributeSVG(dom, name, value) {
  // Convert JSX camelCase to SVG attribute names
  // className -> class
  // htmlFor -> for
  let attrName = name;

  if (name === 'className') {
    attrName = 'class';
  } else if (name === 'htmlFor') {
    attrName = 'for';
  }

  if (value == null || value === false) {
    dom.removeAttribute(attrName);
  } else {
    dom.setAttribute(attrName, value === true ? '' : value);
  }
}

/**
 * Sets a property or attribute on an HTML element
 * Prefers direct property assignment when possible
 *
 * @param {Element} dom - The HTML element
 * @param {string} name - Property/attribute name
 * @param {*} value - Value to set
 */
function setPropertyOrAttribute(dom, name, value) {
  // Convert JSX names to DOM names
  let propName = name;

  if (name === 'className') {
    propName = 'class';
  } else if (name === 'htmlFor') {
    propName = 'for';
  }

  // For form elements, prefer property assignment for value/checked
  // This ensures the DOM state reflects the intended value
  if (propName === 'value' || propName === 'checked') {
    if (value == null) {
      dom[propName] = propName === 'value' ? '' : false;
    } else {
      dom[propName] = value;
    }
    return;
  }

  // Handle boolean attributes (disabled, hidden, etc.)
  if (value === true) {
    dom.setAttribute(propName, '');
    return;
  }

  if (value == null || value === false) {
    dom.removeAttribute(propName);
    return;
  }

  // Set as attribute
  dom.setAttribute(propName, value);
}

/**
 * Diffs all properties between old and new vnodes
 *
 * @param {Element} dom - The DOM element
 * @param {Object} newProps - New properties
 * @param {Object} oldProps - Old properties
 * @param {string|null} namespace - SVG namespace if applicable
 */
export function diffProps(dom, newProps, oldProps, namespace) {
  // Remove old properties that aren't in new props
  for (const propName in oldProps) {
    if (propName !== 'children' && !(propName in newProps)) {
      setProperty(dom, propName, null, oldProps[propName], namespace);
    }
  }

  // Set new/changed properties
  for (const propName in newProps) {
    const newValue = newProps[propName];
    const oldValue = oldProps[propName];

    // Skip if unchanged (except for value/checked which need to be set)
    if (newValue !== oldValue || propName === 'value' || propName === 'checked') {
      setProperty(dom, propName, newValue, oldValue, namespace);
    }
  }
}
