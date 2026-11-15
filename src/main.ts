import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()] }).catch((e) => console.error(e));
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
