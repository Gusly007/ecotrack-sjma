import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, StatCard } from "../../../components/common";
import TourneesActivesPanel from "../../../components/desktop/gestionnaire/TourneesActivesPanel";
import ToutesTourneesTable from "../../../components/desktop/gestionnaire/ToutesTourneesTable";
import {
	optimizeTournee,
	previewOptimizeTournee,
	fetchTourneeCreationOptions,
	fetchTourneesStats,
} from "../../../services/tourneeService";
import "./tournee.css";

const STATUS_OPTIONS = [
	{ value: "TOUS", label: "Tous les statuts" },
	{ value: "EN_COURS", label: "En cours" },
	{ value: "PLANIFIEE", label: "Planifiee" },
	{ value: "TERMINEE", label: "Terminee" },
	{ value: "ANNULEE", label: "Annulee" },
];

function getTodayIsoDate() {
	return new Date().toISOString().slice(0, 10);
}

function formatDuration(minutes) {
	const total = Number(minutes || 0);
	const h = Math.floor(total / 60);
	const m = total % 60;
	if (h <= 0) {
		return `${m} min`;
	}
	return `${h}h ${String(m).padStart(2, "0")}min`;
}

function getErrorMessage(error, fallback) {
	return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

export default function TourneePage() {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
	const [lastUpdated, setLastUpdated] = useState(null);
	const [statusFilter, setStatusFilter] = useState("TOUS");
	const [searchTerm, setSearchTerm] = useState("");
	const [refreshNonce, setRefreshNonce] = useState(0);
	const [stats, setStats] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [createError, setCreateError] = useState("");
	const [creationLoading, setCreationLoading] = useState(false);
	const [creationSubmitting, setCreationSubmitting] = useState(false);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState("");
	const [previewData, setPreviewData] = useState(null);
	const [creationOptions, setCreationOptions] = useState({
		zones: [],
		agents: [],
		vehicles: [],
	});
	const [createForm, setCreateForm] = useState({
		date_tournee: getTodayIsoDate(),
		id_zone: "",
		id_agent: "",
		id_vehicule: "",
		seuil_remplissage: "70",
		algorithme: "2opt",
	});

	const loadStats = useCallback(async (isRefresh = false) => {
		try {
			if (isRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			const statsData = await fetchTourneesStats();
			setStats(statsData);
			setLastUpdated(new Date());
			setRefreshNonce((prev) => prev + 1);
		} catch (err) {
			// Silent fail to preserve last valid state in UI.
		} finally {
			if (isRefresh) {
				setRefreshing(false);
			} else {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		loadStats(false);
	}, [loadStats]);

	useEffect(() => {
		if (!autoRefreshEnabled) {
			return undefined;
		}

		const intervalId = setInterval(() => {
			if (!loading && !refreshing) {
				loadStats(true);
			}
		}, 60000);

		return () => clearInterval(intervalId);
	}, [autoRefreshEnabled, loadStats, loading, refreshing]);

	const statCards = useMemo(() => {
		const tourneesStats = (stats || {}).tournees || {};
		const totalApi = Number(tourneesStats.total || 0);
		const activeApi = Number(tourneesStats.en_cours || 0);
		const completed = Number(tourneesStats.terminees || 0);
		const delayed = Math.max(0, activeApi - completed);

		return [
			{
				icon: "fa-route",
				iconColor: "green",
				label: "Total tournees",
				value: String(totalApi),
				change: "Toutes periodes",
			},
			{
				icon: "fa-truck",
				iconColor: "blue",
				label: "Tournees actives",
				value: String(activeApi),
				change: "Mise a jour temps reel",
			},
			{
				icon: "fa-check-circle",
				iconColor: "orange",
				label: "Tournees terminees",
				value: String(completed),
				change: "Historique courant",
			},
			{
				icon: "fa-clock",
				iconColor: "red",
				label: "Tournees en retard",
				value: String(delayed),
				change: delayed > 0 ? "Action requise" : "Rien a signaler",
				changeType: delayed > 0 ? "down" : "",
			},
		];
	}, [stats]);

	const loadCreationOptions = useCallback(async () => {
		try {
			setCreationLoading(true);
			setCreateError("");
			const options = await fetchTourneeCreationOptions();
			setCreationOptions(options);
		} catch (error) {
			setCreateError(getErrorMessage(error, "Impossible de charger les listes (tournees, zones, agents)."));
		} finally {
			setCreationLoading(false);
		}
	}, []);

	const openCreateModal = useCallback(async () => {
		setModalOpen(true);
		await loadCreationOptions();
	}, [loadCreationOptions]);

	const closeCreateModal = useCallback(() => {
		setModalOpen(false);
		setCreateError("");
		setPreviewError("");
		setPreviewData(null);
		setCreateForm({
			date_tournee: getTodayIsoDate(),
			id_zone: "",
			id_agent: "",
			id_vehicule: "",
			seuil_remplissage: "70",
			algorithme: "2opt",
		});
	}, []);

	const handleFieldChange = useCallback((event) => {
		const { name, value } = event.target;
		setPreviewError("");
		setCreateForm((prev) => ({
			...prev,
			[name]: value,
		}));
	}, []);

	const canPreview = Boolean(
		modalOpen
		&& createForm.date_tournee
		&& createForm.id_zone
		&& createForm.id_agent
		&& createForm.id_vehicule
		&& createForm.algorithme
		&& createForm.seuil_remplissage !== ""
	);

	useEffect(() => {
		if (!canPreview || creationSubmitting) {
			setPreviewData(null);
			if (!creationSubmitting) {
				setPreviewLoading(false);
			}
			return undefined;
		}

		const timeoutId = setTimeout(async () => {
			try {
				setPreviewLoading(true);
				setPreviewError("");

				const payload = {
					date_tournee: createForm.date_tournee,
					id_zone: Number(createForm.id_zone),
					id_agent: Number(createForm.id_agent),
					id_vehicule: Number(createForm.id_vehicule),
					seuil_remplissage: Number(createForm.seuil_remplissage),
					algorithme: createForm.algorithme,
				};

				const preview = await previewOptimizeTournee(payload);
				setPreviewData(preview || null);
			} catch (error) {
				setPreviewData(null);
				setPreviewError(getErrorMessage(error, "Impossible de previsualiser l'itineraire."));
			} finally {
				setPreviewLoading(false);
			}
		}, 350);

		return () => clearTimeout(timeoutId);
	}, [canPreview, createForm, creationSubmitting, modalOpen]);

	const handleCreateSubmit = useCallback(async (event) => {
		event.preventDefault();
		setCreateError("");

		if (!createForm.date_tournee || !createForm.id_zone || !createForm.id_agent || !createForm.id_vehicule) {
			setCreateError("Date, zone, agent et véhicule sont obligatoires.");
			return;
		}

		try {
			setCreationSubmitting(true);

			const payload = {
				date_tournee: createForm.date_tournee,
				id_zone: Number(createForm.id_zone),
				id_agent: Number(createForm.id_agent),
				id_vehicule: Number(createForm.id_vehicule),
				seuil_remplissage: Number(createForm.seuil_remplissage),
				algorithme: createForm.algorithme,
			};

			await optimizeTournee(payload);
			closeCreateModal();
			await loadStats(true);
		} catch (error) {
			setCreateError(getErrorMessage(error, "Impossible de créer la tournée optimisée."));
		} finally {
			setCreationSubmitting(false);
		}
	}, [closeCreateModal, createForm, loadStats]);

	if (loading) {
		return <div className="tournees-page">Chargement des tournees...</div>;
	}

	const renderModal = ()=>{
		return(
			<Modal
				isOpen={modalOpen}
				onClose={closeCreateModal}
				title="Créer une tournée optimisée"
				headerIcon="fa-route"
				headerColor="#4CAF50"
				size="lg"
				showFooter={false}
			>
				<form className="tournee-modal-form" onSubmit={handleCreateSubmit}>
					<div className="tournee-modal-row">
						<div className="tournee-modal-field">
							<label htmlFor="date_tournee">Date</label>
							<input
								id="date_tournee"
								name="date_tournee"
								type="date"
								value={createForm.date_tournee}
								onChange={handleFieldChange}
								required
								disabled={creationLoading || creationSubmitting}
							/>
						</div>

						<div className="tournee-modal-field">
							<label htmlFor="id_zone">Zone</label>
							<select
								id="id_zone"
								name="id_zone"
								value={createForm.id_zone}
								onChange={handleFieldChange}
								required
								disabled={creationLoading || creationSubmitting}
							>
								<option value="">Sélectionner une zone</option>
								{creationOptions.zones.map((zone) => (
									<option key={zone.id_zone} value={zone.id_zone}>
										{zone.nom} ({zone.code})
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="tournee-modal-row">
						<div className="tournee-modal-field">
							<label htmlFor="id_agent">Agent</label>
							<select
								id="id_agent"
								name="id_agent"
								value={createForm.id_agent}
								onChange={handleFieldChange}
								required
								disabled={creationLoading || creationSubmitting}
							>
								<option value="">Sélectionner un agent</option>
								{creationOptions.agents.map((agent) => (
									<option key={agent.id_utilisateur} value={agent.id_utilisateur}>
										{agent.prenom} {agent.nom || ""} ({agent.email})
									</option>
								))}
							</select>
						</div>

						<div className="tournee-modal-field">
							<label htmlFor="id_vehicule">Véhicule</label>
							<select
								id="id_vehicule"
								name="id_vehicule"
								value={createForm.id_vehicule}
								onChange={handleFieldChange}
								required
								disabled={creationLoading || creationSubmitting}
							>
								<option value="">Sélectionner un véhicule</option>
								{creationOptions.vehicles.map((vehicle) => (
									<option key={vehicle.id_vehicule} value={vehicle.id_vehicule}>
										{vehicle.numero_immatriculation} ({vehicle.modele || "N/A"})
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="tournee-modal-row">
						<div className="tournee-modal-field">
							<label htmlFor="seuil_remplissage">Seuil de remplissage (%)</label>
							<input
								id="seuil_remplissage"
								name="seuil_remplissage"
								type="number"
								min="0"
								max="100"
								value={createForm.seuil_remplissage}
								onChange={handleFieldChange}
								required
								disabled={creationSubmitting}
							/>
						</div>

						<div className="tournee-modal-field">
							<label htmlFor="algorithme">Algorithme d'optimisation</label>
							<select
								id="algorithme"
								name="algorithme"
								value={createForm.algorithme}
								onChange={handleFieldChange}
								required
								disabled={creationSubmitting}
							>
								<option value="nearest_neighbor">Nearest Neighbor</option>
								<option value="2opt">2-Opt (plus rapide)</option>
							</select>
						</div>
					</div>

					{creationLoading && <p className="tournee-modal-info">Chargement des références...</p>}
					{previewLoading && canPreview && (
						<p className="tournee-modal-info">Calcul de l'itineraire optimise...</p>
					)}
					{previewData?.optimisation && (
						<div className="tournee-preview-box">
							<h4>Apercu de l'optimisation</h4>
							<div className="tournee-preview-grid">
								<div className="tournee-preview-item">
									<span>Distance optimisee</span>
									<strong>{Number(previewData.optimisation.distance_prevue_km || 0).toFixed(2)} km</strong>
								</div>
								<div className="tournee-preview-item">
									<span>Distance manuelle</span>
									<strong>{Number(previewData.optimisation.distance_originale_km || 0).toFixed(2)} km</strong>
								</div>
								<div className="tournee-preview-item">
									<span>Duree optimisee</span>
									<strong>{formatDuration(previewData.optimisation.duree_prevue_min)}</strong>
								</div>
								<div className="tournee-preview-item">
									<span>Duree manuelle</span>
									<strong>{formatDuration(previewData.optimisation.duree_originale_min)}</strong>
								</div>
								<div className="tournee-preview-item">
									<span>Carburant optimise</span>
									<strong>{Number(previewData.optimisation.carburant_prevu_l || 0).toFixed(2)} L</strong>
								</div>
								<div className="tournee-preview-item">
									<span>Carburant economise</span>
									<strong>{Number(previewData.optimisation.carburant_economise_l || 0).toFixed(2)} L</strong>
								</div>
							</div>

							<p className="tournee-preview-gain">
								Gain estime: <strong>{Number(previewData.optimisation.gain_pct || 0).toFixed(2)}%</strong>
								{" "}sur {previewData.optimisation.nb_conteneurs || 0} conteneurs
							</p>

							{Array.isArray(previewData.etapes_preview) && previewData.etapes_preview.length > 0 && (
								<div className="tournee-preview-steps">
									<p>Itineraire optimise (10 premieres etapes)</p>
									<ol>
										{previewData.etapes_preview.slice(0, 10).map((etape) => (
											<li key={`${etape.sequence}-${etape.id_conteneur}`}>
												#{etape.sequence} - {etape.uid || `Conteneur ${etape.id_conteneur}`}
												{" "}({Number(etape.fill_level || 0).toFixed(1)}%)
											</li>
										))}
									</ol>
								</div>
							)}
						</div>
					)}
					{previewError && <p className="tournee-modal-error">{previewError}</p>}
					{createError && <p className="tournee-modal-error">{createError}</p>}

					<div className="tournee-modal-actions">
						<button
							type="button"
							className="btn-secondary"
							onClick={closeCreateModal}
							disabled={creationSubmitting}
						>
							Annuler
						</button>
						<button
							type="submit"
							className="btn-primary"
							disabled={creationLoading || creationSubmitting}
						>
							{creationSubmitting ? "Optimisation..." : "Créer et optimiser"}
						</button>
					</div>
				</form>
			</Modal>
		)
	}

	return (
		<div className="tournees-page">
			<div className="page-header">
				<div className="page-title-wrap">
					<h2>Gestion des tournees</h2>
					<p>Suivez les tournees actives et consultez l'historique des operations.</p>
				</div>

				<div className="dashboard-toolbar">
					<button
						type="button"
						className="createtourneebtn"
						onClick={openCreateModal}
					>
						Creer une tournee
					</button>

					<button
						type="button"
						className={`auto-refresh-btn ${autoRefreshEnabled ? "enabled" : ""}`}
						onClick={() => setAutoRefreshEnabled((prev) => !prev)}
					>
						<i className={`fas ${autoRefreshEnabled ? "fa-toggle-on" : "fa-toggle-off"}`}></i>
						Auto-refresh 60s
					</button>

					<button
						type="button"
						className="refresh-btn"
						onClick={() => loadStats(true)}
						disabled={refreshing || loading}
					>
						<i className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`}></i>
						{refreshing ? "Actualisation..." : "Rafraichir"}
					</button>

					{lastUpdated && (
						<span className="last-updated">
							Maj: {lastUpdated.toLocaleTimeString("fr-FR")}
						</span>
					)}
					
				</div>
			</div>

			<div className="stats-grid">
				{statCards.map((stat) => (
					<StatCard
						key={stat.label}
						icon={stat.icon}
						iconColor={stat.iconColor}
						label={stat.label}
						value={stat.value}
						change={stat.change}
						changeType={stat.changeType}
					/>
				))}
			</div>

			<div className="tournees-filters">
				<input
					type="text"
					placeholder="Rechercher par tournee, agent, zone, vehicule..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>

				<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
					{STATUS_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<div className="tournees-grid">
				<TourneesActivesPanel pageSize={6} refreshNonce={refreshNonce} />
				<ToutesTourneesTable
					statusFilter={statusFilter}
					searchTerm={searchTerm}
					pageSize={12}
					refreshNonce={refreshNonce}
					onActionSuccess={() => loadStats(true)}
				/>
			</div>

			{renderModal()}
		</div>
	);
}
