import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactTemplate } from './contact-template';

describe('ContactTemplate (template-driven)', () => {
    let fixture: ComponentFixture<ContactTemplate>;
    let page: HTMLElement;

    /** Simule une saisie : change la valeur puis déclenche l'événement écouté par ngModel. */
    function saisir(selecteur: string, valeur: string, evenement = 'input'): void {
        const champ = page.querySelector<HTMLInputElement>(selecteur)!;
        champ.value = valeur;
        champ.dispatchEvent(new Event(evenement));
    }

    function cliquer(selecteur: string): void {
        page.querySelector<HTMLElement>(selecteur)!.click();
    }

    async function remplirCorrectement(): Promise<void> {
        cliquer('input[name="civilite"][value="mme"]');
        saisir('#nom', 'Lovelace');
        saisir('#email', 'ada@exemple.fr');
        saisir('#sujet', 'formation', 'change');
        saisir('#message', 'Bonjour, je voudrais une formation Angular 22.');
        cliquer('input[name="consentement"]');
        await fixture.whenStable();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(ContactTemplate);
        page = fixture.nativeElement;
        // ngModel écrit ses valeurs de façon asynchrone : on attend la stabilité.
        await fixture.whenStable();
    });

    it("n'envoie pas un formulaire vide et affiche les erreurs", async () => {
        cliquer('button[type="submit"]');
        await fixture.whenStable();

        expect(fixture.componentInstance.envoye()).toBeNull();
        expect(page.textContent).toContain('Le nom est obligatoire.');
        expect(page.textContent).toContain('Choisissez un sujet.');
    });

    it('refuse un nom contenant un chiffre (validateur maison)', async () => {
        saisir('#nom', 'R2D2');
        page.querySelector('#nom')!.dispatchEvent(new Event('blur'));
        await fixture.whenStable();

        expect(page.textContent).toContain('Le nom ne doit pas contenir de chiffre.');
    });

    it('rend le téléphone obligatoire si on choisit d\'être rappelé', async () => {
        await remplirCorrectement();
        cliquer('input[name="moyen"][value="telephone"]');
        await fixture.whenStable();
        cliquer('button[type="submit"]');
        await fixture.whenStable();

        expect(fixture.componentInstance.envoye()).toBeNull();
        expect(page.textContent).toContain('Le téléphone est obligatoire pour être rappelé.');
    });

    it('envoie un formulaire valide puis le vide', async () => {
        await remplirCorrectement();
        cliquer('button[type="submit"]');
        await fixture.whenStable();

        expect(fixture.componentInstance.envoye()?.identite.nom).toBe('Lovelace');
        expect(fixture.componentInstance.envoye()?.sujet).toBe('formation');
        expect(page.querySelector<HTMLInputElement>('#nom')!.value).toBe('');
    });
});
