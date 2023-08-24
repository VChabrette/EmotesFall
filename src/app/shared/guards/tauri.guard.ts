import { CanActivateFn } from '@angular/router';

export const tauriGuard: CanActivateFn = (route, state) => {
  return !!window.__TAURI_IPC__;
};
