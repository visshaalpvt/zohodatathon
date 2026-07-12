/**
 * Datastore fallbacks for CrimeVision backend
 */

const defaultOfficers = [
  { ROWID: "1", name: "DGP Alok Kumar", role: "Director General", status: "Active", district: "State HQ" },
  { ROWID: "2", name: "SP N. Shashi Kumar", role: "Superintendent of Police", status: "Active", district: "Bengaluru City" },
  { ROWID: "3", name: "ASP Harish Pandey", role: "Assistant Superintendent", status: "Active", district: "Mysuru City" }
];

const defaultWorkspace = [
  { ROWID: "ws-1", type: "note", title: "Investigate Cyber surge", content: "Check ATM fraud numbers in Bengaluru City for anomalies.", timestamp: new Date().toISOString() },
  { ROWID: "ws-2", type: "bookmark", title: "Mysuru Profile", link: "/district/Mysuru%20Dist", timestamp: new Date().toISOString() }
];

const defaultReports = {};

const defaultCustomAlerts = [];

const defaultNotifications = [
  { id: "notif-1", title: "Cyber Spike", message: "Bengaluru City cyber cases exceeded weekly moving average limit.", severity: "critical", unread: true, timestamp: new Date().toISOString() },
  { id: "notif-2", title: "New Briefing", message: "State-wide summary compiled. Ready for download.", severity: "info", unread: true, timestamp: new Date().toISOString() }
];

module.exports = {
  defaultOfficers,
  defaultWorkspace,
  defaultReports,
  defaultCustomAlerts,
  defaultNotifications
};
