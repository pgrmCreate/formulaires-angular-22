import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SansChiffreValidator } from './sans-chiffre.validator';

export type Civilite = 'mme' | 'm' | 'autre';
export type MoyenContact = 'email' | 'telephone';
export type Sujet = 'devis' | 'support' | 'formation' | 'autre';

/** Le modèle du formulaire : un objet ordinaire, regroupé comme les ngModelGroup du template. */
export interface Contact {
    identite: {
        civilite: Civilite | '';
        nom: string;
    };
    joindre: {
        email: string;
        moyen: MoyenContact;
        telephone: string;
    };
    sujet: Sujet | '';
    message: string;
    dateRappel: string;
    consentement: boolean;
}

export function nouveauContact(): Contact {
    return {
        identite: { civilite: '', nom: '' },
        joindre: { email: '', moyen: 'email', telephone: '' },
        sujet: '',
        message: '',
        dateRappel: '',
        consentement: false,
    };
}

/**
 * FORMULAIRE TEMPLATE-DRIVEN
 *
 * - Le modèle est un objet de la classe (this.contact).
 * - Chaque champ est relié par [(ngModel)] et doit avoir un attribut name.
 * - Les règles sont des attributs HTML dans le template : required, minlength, email, pattern…
 * - Angular crée lui-même le FormGroup et les FormControl à partir du template.
 */
@Component({
    selector: 'app-contact-template',
    imports: [FormsModule, JsonPipe, SansChiffreValidator],
    templateUrl: './contact-template.html',
})
export class ContactTemplate {
    contact: Contact = nouveauContact();

    readonly sujets: { valeur: Sujet; libelle: string }[] = [
        { valeur: 'devis', libelle: 'Demande de devis' },
        { valeur: 'support', libelle: 'Support technique' },
        { valeur: 'formation', libelle: 'Formation' },
        { valeur: 'autre', libelle: 'Autre' },
    ];

    /** Date du jour au format AAAA-MM-JJ, pour l'attribut min du champ date. */
    readonly aujourdhui = new Date().toISOString().slice(0, 10);

    readonly messageMax = 500;

    /** Dernière demande envoyée (affichée sous le formulaire). */
    readonly envoye = signal<Contact | null>(null);

    envoyer(formulaire: NgForm): void {
        if (formulaire.invalid) {
            // Affiche toutes les erreurs, même dans les champs jamais visités.
            formulaire.control.markAllAsTouched();
            return;
        }
        // Copie du modèle : le formulaire va être vidé juste après.
        this.envoye.set(structuredClone(this.contact));
        this.vider(formulaire);
    }

    vider(formulaire: NgForm): void {
        // resetForm() remet submitted, touched et dirty à false...
        formulaire.resetForm();
        // ...puis on repart d'un modèle neuf : ngModel recopie ces valeurs dans les champs.
        this.contact = nouveauContact();
    }
}
