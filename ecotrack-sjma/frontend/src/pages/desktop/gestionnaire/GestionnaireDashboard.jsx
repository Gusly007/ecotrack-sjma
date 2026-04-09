import { useCallback, useEffect, useMemo, useState } from "react";
import { StatCard } from "../../../components/common";
import AlertesUrgentesPanel from "../../../components/desktop/gestionnaire/AlertesUrgentesPanel";
import CollectesAujourdhuiPanel from "../../../components/desktop/gestionnaire/CollectesAujourdhuiPanel";
import TourneesActivesPanel from "../../../components/desktop/gestionnaire/TourneesActivesPanel";
import { fetchDashboardData } from "../../../services/dashboardService";
import "./GestionnaireDashboard.css";

export default function GestionnaireDashboard() {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
	const [refreshNonce, setRefreshNonce] = useState(0);
	const [dashboardData, setDashboardData] = useState({
		stats: null,
		activeTournees: [],
		notifications: [],
	});
	const [lastUpdated, setLastUpdated] = useState(null);

	const loadDashboard = useCallback(async (isRefresh = false) => {
		try {
			if (isRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			const data = await fetchDashboardData();
			setDashboardData(data);
			setRefreshNonce((prev) => prev + 1);
			setLastUpdated(new Date());
		} catch (err) {
			// Silent fail to keep dashboard visible with last valid data
		} finally {
			if (isRefresh) {
				setRefreshing(false);
			} else {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		let isMounted = true;
		if (isMounted) {
			loadDashboard(false);
		}

		return () => {
			isMounted = false;
		};
	}, [loadDashboard]);

	useEffect(() => {
		if (!autoRefreshEnabled) {
			return undefined;
		}

		const intervalId = setInterval(() => {
			if (!loading && !refreshing) {
				loadDashboard(true);
			}
		}, 60000);

		return () => clearInterval(intervalId);
	}, [autoRefreshEnabled, loadDashboard, loading, refreshing]);

	const statCards = useMemo(() => {
		const stats = dashboardData.stats || {};
		const tournees = stats.tournees || {};
		const collectes30j = stats.collectes_30j || {};
		const totalTournees = Number(tournees.total || 0);
		const tourneesEnCours = Number(tournees.en_cours || 0);
		const conteneursCollectes = Number(collectes30j.conteneurs_collectes || 0);
		const totalCollectes = Number(collectes30j.total_collectes || 0);
		const alertesCount = dashboardData.notifications.length;

		return [
			{
				icon: "fa-route",
				iconColor: "green",
				label: "Tournees actives",
				value: `${tourneesEnCours}/${totalTournees}`,
				change: "Mise a jour temps reel",
			},
			{
				icon: "fa-users",
				iconColor: "blue",
				label: "Agents terrain",
				value: `${tourneesEnCours}`,
				change: `${totalTournees} tournees planifiees`,
			},
			{
				icon: "fa-trash-alt",
				iconColor: "orange",
				label: "Conteneurs collectes",
				value: `${conteneursCollectes}`,
				change: `${totalCollectes} collectes (30j)`,
			},
			{
				icon: "fa-exclamation-triangle",
				iconColor: "red",
				label: "Alertes en attente",
				value: `${alertesCount}`,
				change: alertesCount > 0 ? "A traiter" : "Aucune alerte",
				changeType: alertesCount > 0 ? "down" : "",
			},
		];
	}, [dashboardData]);

	const alertesUrgentes = useMemo(() => {
		if (!dashboardData.notifications.length) {
			return [];
		}

		return dashboardData.notifications.slice(0, 5).map((notification) => ({
			text: notification.titre || notification.corps || "Alerte systeme",
			level: notification.est_lu ? "info" : "warning",
			icon: notification.est_lu ? "fa-info-circle" : "fa-exclamation-circle",
			color: notification.est_lu ? "#2196F3" : "#FF9800",
		}));
	}, [dashboardData.notifications]);

	const collectesParZone = useMemo(() => {
		const tourneesActives = dashboardData.activeTournees || [];
		if (!tourneesActives.length) {
			return [];
		}

		const zoneMap = tourneesActives.reduce((acc, tournee) => {
			const zoneLabel = tournee.zone_code || tournee.zone_nom || "N/A";
			const total = Number(tournee.total_etapes || 0);
			const done = Number(tournee.etapes_collectees || 0);
			const progression = total > 0 ? Math.round((done / total) * 100) : 0;

			if (!acc[zoneLabel]) {
				acc[zoneLabel] = { label: zoneLabel, progressions: [] };
			}

			acc[zoneLabel].progressions.push(progression);
			return acc;
		}, {});

		return Object.values(zoneMap).slice(0, 5).map((zone) => {
			const totalProgression = zone.progressions.reduce((sum, current) => sum + current, 0);
			const avgProgression = Math.round(totalProgression / zone.progressions.length);
			return {
				label: zone.label,
				height: `${Math.max(avgProgression, 10)}%`,
				color: avgProgression < 50 ? "#FF9800" : undefined,
			};
		});
	}, [dashboardData.activeTournees]);

	if (loading) {
		return <div className="gestionnaire-dashboard">Chargement du dashboard...</div>;
	}

	return (
		<div className="gestionnaire-dashboard">
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
					onClick={() => loadDashboard(true)}
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

			<div className="panel-grid">
				<AlertesUrgentesPanel alertes={alertesUrgentes} />
				<CollectesAujourdhuiPanel collectesParZone={collectesParZone} />
			</div>

			<TourneesActivesPanel pageSize={6} refreshNonce={refreshNonce} />
		</div>
	);
}