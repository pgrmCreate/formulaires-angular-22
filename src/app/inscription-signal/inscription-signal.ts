import { Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
    applyEach,
    disabled,
    email,
    form,
    FormField,
    FormRoot,
    max,
    maxLength,
    min,
    minLength,
    pattern,
    required,
    SchemaPath,
    validate,
} from '@angular/forms/signals';

export type Niveau = 'debutant' | 'intermediaire' | 'expert';
export type Frequence = 'hebdomadaire' | 'mensuelle';

export interface Langage {
    nom: string;
    niveau: Niveau;
}

/** Le modèle : chaque propriété devient un champ du formulaire. */
export interface Inscription {
    pseudo: string;
    email: string;
    motDePasse: string;
    confirmation: string;
    age: number | null;
    pays: string;
    langages: Langage[];
    newsletter: boolean;
    frequence: Frequence;
    cgu: boolean;
}

export function nouvelleInscription(): Inscription {
    return {
        pseudo: '',
        email: '',
        motDePasse: '',
        confirmation: '',
        age: null,
        pays: '',
        langages: [{ nom: '', niveau: 'debutant' }],
        newsletter: false,
        frequence: 'mensuelle',
        cgu: false,
    };
}

/** Pseudos déjà pris côté « serveur » (simulé dans l'action d'envoi). */
const PSEUDOS_PRIS = ['admin', 'angular'];

/**
 * Règle réutilisable : une fonction qui reçoit un chemin et y applique des règles.
 * On peut l'appeler depuis plusieurs schémas.
 */
function sansEspace(chemin: SchemaPath<string>, message: string): void {
    validate(chemin, ({ value }) => (value().includes(' ') ? { kind: 'espace', message } : null));
}

const attendre = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * FORMULAIRE SIGNAL FORMS (@angular/forms/signals, Angular 21+)
 *
 * - Le modèle est un signal ordinaire : c'est la seule source de vérité.
 * - form(modele, schema) construit un arbre de champs typé qui a la forme du modèle.
 * - Les règles sont écrites dans le schéma, avec leur message d'erreur.
 * - [formField] relie un élément HTML à un champ ; [formRoot] gère l'envoi.
 * - Tout l'état (valid, touched, errors, submitting…) est fait de signaux.
 */
@Component({
    selector: 'app-inscription-signal',
    imports: [FormField, FormRoot, JsonPipe],
    templateUrl: './inscription-signal.html',
    styleUrl: './inscription-signal.css',
})
export class InscriptionSignal {
    readonly pays = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada', 'Autre'];
    readonly niveaux: { valeur: Niveau; libelle: string }[] = [
        { valeur: 'debutant', libelle: 'Débutant' },
        { valeur: 'intermediaire', libelle: 'Intermédiaire' },
        { valeur: 'expert', libelle: 'Expert' },
    ];

    /** 1. Le modèle. */
    readonly inscription = signal<Inscription>(nouvelleInscription());

    /** Dernière inscription réussie. */
    readonly envoye = signal<Inscription | null>(null);

    /** 2. L'arbre de champs + 3. le schéma (les règles) + 4. l'action d'envoi. */
    readonly inscriptionForm = form(
        this.inscription,
        (chemin) => {
            // Pseudo : règles intégrées + règle maison réutilisable.
            required(chemin.pseudo, { message: 'Le pseudo est obligatoire.' });
            minLength(chemin.pseudo, 3, { message: 'Au moins 3 caractères.' });
            maxLength(chemin.pseudo, 20, { message: '20 caractères maximum.' });
            sansEspace(chemin.pseudo, 'Pas d\'espace dans le pseudo.');

            required(chemin.email, { message: 'L\'e-mail est obligatoire.' });
            email(chemin.email, { message: 'Adresse e-mail invalide.' });

            // Mot de passe : plusieurs motifs, chacun avec son message.
            required(chemin.motDePasse, { message: 'Le mot de passe est obligatoire.' });
            minLength(chemin.motDePasse, 8, { message: 'Au moins 8 caractères.' });
            pattern(chemin.motDePasse, /[A-Z]/, { message: 'Au moins une majuscule.' });
            pattern(chemin.motDePasse, /\d/, { message: 'Au moins un chiffre.' });

            // Règle entre deux champs : valueOf() lit la valeur d'un autre champ.
            required(chemin.confirmation, { message: 'Confirmez le mot de passe.' });
            validate(chemin.confirmation, ({ value, valueOf }) =>
                value() && value() !== valueOf(chemin.motDePasse)
                    ? { kind: 'differents', message: 'Les mots de passe ne correspondent pas.' }
                    : null,
            );

            required(chemin.age, { message: 'L\'âge est obligatoire.' });
            min(chemin.age, 16, { message: 'Il faut avoir au moins 16 ans.' });
            max(chemin.age, 120, { message: 'Âge invalide.' });

            required(chemin.pays, { message: 'Choisissez un pays.' });

            // Tableau : applyEach applique les règles à chaque élément.
            applyEach(chemin.langages, (langage) => {
                required(langage.nom, { message: 'Nom du langage obligatoire.' });
            });
            validate(chemin.langages, ({ value }) =>
                value().length === 0
                    ? { kind: 'aucun', message: 'Indiquez au moins un langage.' }
                    : null,
            );

            // Règle conditionnelle : la fréquence n'est modifiable que si la newsletter est cochée.
            disabled(chemin.frequence, ({ valueOf }) => !valueOf(chemin.newsletter));

            validate(chemin.cgu, ({ value }) =>
                value() ? null : { kind: 'cgu', message: 'Vous devez accepter les conditions.' },
            );
        },
        {
            // Lancée par [formRoot] au submit, seulement si le formulaire est valide.
            submission: {
                action: async (champs) => {
                    await attendre(800); // simule un appel serveur
                    const valeur = champs().value();
                    if (PSEUDOS_PRIS.includes(valeur.pseudo.toLowerCase())) {
                        // Erreur « serveur » rattachée au champ pseudo.
                        return {
                            kind: 'pris',
                            message: 'Ce pseudo est déjà pris.',
                            fieldTree: champs.pseudo,
                        };
                    }
                    this.envoye.set(structuredClone(valeur));
                    return null;
                },
            },
        },
    );

    /** L'état du formulaire est fait de signaux : on peut le lire dans un computed. */
    readonly forceMotDePasse = computed(() => {
        const erreurs = this.inscriptionForm.motDePasse().errors().length;
        const longueur = this.inscription().motDePasse.length;
        if (longueur === 0) {
            return '';
        }
        return erreurs === 0 ? 'Solide' : erreurs === 1 ? 'Moyen' : 'Faible';
    });

    ajouterLangage(): void {
        // On modifie le modèle : le formulaire suit tout seul.
        this.inscription.update((m) => ({
            ...m,
            langages: [...m.langages, { nom: '', niveau: 'debutant' }],
        }));
    }

    retirerLangage(index: number): void {
        this.inscription.update((m) => ({
            ...m,
            langages: m.langages.filter((_, i) => i !== index),
        }));
    }

    vider(): void {
        // reset(valeur) remet touched/dirty à false ET remplace les valeurs.
        this.inscriptionForm().reset(nouvelleInscription());
    }
}
