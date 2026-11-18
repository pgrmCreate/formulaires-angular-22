import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inscription, InscriptionSignal, nouvelleInscription } from './inscription-signal';

const VALIDE: Inscription = {
    ...nouvelleInscription(),
    pseudo: 'ada',
    email: 'ada@exemple.fr',
    motDePasse: 'Angular22',
    confirmation: 'Angular22',
    age: 36,
    pays: 'France',
    langages: [{ nom: 'TypeScript', niveau: 'expert' }],
    cgu: true,
};

describe('InscriptionSignal (Signal Forms)', () => {
    let fixture: ComponentFixture<InscriptionSignal>;
    let composant: InscriptionSignal;

    async function envoyer(): Promise<void> {
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
        await new Promise((resolve) => setTimeout(resolve, 900)); // l'action simule 800 ms de serveur
        await fixture.whenStable();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(InscriptionSignal);
        composant = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('relie le modèle et les champs dans les deux sens', () => {
        composant.inscriptionForm.pseudo().value.set('jean');
        expect(composant.inscription().pseudo).toBe('jean');
    });

    it('détecte deux mots de passe différents', () => {
        composant.inscription.set({ ...VALIDE, confirmation: 'Autre123' });
        const erreurs = composant.inscriptionForm.confirmation().errors();
        expect(erreurs.map((e) => e.kind)).toEqual(['differents']);
    });

    it('désactive la fréquence tant que la newsletter n\'est pas cochée', () => {
        expect(composant.inscriptionForm.frequence().disabled()).toBe(true);
        composant.inscription.update((m) => ({ ...m, newsletter: true }));
        expect(composant.inscriptionForm.frequence().disabled()).toBe(false);
    });

    it('valide chaque langage du tableau', () => {
        composant.inscription.set({ ...VALIDE, langages: [{ nom: '', niveau: 'debutant' }] });
        expect(composant.inscriptionForm.langages[0].nom().invalid()).toBe(true);
        expect(composant.inscriptionForm().valid()).toBe(false);
    });

    it("n'envoie pas un formulaire invalide et affiche les erreurs", async () => {
        await envoyer();
        expect(composant.envoye()).toBeNull();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Le pseudo est obligatoire.');
    });

    it('affiche l\'erreur renvoyée par le serveur sous le pseudo', async () => {
        composant.inscription.set({ ...VALIDE, pseudo: 'admin' });
        await envoyer();
        expect(composant.envoye()).toBeNull();
        expect(composant.inscriptionForm.pseudo().errors().map((e) => e.kind)).toContain('pris');
    });

    it('envoie un formulaire valide', async () => {
        composant.inscription.set(VALIDE);
        expect(composant.inscriptionForm().valid()).toBe(true);
        await envoyer();
        expect(composant.envoye()?.pseudo).toBe('ada');
    });
});
