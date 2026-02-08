import { initDebug } from './debug.js';
import 'preact/devtools';

initDebug();

export { resetPropWarnings } from './check-props.js';

export {
	captureOwnerStack,
	getCurrentVNode,
	getDisplayName,
	getOwnerStack,
	setupComponentStack
} from './component-stack.js';
