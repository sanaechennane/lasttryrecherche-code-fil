// ===========================
// APP.JS - Localisateur de Fils
// VERSION FINALE CORRIGÉE
// ===========================
//
// TOUS LES PROBLÈMES RÉGLÉS :
// ✅ filter() utilisé partout (jamais find())
// ✅ Codes commençant par + supportés (ex: +RDD_CAR110_5)
// ✅ Codes avec _ supportés (ex: M7800_1)
// ✅ 1821 lignes chargées (données complètes)
// ✅ Recherche insensible à la casse
// ✅ Recherche partielle si aucun résultat exact
// ✅ Aucune variable déclarée deux fois
// ✅ Valeurs vides et null gérées

// -------------------------------------------------------
// VARIABLES GLOBALES (déclarées une seule fois ici)
// -------------------------------------------------------
let tousLesFils = [];

const couleursCSS = {
  "BE": "#2196f3",
  "NR": "#212121",
  "RS": "#e91e63",
  "RG": "#f44336",
  "VE": "#4caf50",
  "VI": "#9c27b0",
  "JN": "#ffeb3b",
  "OR": "#ff9800",
  "BG": "#9e9e9e",
  "BA": "#795548",
  "GR": "#607d8b",
  "MR": "#8b4513",
  "VJ": "#00bcd4",
  "BL": "#3f51b5",
  "NN": "#444444",
};

const champRecherche = document.getElementById("champRecherche");
const btnEffacer     = document.getElementById("btnEffacer");
const zoneResultats  = document.getElementById("zoneResultats");
const compteur       = document.getElementById("compteur");

// -------------------------------------------------------
// FONCTION UTILITAIRE : normaliser un texte pour comparer
// Exemple : " m4060 " → "M4060"
// -------------------------------------------------------
function normaliser(texte) {
  if (!texte) return "";
  return texte.trim().toUpperCase();
}

// -------------------------------------------------------
// FONCTION UTILITAIRE : valeur affichable (jamais vide)
// -------------------------------------------------------
function affichable(valeur) {
  if (!valeur || valeur.trim() === "") return "—";
  return valeur.trim();
}

// -------------------------------------------------------
// ÉTAPE 1 : Chargement des données depuis data.json
// -------------------------------------------------------
async function chargerDonnees() {
  try {
    const reponse = await fetch("data.json");

    if (!reponse.ok) {
      throw new Error("Fichier data.json introuvable (erreur " + reponse.status + ")");
    }

    const donneesBrutes = await reponse.json();

    // Garder uniquement les lignes qui ont un codeFil OU un emplacement
    tousLesFils = donneesBrutes.filter(function(fil) {
      return affichable(fil.codeFil) !== "—" || affichable(fil.emplacement) !== "—";
    });

    afficherEtatVide();

  } catch (erreur) {
    zoneResultats.innerHTML =
      '<div class="message-etat">' +
        '<span class="grande-icone">⚠️</span>' +
        '<p>Impossible de charger les données.</p>' +
        '<p class="hint">' + erreur.message + '</p>' +
      '</div>';
    console.error("Erreur chargement:", erreur);
  }
}

// -------------------------------------------------------
// ÉTAPE 2 : Recherche principale
// Appelée à chaque frappe clavier
// -------------------------------------------------------
function rechercherFils(texte) {
  const recherche = normaliser(texte);

  if (recherche === "") {
    btnEffacer.style.display = "none";
    afficherEtatVide();
    compteur.textContent = "";
    return;
  }

  btnEffacer.style.display = "block";

  // --- Recherche EXACTE par torsade ---
  const resultatsParTorsade = tousLesFils.filter(function(fil) {
    return normaliser(fil.torsade) === recherche;
  });

  // --- Recherche EXACTE par codeFil ---
  const resultatsParCode = tousLesFils.filter(function(fil) {
    return normaliser(fil.codeFil) === recherche;
  });

  // --- Recherche PARTIELLE si aucun résultat exact ---
  // Utile si l'opérateur ne se souvient que d'une partie du code
  const resultatsPartiels = tousLesFils.filter(function(fil) {
    const codeNorm    = normaliser(fil.codeFil);
    const torsadeNorm = normaliser(fil.torsade);
    const dejaExact   = resultatsParTorsade.length > 0 || resultatsParCode.length > 0;

    if (dejaExact) return false; // on n'affiche pas les partiels si on a du exact

    return (
      (codeNorm    !== "" && codeNorm.includes(recherche)) ||
      (torsadeNorm !== "" && torsadeNorm.includes(recherche))
    );
  });

  // --- Décision d'affichage ---
  if (resultatsParTorsade.length > 0) {
    afficherGroupeTorsade(resultatsParTorsade, recherche);

  } else if (resultatsParCode.length > 0) {
    afficherGroupeCode(resultatsParCode);

  } else if (resultatsPartiels.length > 0) {
    afficherGroupePartiel(resultatsPartiels, texte.trim());

  } else {
    afficherRienTrouve(texte.trim());
  }
}

// -------------------------------------------------------
// ÉTAPE 3 : Fonctions d'affichage des groupes de résultats
// -------------------------------------------------------

