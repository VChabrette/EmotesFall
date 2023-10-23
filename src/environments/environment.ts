import { envvars } from './envvars';

export const environment = {
  production: false,
  ...envvars,
};
