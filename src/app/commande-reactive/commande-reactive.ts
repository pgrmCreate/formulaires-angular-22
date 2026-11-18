import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CODES_PROMO, codePromoExiste, emailsIdentiques } from './commande.validators';

export interface Produit {
    id: string;
    nom: string;
    prix: number;
}

export const PRODUITS: Produit[] = [
    { id: 'livre', nom: 'Livre « Angular 22 »', prix: 39.9 },
    { id: 'tasse', nom: 'Tasse Angular', prix: 12.5 },
    { id: 'tshirt', nom: 'T-shirt Signals', prix: 24 },
    { id: 'stickers', nom: 'Lot de stickers', prix: 6 },
];

export type ModeLivraison = 'standard' | 'express';

/** Ce que renvoie getRawValue() une fois le formulaire valide. */
export interface Commande {
    client: { nom: string; email: string; confirmationEmail: string };
    livraison: { adresse: string; codePostal: string; ville: string; mode: ModeLivraison; date: string };
    articles: { produit: string; quantite: number }[];
    codePromo: string;
    cgv: boolean;
}

/**
 * FORMULAIRE RÉACTIF (Reactive Forms)
 *
 * - La structure du formulaire est déclarée dans la classe avec FormBuilder.
 * - Le template ne fait que s'y relier : [formGroup], formGroupName, formControlName, formArrayName.
 * - Les règles sont des fonctions (Validators.*) passées à chaque contrôle.
 * - Les valeurs et les statuts sont exposés en Observable (valueChanges, statusChanges).
 */
@Component({
    selector: 'app-commande-reactive',
    imports: [ReactiveFormsModule, CurrencyPipe, JsonPipe],
    templateUrl: './commande-reactive.html',
    styleUrl: './commande-reactive.css',
})
export class CommandeReactive {
    /** .nonNullable : reset() remet la valeur initiale au lieu de null, et les types n'ont pas de | null. */
    private readonly fb = inject(FormBuilder).nonNullable;

    readonly produits = PRODUITS;

    readonly commandeForm = this.fb.group({
        client: this.fb.group(
            {
                nom: ['', [Validators.required, Validators.minLength(2)]],
                email: ['', [Validators.required, Validators.email]],
                confirmationEmail: ['', Validators.required],
            },
            // Validateur posé sur le groupe : il voit les deux champs.
            { validators: emailsIdentiques },
        ),
        livraison: this.fb.group({
            adresse: ['', Validators.required],
            codePostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
            ville: ['', Validators.required],
            mode: this.fb.control<ModeLivraison>('standard'),
            date: [''],
        }),
        // Liste dynamique : on ajoute et retire des sous-groupes.
        articles: this.fb.array([this.creerArticle()], Validators.minLength(1)),
        // updateOn: 'blur' : le validateur asynchrone ne tourne qu'en quittant le champ.
        codePromo: this.fb.control('', { asyncValidators: codePromoExiste, updateOn: 'blur' }),
        cgv: [false, Validators.requiredTrue],
    });

    /** Raccourcis pour le template et le code. */
    readonly client = this.commandeForm.controls.client;
    readonly livraison = this.commandeForm.controls.livraison;
    readonly articles = this.commandeForm.controls.articles;
    readonly codePromo = this.commandeForm.controls.codePromo;

    /**
     * Pont Observable -> signal : la valeur et le statut du formulaire deviennent des signaux,
     * utilisables dans computed() et rafraîchis à l'écran sans zone.js.
     */
    private readonly valeur = toSignal(this.commandeForm.valueChanges, {
        initialValue: this.commandeForm.getRawValue(),
    });
    readonly statutCode = toSignal(this.codePromo.statusChanges, {
        initialValue: this.codePromo.status,
    });

    readonly sousTotal = computed(() =>
        (this.valeur().articles ?? []).reduce((total, article) => {
            const produit = this.produits.find((p) => p.id === article.produit);
            return total + (produit ? produit.prix * (article.quantite ?? 0) : 0);
        }, 0),
    );

    readonly remise = computed(() => {
        const code = this.valeur().codePromo?.trim().toUpperCase() ?? '';
        const taux = this.statutCode() === 'VALID' ? (CODES_PROMO[code] ?? 0) : 0;
        return (this.sousTotal() * taux) / 100;
    });

    readonly fraisDePort = computed(() => {
        if (this.sousTotal() === 0) {
            return 0;
        }
        if (this.valeur().livraison?.mode === 'express') {
            return 9.9;
        }
        return this.sousTotal() >= 50 ? 0 : 4.9;
    });

    readonly total = computed(() => this.sousTotal() - this.remise() + this.fraisDePort());

    /** Date du jour au format AAAA-MM-JJ, pour l'attribut min du champ date. */
    readonly aujourdhui = new Date().toISOString().slice(0, 10);

    readonly envoye = signal<Commande | null>(null);

    constructor() {
        // Règle conditionnelle « à la main » : en express, la date devient obligatoire.
        // takeUntilDestroyed() se désabonne quand le composant est détruit.
        this.livraison.controls.mode.valueChanges.pipe(takeUntilDestroyed()).subscribe((mode) => {
            const date = this.livraison.controls.date;
            if (mode === 'express') {
                date.addValidators(Validators.required);
            } else {
                date.removeValidators(Validators.required);
            }
            date.updateValueAndValidity();
        });
    }

    creerArticle() {
        return this.fb.group({
            produit: ['', Validators.required],
            quantite: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
        });
    }

    ajouterArticle(): void {
        this.articles.push(this.creerArticle());
    }

    retirerArticle(index: number): void {
        this.articles.removeAt(index);
    }

    prixUnitaire(idProduit: string): number {
        return this.produits.find((p) => p.id === idProduit)?.prix ?? 0;
    }

    envoyer(): void {
        if (this.commandeForm.invalid || this.commandeForm.pending) {
            this.commandeForm.markAllAsTouched();
            return;
        }
        // getRawValue() inclut aussi les champs désactivés, contrairement à value.
        this.envoye.set(this.commandeForm.getRawValue());
        this.vider();
    }

    vider(): void {
        // On revient à un seul article avant de remettre les valeurs initiales.
        this.articles.clear();
        this.articles.push(this.creerArticle());
        this.commandeForm.reset();
    }
}
