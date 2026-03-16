#!/bin/bash

# 1. On prépare les fichiers
git add .

# 2. On valide (avec la date du jour automatique)
git commit -m "Mise à jour du $(date +'%d/%m/%Y')"

# 3. On envoie le code (Le mot de passe est déjà enregistré !)
git push

# 4. On met en ligne
npm run deploy

echo "✅ Site mis à jour avec succès !"
