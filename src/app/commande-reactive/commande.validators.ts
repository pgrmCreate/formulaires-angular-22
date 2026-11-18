import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { map, of, timer } from 'rxjs';

/**
 * Validateur de GROUPE : compare deux champs du même FormGroup.
 * Il se pose sur le groupe, pas sur un champ : { validators: emailsIdentiques }.
 */
export const emailsIdentiques: ValidatorFn = (groupe: AbstractControl): ValidationErrors | null => {
    const email = groupe.get('email')?.value;
    const confirmation = groupe.get('confirmationEmail')?.value;
    return email && confirmation && email !== confirmation ? { emailsDifferents: true } : null;
};

/** Codes promo connus et leur remise (en %). Dans une vraie application : un appel HTTP. */
export const CODES_PROMO: Record<string, number> = {
    ANGULAR22: 22,
    ORSYS10: 10,
};

/**
 * Validateur ASYNCHRONE : renvoie un Observable (ou une Promise).
 * Pendant l'attente, le champ a le statut 'PENDING'.
 * Ici, timer(500) simule la réponse d'un serveur.
 */
export const codePromoExiste: AsyncValidatorFn = (control: AbstractControl<string>) => {
    const code = control.value?.trim().toUpperCase();
    if (!code) {
        return of(null);
    }
    return timer(500).pipe(map(() => (code in CODES_PROMO ? null : { codeInconnu: true })));
};
