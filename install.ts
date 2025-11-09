import { rebuild } from '@/commands';

if (process.env.npm_config_global === 'true') {
  rebuild();
}
