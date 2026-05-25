// Rôle du fichier : accès aux données des défis et participations.


export class DefisRepository {
  static async creerDefi({
    titre,
    description,
    objectif,
    recompensePoints,
    dateDebut,
    dateFin,
    typeDefi
  }) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `INSERT INTO gamification_defi (titre, description, objectif, recompense_points, date_debut, date_fin, type_defi)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [titre, description, objectif, recompensePoints, dateDebut, dateFin, typeDefi]
    );
    return rows[0];
  }

  static async listerDefis({ page = 1, limit = 20, statut, typeDefi, idUtilisateur } = {}) {
    const pool = (await import('../config/database.js')).default;

    let whereClause = '';
    const params = [];

    if (statut && statut !== 'TOUS') {
      params.push(statut);
      whereClause += ` WHERE statut = $${params.length}`;
    }

    if (typeDefi) {
      params.push(typeDefi);
      whereClause += whereClause ? ` AND type_defi = $${params.length}` : ` WHERE type_defi = $${params.length}`;
    }

    // When the caller supplies idUtilisateur (citizen app) we LEFT JOIN the
    // participation table so each defi row includes this user's progression &
    // statut. If there is no matching row, ma_progression falls back to 0 and
    // ma_statut is NULL — the frontend already handles `?? 0`.
    let query;
    if (idUtilisateur) {
      params.push(idUtilisateur);
      const userParamIdx = params.length;
      query = `
        SELECT
          gd.*,
          COALESCE(gpd.progression, 0) AS ma_progression,
          gpd.statut                   AS ma_statut,
          gpd.derniere_maj             AS ma_derniere_maj
        FROM gamification_defi gd
        LEFT JOIN gamification_participation_defi gpd
               ON gpd.id_defi = gd.id_defi
              AND gpd.id_utilisateur = $${userParamIdx}
        ${whereClause}
        ORDER BY gd.date_debut DESC
      `;
    } else {
      query = `SELECT * FROM gamification_defi${whereClause} ORDER BY date_debut DESC`;
    }

    const { rows } = params.length > 0
      ? await pool.query(query, params)
      : await pool.query(query);

    return rows;
  }

  static async creerParticipation({ idDefi, idUtilisateur }) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `INSERT INTO gamification_participation_defi (id_defi, id_utilisateur)
       VALUES ($1, $2)
       RETURNING *`,
      [idDefi, idUtilisateur]
    );
    return rows[0];
  }

  static async mettreAJourProgression({ idDefi, idUtilisateur, progression, statut }) {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      `UPDATE gamification_participation_defi
       SET progression = $1,
           statut = COALESCE($2, statut),
           derniere_maj = CURRENT_TIMESTAMP
       WHERE id_defi = $3 AND id_utilisateur = $4
       RETURNING *`,
      [progression, statut, idDefi, idUtilisateur]
    );
    return rows[0];
  }

  // Finds every *active* defi that matches `typeAction` (filtered by the
  // defi's own `date_debut`/`date_fin` window), UPSERTs a row in
  // gamification_participation_defi for this user, and increments
  // progression by 1. If progression reaches the defi's objectif the row is
  // flipped to statut='TERMINE'.
  //
  // Returns the rows *after* the update so the caller can know which defis
  // were completed in this call (for reward points + notifications).
  static async progresserDefisActifs({ client, idUtilisateur, typeAction }) {
    // INSERT ... ON CONFLICT needs a unique index on (id_defi, id_utilisateur)
    // but the existing schema doesn't have one — it only has a non-unique
    // composite index. So we do a two-step UPSERT manually inside the same
    // transaction.
    const { rows: defisActifs } = await client.query(
      `SELECT id_defi, objectif, recompense_points
       FROM gamification_defi
       WHERE type_action = $1
         AND CURRENT_DATE BETWEEN date_debut AND date_fin`,
      [typeAction]
    );

    const completed = [];
    for (const defi of defisActifs) {
      // Upsert participation row
      const { rows: existing } = await client.query(
        `SELECT id_participation, progression, statut
         FROM gamification_participation_defi
         WHERE id_defi = $1 AND id_utilisateur = $2
         LIMIT 1`,
        [defi.id_defi, idUtilisateur]
      );

      // Si déjà TERMINE, on n'incrémente plus.
      if (existing.length > 0 && existing[0].statut === 'TERMINE') {
        continue;
      }

      let newProgression;
      let nouveauStatut;
      if (existing.length === 0) {
        // Premier passage : on insère avec le bon statut dès le départ.
        // Avant cette correction, on insérait toujours en 'EN_COURS' même
        // quand `objectif === 1` ; le passage suivant lisait 'EN_COURS',
        // n'était pas court-circuité par le check TERMINE en amont, et
        // re-déclenchait la récompense → double crédit.
        newProgression = 1;
        nouveauStatut = newProgression >= defi.objectif ? 'TERMINE' : 'EN_COURS';
        await client.query(
          `INSERT INTO gamification_participation_defi
              (id_defi, id_utilisateur, progression, statut)
           VALUES ($1, $2, $3, $4)`,
          [defi.id_defi, idUtilisateur, newProgression, nouveauStatut]
        );
      } else {
        newProgression = (existing[0].progression || 0) + 1;
        nouveauStatut = newProgression >= defi.objectif ? 'TERMINE' : 'EN_COURS';
        await client.query(
          `UPDATE gamification_participation_defi
           SET progression = $1,
               statut = $2,
               derniere_maj = CURRENT_TIMESTAMP
           WHERE id_participation = $3`,
          [newProgression, nouveauStatut, existing[0].id_participation]
        );
      }

      // On ne pousse dans `completed` (et donc on n'attribue la
      // récompense / crée la notification) QUE lors de la transition vers
      // TERMINE — pas à chaque incrément ultérieur.
      const justCompleted =
        nouveauStatut === 'TERMINE' &&
        (existing.length === 0 || existing[0].statut !== 'TERMINE');
      if (justCompleted) {
        completed.push({
          id_defi: defi.id_defi,
          recompense_points: defi.recompense_points || 0,
        });
      }
    }

    return completed;
  }
}
