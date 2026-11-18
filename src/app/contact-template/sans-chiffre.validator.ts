import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

/**
 * Validateur maison pour un formulaire template-driven.
 *
 * En template-driven, un validateur personnalisé s'écrit sous forme de directive
 * qui s'enregistre auprès d'Angular avec le jeton NG_VALIDATORS.
 * Utilisation : <input name="nom" ngModel appSansChiffre>
 */
@Directive({
    selector: '[appSansChiffre][ngModel]',
    providers: [{ provide: NG_VALIDATORS, useExisting: SansChiffreValidator, multi: true }],
})
export class SansChiffreValidator implements Validator {
    validate(control: AbstractControl<string | null>): ValidationErrors | null {
        const valeur = control.value ?? '';
        return /\d/.test(valeur) ? { sansChiffre: true } : null;
    }
}
