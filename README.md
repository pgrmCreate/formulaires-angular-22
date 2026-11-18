# Formulaires Angular 22

Projet modèle de la formation **Angular – Développement d'applications web** (ORSYS, réf. LNF).
Il montre les **trois façons de construire un formulaire** en Angular 22, avec un composant complet
pour chacune : saisie, validation, messages d'erreur, règles conditionnelles, envoi et remise à zéro.

| Page | Composant | Approche | Exemple |
|---|---|---|---|
| `/template` | [`ContactTemplate`](src/app/contact-template/contact-template.ts) | Template-driven (`FormsModule`, `ngModel`) | Demande de contact |
| `/reactif` | [`CommandeReactive`](src/app/commande-reactive/commande-reactive.ts) | Reactive Forms (`ReactiveFormsModule`, `FormBuilder`) | Bon de commande |
| `/signal` | [`InscriptionSignal`](src/app/inscription-signal/inscription-signal.ts) | Signal Forms (`@angular/forms/signals`) | Création de compte |

## Démarrer

Prérequis : Node `^22.22.3`, `^24.15.0` ou `>=26`, et npm.

```bash
git clone https://github.com/pgrmCreate/formulaires-angular-22.git
cd formulaires-angular-22
npm install
npm start          # http://localhost:4200
npm test           # tests unitaires Vitest
npm run build      # build de production dans dist/
```

Sous Windows, si PowerShell refuse `npm` ou `ng` (« l'exécution de scripts est désactivée ») :
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Ce que montre chaque formulaire

### 1. Template-driven : demande de contact

Le modèle est un objet de la classe ; le template décrit tout le reste.

- `[(ngModel)]` + attribut `name` sur chaque champ, `#f="ngForm"` et `#nom="ngModel"` pour lire l'état.
- Règles en attributs HTML : `required`, `minlength`, `maxlength`, `email`, `pattern`.
- Sous-groupes avec `ngModelGroup` (`identite`, `joindre`).
- Boutons radio, liste déroulante, date, zone de texte avec compteur, case à cocher obligatoire.
- **Validateur maison** sous forme de directive : [`sans-chiffre.validator.ts`](src/app/contact-template/sans-chiffre.validator.ts).
- **Règle conditionnelle** : `[required]="contact.joindre.moyen === 'telephone'"`.
- Envoi avec `(ngSubmit)`, `markAllAsTouched()` si invalide, `resetForm()` après envoi.

### 2. Reactive Forms : bon de commande

La structure est déclarée dans la classe avec `FormBuilder` ; le template s'y relie.

- `inject(FormBuilder).nonNullable` : formulaire typé, `reset()` revient aux valeurs initiales.
- Groupes imbriqués (`formGroupName`) et **liste dynamique** `FormArray` (ajouter / retirer des articles).
- **Validateur de groupe** (les deux e-mails doivent être identiques) et **validateur asynchrone**
  (code promo vérifié avec un délai simulé, `updateOn: 'blur'`) : [`commande.validators.ts`](src/app/commande-reactive/commande.validators.ts).
- **Règle conditionnelle** via `valueChanges` + `addValidators` / `removeValidators` (date obligatoire en express),
  désabonnement automatique avec `takeUntilDestroyed()`.
- Pont Observable → signal avec `toSignal()` pour calculer le total avec `computed()`.
- `getRawValue()` à l'envoi.

### 3. Signal Forms : création de compte

Le modèle est un `signal` ; `form()` en tire un arbre de champs typé, les règles sont dans un schéma.

- `[formField]` relie chaque élément ; `[formRoot]` gère l'envoi (pas de `(ngSubmit)`).
- Règles avec message intégré : `required`, `email`, `minLength`, `maxLength`, `pattern`, `min`, `max`.
- Règle maison réutilisable avec `validate()` (`sansEspace`), règle entre deux champs avec `valueOf()`
  (confirmation du mot de passe).
- Tableau de sous-formulaires avec `applyEach()` (langages pratiqués).
- Champ désactivé selon un autre champ avec `disabled()` (fréquence de la newsletter).
- Action d'envoi asynchrone avec `submitting()` et **erreur renvoyée par le serveur** affichée sous le bon champ
  (essayez le pseudo `admin`).
- État lu dans un `computed()` (force du mot de passe) et `reset(valeur)`.

## Comparaison rapide

| | Template-driven | Reactive Forms | Signal Forms |
|---|---|---|---|
| Import | `FormsModule` | `ReactiveFormsModule` | `FormField`, `FormRoot` |
| Où est la structure ? | dans le template | dans la classe | dans le modèle (signal) |
| Où sont les règles ? | attributs HTML / directives | `Validators.*` | schéma de `form()` |
| Lier un champ | `[(ngModel)]` + `name` | `formControlName` | `[formField]` |
| Lire l'état | `#x="ngModel"` | `form.controls.x` | `form.x()` (signaux) |
| Messages d'erreur | dans le template | dans le template | dans la règle |
| Typage | faible | fort (`nonNullable`) | fort (déduit du modèle) |
| Réactivité | détection de changements | Observables | signaux |
| Statut en Angular 22 | stable | stable | nouvelle API |

En pratique : template-driven pour un petit formulaire simple, Reactive Forms pour l'existant et les
formulaires complexes, Signal Forms pour les nouveaux développements orientés signaux.

## Organisation du code

```text
src/app/
├── app.ts / app.html            navigation entre les trois pages
├── app.routes.ts                une route chargée à la demande par formulaire
├── app.config.ts                routeur + format français (79,80 €)
├── contact-template/            1. template-driven
├── commande-reactive/           2. Reactive Forms
└── inscription-signal/          3. Signal Forms
src/styles.css                   styles communs aux formulaires
```

Chaque dossier contient le composant (`.ts`), son template (`.html`) et ses tests (`.spec.ts`).
Les commentaires du code expliquent chaque notion.

## Tests

`npm test` lance 18 tests Vitest. Ils servent aussi d'exemples : remplir un formulaire template-driven
par le DOM, tester un validateur de groupe ou asynchrone, déclencher l'envoi d'un formulaire Signal Forms
et vérifier l'erreur renvoyée par le serveur.

---

Généré avec Angular CLI 22.2.7.
