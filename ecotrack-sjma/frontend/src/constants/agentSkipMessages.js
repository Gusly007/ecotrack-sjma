const messages = {
  fr: {
    skip: 'Passer',
    ignored: 'Ignorée',
    collected: 'Collectée',
    pending: 'En attente',
    heading: 'Étapes ignorées',
    sessionNote: 'Ces étapes sont ignorées dans cet onglet uniquement et restent à collecter.',
    resume: 'Reprendre cette étape',
    allIgnored: 'Aucun autre conteneur à proposer',
    allIgnoredHelp: 'Vous pouvez reprendre une étape ignorée ci-dessous. Elle ne compte pas comme une collecte.',
    readError: 'Impossible de retrouver les étapes ignorées dans cet onglet.',
    writeError: 'Impossible de mémoriser ce choix. Réessayez ; aucune collecte n’a été enregistrée.',
  },
  en: {
    skip: 'Skip',
    ignored: 'Skipped',
    collected: 'Collected',
    pending: 'Pending',
    heading: 'Skipped stops',
    sessionNote: 'These stops are skipped in this tab only and still need collection.',
    resume: 'Resume this stop',
    allIgnored: 'No other container to suggest',
    allIgnoredHelp: 'You can resume a skipped stop below. Skipping does not count as a collection.',
    readError: 'Unable to retrieve skipped stops in this tab.',
    writeError: 'Unable to save this choice. Try again; no collection was recorded.',
  },
};

export function getAgentSkipMessages() {
  return messages[document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'fr'];
}
