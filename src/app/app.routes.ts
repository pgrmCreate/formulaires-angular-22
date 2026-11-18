import { Routes } from '@angular/router';

/**
 * Une route par type de formulaire.
 * loadComponent charge chaque composant à la demande (lazy loading).
 */
export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'template' },
    {
        path: 'template',
        title: 'Template-driven – Formulaires Angular 22',
        loadComponent: () =>
            import('./contact-template/contact-template').then((m) => m.ContactTemplate),
    },
    {
        path: 'reactif',
        title: 'Reactive Forms – Formulaires Angular 22',
        loadComponent: () =>
            import('./commande-reactive/commande-reactive').then((m) => m.CommandeReactive),
    },
    {
        path: 'signal',
        title: 'Signal Forms – Formulaires Angular 22',
        loadComponent: () =>
            import('./inscription-signal/inscription-signal').then((m) => m.InscriptionSignal),
    },
    { path: '**', redirectTo: 'template' },
];
