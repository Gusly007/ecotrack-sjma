// Rôle du fichier : controller des défis et participations.
import { z } from 'zod';
import {
  creerDefi,
  listerDefis,
  creerParticipation,
  mettreAJourProgression
} from '../services/defis.service.js';

const defiSchema = z.object({
  titre: z.string().min(3),
  description: z.string().optional(),
  objectif: z.number().int().positive(),
  recompense_points: z.number().int().nonnegative().default(0),
  date_debut: z.coerce.date(),
  date_fin: z.coerce.date(),
  type_defi: z.string().default('INDIVIDUEL')
}).refine((data) => data.date_fin >= data.date_debut, {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['date_fin']
});

// Crée un défi après validation Zod.
export const creerDefiHandler = async (req, res, next) => {
  try {
    const payload = defiSchema.parse(req.body);
    const defi = await creerDefi({
      titre: payload.titre,
      description: payload.description,
      objectif: payload.objectif,
      recompensePoints: payload.recompense_points,
      dateDebut: payload.date_debut,
      dateFin: payload.date_fin,
      typeDefi: payload.type_defi
    });
    res.status(201).json(defi);
  } catch (error) {
    next(error);
  }
};

// Liste les défis existants.
export const listerDefisHandler = async (req, res, next) => {
  try {
    const defis = await listerDefis();
    res.json(defis);
  } catch (error) {
    next(error);
  }
};

const participationSchema = z.object({
  id_utilisateur: z.number().int().positive()
});

const participationParamsSchema = z.object({
  idDefi: z.coerce.number().int().positive()
});

// Crée une participation pour un utilisateur.
export const creerParticipationHandler = async (req, res, next) => {
  try {
    const payload = participationSchema.parse(req.body);
    const { idDefi } = participationParamsSchema.parse(req.params);
    const participation = await creerParticipation({
      idDefi,
      idUtilisateur: payload.id_utilisateur
    });
    res.status(201).json(participation);
  } catch (error) {
    next(error);
  }
};

const progressionSchema = z.object({
  progression: z.number().int().nonnegative(),
  statut: z.string().optional()
});

const progressionParamsSchema = z.object({
  idDefi: z.coerce.number().int().positive(),
  idUtilisateur: z.coerce.number().int().positive()
});

// Met à jour la progression d'un défi.
export const mettreAJourProgressionHandler = async (req, res, next) => {
  try {
    const payload = progressionSchema.parse(req.body);
    const { idDefi, idUtilisateur } = progressionParamsSchema.parse(req.params);
    const participation = await mettreAJourProgression({
      idDefi,
      idUtilisateur,
      progression: payload.progression,
      statut: payload.statut
    });
    res.json(participation);
  } catch (error) {
    next(error);
  }
};