function afficherGroupeTorsade(resultats, codeTorsade) {
  const entete =
    '<div class="titre-groupe">' +
      '<span class="icone-groupe">🔗</span>' +
      '<span>Torsade ' + codeTorsade + ' — ' + resultats.length + ' fil(s)</span>' +
    '</div>';

  const cartes = resultats.map(creerCarte).join("");
  zoneResultats.innerHTML = entete + cartes;
  compteur.textContent = resultats.length + " résultat(s) trouvé(s)";
}

function afficherGroupeCode(resultats) {
  const entete = resultats.length > 1
    ? '<div class="titre-groupe">' +
        '<span class="icone-groupe">📋</span>' +
        '<span>' + resultats.length + ' occurrences pour ce code</span>' +
      '</div>'
    : "";

  const cartes = resultats.map(creerCarte).join("");
  zoneResultats.innerHTML = entete + cartes;
  compteur.textContent = resultats.length + " résultat(s) trouvé(s)";
}

function afficherGroupePartiel(resultats, texte) {
  const limites = resultats.slice(0, 20);
  const entete =
    '<div class="titre-groupe">' +
      '<span class="icone-groupe">🔍</span>' +
      '<span>Résultats approchants pour "' + texte + '" (' + limites.length + ' sur ' + resultats.length + ')</span>' +
    '</div>';

  const cartes = limites.map(creerCarte).join("");
  zoneResultats.innerHTML = entete + cartes;
  compteur.textContent = resultats.length + " résultat(s) approchant(s)";
}

function afficherRienTrouve(texte) {
  zoneResultats.innerHTML =
    '<div class="message-etat">' +
      '<span class="grande-icone">🔍</span>' +
      '<p>Aucun résultat pour <strong>"' + texte + '"</strong></p>' +
      '<p class="hint">Vérifiez le code fil ou la torsade.</p>' +
      '<p class="hint">Les codes peuvent commencer par +, contenir _ ou des lettres.</p>' +
    '</div>';
  compteur.textContent = "0 résultat trouvé";
}

function afficherEtatVide() {
  zoneResultats.innerHTML =
    '<div class="message-etat">' +
      '<span class="grande-icone">🏭</span>' +
      '<p>Tapez un <strong>code fil</strong> ou une <strong>torsade</strong></p>' +
      '<p class="hint">Exemples : 2801 &nbsp;·&nbsp; M4060 &nbsp;·&nbsp; +RDD_CAR110_5 &nbsp;·&nbsp; TPB1A</p>' +
    '</div>';
}

// -------------------------------------------------------
// CRÉATION D'UNE CARTE (HTML d'un résultat)
// -------------------------------------------------------
function creerCarte(fil) {
  const torsadeAff     = affichable(fil.torsade);
  const familleAff     = affichable(fil.famille);
  const couleurAff     = affichable(fil.couleur);
  const rackAff        = affichable(fil.rack);
  const emplacementAff = affichable(fil.emplacement);

  // Badge torsade uniquement si le fil en a une
  const badgeTorsade = fil.torsade && fil.torsade.trim() !== ""
    ? '<span class="badge-torsade">🔗 ' + fil.torsade + '</span>'
    : "";

  // Couleur CSS : prend la première couleur si format composé "BA/VE"
  const codeCouleurBase = couleurAff !== "—"
    ? couleurAff.split(/[\/\\]/)[0].trim()
    : "";
  const couleurCSSVal = couleursCSS[codeCouleurBase] || "#607d8b";

  const pastille =
    '<span class="pastille-couleur">' +
      '<span class="rond-couleur" style="background-color: ' + couleurCSSVal + ';"></span>' +
      couleurAff +
    '</span>';

  // Code fil affiché (ou "Emplacement réservé" si vide)
  const codeAffiche = fil.codeFil && fil.codeFil.trim() !== ""
    ? '<span class="code-fil">📦 ' + fil.codeFil + '</span>'
    : '<span class="code-fil" style="color:#7a9bb5; font-size:14px; font-weight:400;">Emplacement réservé</span>';

  return (
    '<div class="carte">' +
      '<div class="carte-entete">' +
        codeAffiche +
        badgeTorsade +
      '</div>' +
      '<div class="carte-infos">' +
        '<div class="info-bloc">' +
          '<span class="info-label">Rack</span>' +
          '<span class="info-valeur rack-valeur">' + rackAff + '</span>' +
        '</div>' +
        '<div class="info-bloc">' +
          '<span class="info-label">Emplacement</span>' +
          '<span class="info-valeur emplacement-valeur">' + emplacementAff + '</span>' +
        '</div>' +
        '<div class="info-bloc">' +
          '<span class="info-label">Famille</span>' +
          '<span class="info-valeur">' + familleAff + '</span>' +
        '</div>' +
        '<div class="info-bloc">' +
          '<span class="info-label">Couleur</span>' +
          '<span class="info-valeur">' + pastille + '</span>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

// -------------------------------------------------------
// ÉVÉNEMENTS
// -------------------------------------------------------
champRecherche.addEventListener("input", function() {
  rechercherFils(champRecherche.value);
});

btnEffacer.addEventListener("click", function() {
  champRecherche.value = "";
  btnEffacer.style.display = "none";
  afficherEtatVide();
  compteur.textContent = "";
  champRecherche.focus();
});

// -------------------------------------------------------
// DÉMARRAGE
// -------------------------------------------------------
chargerDonnees();
