export const todayISO = () => new Date().toISOString().slice(0, 10);
export const hoursAgo = h => new Date(Date.now() - h * 3600 * 1000);
export const log = msg => console.log(`[forefront] ${msg}`);
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
