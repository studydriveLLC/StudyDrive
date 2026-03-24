import { registerRootComponent } from 'expo';

// Ajout du correctif pour les annulations de requêtes (Polyfill)
if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.abort !== 'function') {
  AbortSignal.abort = function (reason) {
    const controller = new AbortController();
    controller.abort(reason);
    return controller.signal;
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);