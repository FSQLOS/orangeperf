// C'est ici que tu modifies tes réglages chaque mois !
export const config = {
    // 1. Le lien de ton Google Sheet (CSV)
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRQhU0168lFGtFdLX0oqNU6r9Dy87d_mW7zeSJ2LVrf_I87RxC4SbLFZiXSJcaQa8rRvuxDN8kmH0iF/pub?output=csv",

    // 2. Tes Objectifs GLOBAUX Boutique (Le site calculera la part par vendeur tout seul)
    objectifs: {
        Terminaux: 306,
        Mobile: 200,
        Broadband: 100, // Box
        MIG: 110,
        MEV: 90,
        Cyber: 33,
        MP: 22          // Maison Protégée
    },

    // 3. Ta liste de vendeurs (Copie-colle ta liste habituelle ici, entre les guillemets inversés ` `)
    equipe: `
    00017561 : Johan
    00015162 : Emre
    00016295 : Irvan
    00040258 : Amaury
    00009572 : Jean-Maxime
    00040373 : Yannis
    00017785 : Lucas
    00014065 : Nicolas
    00015199 : Elliot
    00016661 : Mathieu
    00014897 : Ludovyk
    00014896 : Steeve
    `
};
