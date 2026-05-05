export const ADMIN_MENU = [
  { path: '/admin', icon: 'fa-tachometer-alt', label: 'Vue d\'ensemble', exact: true },
  { path: '/admin/users', icon: 'fa-users', label: 'Utilisateurs' },
  { path: '/admin/roles', icon: 'fa-user-shield', label: 'Rôles & Permissions' },
  { path: '/admin/conteneurs', icon: 'fa-dumpster', label: 'Conteneurs' },
  { path: '/admin/zones', icon: 'fa-map-marker-alt', label: 'Zones' },
  { path: '/admin/signalements', icon: 'fa-flag', label: 'Signalements' },
  { section: 'Système' },
  { path: '/admin/logs', icon: 'fa-clipboard-list', label: 'Logs d\'audit' },
  { path: '/admin/config', icon: 'fa-cog', label: 'Configuration' },
  { path: '/admin/monitoring', icon: 'fa-heartbeat', label: 'Monitoring' },
  { path: '/admin/alerts', icon: 'fa-bell', label: 'Alertes' },
];

export const GESTIONNAIRE_MENU = [
  { path: '/gestionnaire', icon: 'fa-tachometer-alt', label: 'Tableau de bord' },
  { path: '/gestionnaire/tournees', icon: 'fa-route', label: 'Tournées' },
  { path: '/gestionnaire/suivi', icon: 'fa-satellite-dish', label: 'Suivi temps réel' },
  { path: '/gestionnaire/zones', icon: 'fa-map', label: 'Zones' },
  { path: '/gestionnaire/conteneurs', icon: 'fa-dumpster', label: 'Conteneurs' },
  { path: '/gestionnaire/kpis', icon: 'fa-chart-pie', label: 'KPIs' },
  { section: 'Gestion' },
  { path: '/gestionnaire/signalements', icon: 'fa-flag', label: 'Signalements' },
  { path: '/gestionnaire/maintenance', icon: 'fa-wrench', label: 'Maintenance' },
  { path: '/gestionnaire/rapports', icon: 'fa-file-alt', label: 'Rapports' },
];
