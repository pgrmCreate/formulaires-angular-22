import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Formats français pour les pipes (currency, date, number) : 79,80 € au lieu de €79.80.
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        { provide: LOCALE_ID, useValue: 'fr-FR' },
    ],
};
