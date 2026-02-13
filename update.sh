#!/bin/bash
echo "🍊 MISE À JOUR ORANGE PERF"
echo "--------------------------------"

git add .

echo "Nom de la mise à jour ?"
read msg

git commit -m "$msg"
git push
npm run deploy

echo "✅ Fini !"
