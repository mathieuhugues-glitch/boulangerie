# La boulangerie · Bageriet 🥐🪙

Jeu de marchande pour enfants (≈ 6 ans) avec de vraies couronnes suédoises (1, 2, 5, 10 kr ; billets de 20, 50, 100 kr). Français par défaut, suédois avec le drapeau. Hors ligne, sans pub, sans compte, sans collecte de données.

## Rôles
- **Cliente** 👧🛍️ : la boulangère dit quoi acheter (et le montre en images). Elle prend les articles sur l'étagère, trouve ou écoute le total, paye avec son porte-monnaie, puis dit combien on doit lui rendre (ou vérifie la monnaie rendue 👍/👎).
- **Caissière** 👧💰 : un animal commande. Elle tape le total (3 choix ou pavé numérique), encaisse l'argent, puis rend la monnaie en tirant les pièces du tiroir-caisse.

Toucher une pièce = sa valeur est dite. Toucher un article = son nom et son prix. 💡 = aide visuelle (points à compter : addition, soustraction, montant restant). Après 2 erreurs, l'aide s'affiche toute seule. Aucune pénalité.
6 clients par partie, puis un bocal qui se remplit de pièces et des étoiles (🌟 = au plus une erreur).

## Niveaux (choix parent sur l'écran d'accueil, puis adaptatif)
1. 1 article, 1–10 kr, payer le compte juste (pièces).
2. 1 article, 10–30 kr, compte juste (avec billet de 20).
3. 1 article, payer avec 10 ou 20 kr, calculer le reste.
4. 2 articles, trouver la somme (≤ 24 kr), compte juste.
5. 2 articles (≤ 40 kr), payer avec un billet, calculer le reste.
6. 2–3 sortes d'articles avec quantités (« 3 kanelbullar »), jusqu'à 95 kr, billet de 20/50/100, reste.

Adaptatif : 2 clients de suite avec ≤ 1 erreur → niveau +1 ; 2 clients avec ≥ 4 erreurs → niveau −1.

## Technique
Site statique (GitHub Pages, `.nojekyll`), service worker + manifeste. Voix `speechSynthesis`, sons WebAudio.
`node tools/check.cjs` vérifie 30 000 problèmes générés (totaux dans la plage, reste > 0, porte-monnaie capable de payer, choix distincts). `tools/e2e.cjs` = test Playwright rapide.
