const RECENT_CLASSES_KEY = 'docentrack.profesor.recentClasses'

function readJsonArray(key) {
	try {
		const raw = localStorage.getItem(key)
		const parsed = raw ? JSON.parse(raw) : []
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

function saveJsonArray(key, value) {
	localStorage.setItem(key, JSON.stringify(value))
}

export function markProfesorClaseVisited(claseId) {
	if (!claseId) return
	const now = Date.now()
	const prev = readJsonArray(RECENT_CLASSES_KEY).filter(
		(row) => row?.id !== claseId,
	)
	const next = [{ id: claseId, visitedAt: now }, ...prev].slice(0, 20)
	saveJsonArray(RECENT_CLASSES_KEY, next)
}

export function getProfesorRecentClaseIds(limit = 5) {
	return readJsonArray(RECENT_CLASSES_KEY)
		.slice(0, limit)
		.map((row) => row?.id)
		.filter((id) => Number.isFinite(Number(id)))
}
