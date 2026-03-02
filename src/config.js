// ==========================================
// C'EST ICI QUE TU CONFIGURES LE MOIS
// ==========================================

export const config = {
    // 1. Ton lien Google Sheet (CSV publié sur le web)
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRQhU0168lFGtFdLX0oqNU6r9Dy87d_mW7zeSJ2LVrf_I87RxC4SbLFZiXSJcaQa8rRvuxDN8kmH0iF/pub?output=csv",

    // 2. Les Objectifs GLOBAUX de la boutique pour le mois
    // Le site divisera ces chiffres par le nombre de vendeurs automatiquement
    objectifs: {
        CA: 23326,
        Terminaux: 279,
        Mobile: 114,   // Forfaits
        Broadband: 74, // Internet / Box
        MIG: 109,
        MEV: 51,
        Cyber: 27,
        MP: 11,         // Maison Protégée
        Assurance: 42   // En %, c'est un taux, pas un volume
    },

    // 3. Ta liste de vendeurs (Format : CODE : PRENOM)
    // ATTENTION : Mets bien les codes exacts de ton fichier Excel
    team: `
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
