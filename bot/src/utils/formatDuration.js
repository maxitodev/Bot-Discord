/**
 * Format milliseconds to a readable duration string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "3:45" or "1:23:45")
 */
function formatDuration(ms) {
    if (!ms || isNaN(ms)) return "0:00";
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Create a progress bar for the current track
 * @param {number} current - Current position in ms
 * @param {number} total - Total duration in ms
 * @param {number} size - Size of the progress bar
 * @returns {string} Progress bar string
 */
function createProgressBar(current, total, size = 15) {
    const progress = Math.round((current / total) * size);
    const emptyProgress = size - progress;
    
    const progressText = "▬".repeat(progress);
    const emptyProgressText = "▬".repeat(emptyProgress);
    
    return `${progressText}🔘${emptyProgressText}`;
}

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
}

module.exports = {
    formatDuration,
    createProgressBar,
    truncateText
};
