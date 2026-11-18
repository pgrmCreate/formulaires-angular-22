import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter(routes)],
        }).compileComponents();
    });

    it('affiche un lien vers chacun des trois formulaires', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const liens = [...(fixture.nativeElement as HTMLElement).querySelectorAll('nav a')];
        expect(liens.map((a) => a.getAttribute('href'))).toEqual(['/template', '/reactif', '/signal']);
    });
});
