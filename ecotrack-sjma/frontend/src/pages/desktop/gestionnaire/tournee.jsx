import { useCallback, useEffect, useMemo, useState } from "react";
import { StatCard } from "../../../components/common";
import TourneesActivesPanel from "../../../components/desktop/gestionnaire/TourneesActivesPanel";
import ToutesTourneesTable from "../../../components/desktop/gestionnaire/ToutesTourneesTable";
import { fetchTourneesStats } from "../../../services/tourneeService";
import "./tournee.css";

const STATUS_OPTIONS = [
	{ value: "TOUS", label: "Tous les statuts" },
	{ value: "EN_COURS", label: "En cours" },
	{ value: "PLANIFIEE", label: "Planifiee" },
	{ value: "TERMINEE", label: "Terminee" },
	{ value: "ANNULEE", label: "Annulee" },
];

export default function TourneePage() {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
	const [lastUpdated, setLastUpdated] = useState(null);
	const [statusFilter, setStatusFilter] = useState("TOUS");
	const [searchTerm, setSearchTerm] = useState("");
	const [refreshNonce, setRefreshNonce] = useState(0);
	const [stats, setStats] = useState(null);

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

	if (loading) {
		return <div className="tournees-page">Chargement des tournees...</div>;
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
				/>
			</div>
		</div>
	);
}
