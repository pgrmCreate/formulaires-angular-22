import { TestBed } from '@angular/core/testing';
import { CommandeReactive } from './commande-reactive';

describe('CommandeReactive (Reactive Forms)', () => {
    let composant: CommandeReactive;

    beforeEach(async () => {
        const fixture = TestBed.createComponent(CommandeReactive);
        composant = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('est invalide au départ', () => {
        expect(composant.commandeForm.invalid).toBe(true);
    });

    it('signale deux e-mails différents sur le groupe client', () => {
        composant.client.patchValue({ email: 'a@exemple.fr', confirmationEmail: 'b@exemple.fr' });
        expect(composant.client.hasError('emailsDifferents')).toBe(true);

        composant.client.patchValue({ confirmationEmail: 'a@exemple.fr' });
        expect(composant.client.hasError('emailsDifferents')).toBe(false);
    });

    it('rend la date obligatoire en livraison express', () => {
        const date = composant.livraison.controls.date;
        expect(date.valid).toBe(true);

        composant.livraison.controls.mode.setValue('express');
        expect(date.hasError('required')).toBe(true);

        composant.livraison.controls.mode.setValue('standard');
        expect(date.valid).toBe(true);
    });

    it('ajoute et retire des articles', () => {
        composant.ajouterArticle();
        expect(composant.articles.length).toBe(2);
        composant.retirerArticle(0);
        expect(composant.articles.length).toBe(1);
    });

    it('calcule le total avec un code promo vérifié de façon asynchrone', async () => {
        composant.articles.at(0).setValue({ produit: 'livre', quantite: 2 }); // 79,80 €
        expect(composant.fraisDePort()).toBe(0); // offerts dès 50 €

        composant.codePromo.setValue('orsys10');
        expect(composant.codePromo.pending).toBe(true);
        await new Promise((resolve) => setTimeout(resolve, 600));

        expect(composant.codePromo.valid).toBe(true);
        expect(composant.remise()).toBeCloseTo(7.98);
        expect(composant.total()).toBeCloseTo(71.82);
    });

    it('refuse un code promo inconnu', async () => {
        composant.codePromo.setValue('FAUX');
        await new Promise((resolve) => setTimeout(resolve, 600));
        expect(composant.codePromo.hasError('codeInconnu')).toBe(true);
    });
});
