import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEPRECATED_DIR = path.join(PROJECT_ROOT, 'src', 'deprecated');
const TRACKING_FILE = path.join(PROJECT_ROOT, '.antigravity', 'deprecated_tracking.json');
const RETENTION_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface TrackingEntry {
    originalPath: string;
    deprecatedPath: string;
    movedAt: string; // ISO string
}

function loadTracking(): TrackingEntry[] {
    if (!fs.existsSync(TRACKING_FILE)) {
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
    } catch (e) {
        console.error('Failed to parse tracking file, returning empty.', e);
        return [];
    }
}

function saveTracking(entries: TrackingEntry[]) {
    const dir = path.dirname(TRACKING_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(entries, null, 2));
}

function checkRetention() {
    console.log(`[Retention Policy] Checking files in ${DEPRECATED_DIR}...`);
    const entries = loadTracking();
    const activeEntries: TrackingEntry[] = [];
    const now = Date.now();

    let deletedCount = 0;

    entries.forEach(entry => {
        const fullDeprecatedPath = path.resolve(PROJECT_ROOT, entry.deprecatedPath);

        // Check if file still exists in deprecated folder
        if (!fs.existsSync(fullDeprecatedPath)) {
            console.log(`[Info] File ${entry.deprecatedPath} no longer exists (manual deletion or restore?`);
            // Do not keep in tracking if gone
            return;
        }

        const movedDate = new Date(entry.movedAt).getTime();
        const daysInDeprecated = (now - movedDate) / MS_PER_DAY;

        if (daysInDeprecated >= RETENTION_DAYS) {
            console.log(`[Delete] File ${entry.deprecatedPath} has been deprecated for ${daysInDeprecated.toFixed(1)} days. Deleting.`);
            try {
                fs.unlinkSync(fullDeprecatedPath);
                deletedCount++;
                // Also try to remove empty parent directories in deprecated
                // (Optional enhancement)
            } catch (err) {
                console.error(`[Error] Failed to delete ${fullDeprecatedPath}:`, err);
                activeEntries.push(entry); // Keep tracking if delete failed
            }
        } else {
            console.log(`[Keep] File ${entry.deprecatedPath} - ${daysInDeprecated.toFixed(1)}/${RETENTION_DAYS} days.`);
            activeEntries.push(entry);
        }
    });

    saveTracking(activeEntries);
    console.log(`[Retention Policy] Check complete. Deleted ${deletedCount} files.`);
}

// Check if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    checkRetention();
}

export { loadTracking, saveTracking, TrackingEntry };
