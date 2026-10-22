type Reservation = {
    status_code?: string;
    reservation_start_at?: string;
    reservation_end_at?: string;
};

const koreaDate = (date: Date) => new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(date);

// 서버의 시간대 없는 LocalDateTime 응답은 한국 시간으로 해석합니다.
const parseTime = (value: unknown) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return NaN;
    return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`);
};

export function reservationNotice(rows: unknown, now = new Date()): string | null {
    if (!Array.isArray(rows)) return null;
    const today = koreaDate(now);
    const dayStart = Date.parse(`${today}T00:00:00+09:00`);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const reservations = rows.filter((row): row is Reservation => typeof row === 'object' && row !== null)
        .filter((row) => row.status_code === 'CONFIRMED')
        .map((row) => ({ start: parseTime(row.reservation_start_at), end: parseTime(row.reservation_end_at) }))
        .filter((row) => Number.isFinite(row.start) && Number.isFinite(row.end) && row.end >= row.start)
        .sort((a, b) => a.start - b.start);
    if (reservations.some((row) => row.start < dayEnd && row.end >= dayStart)) {
        return '오늘 예약이 있어요. 예약 내역을 확인해 보세요.';
    }
    const next = reservations.find((row) => row.start > now.getTime());
    return next ? `${koreaDate(new Date(next.start))} 예약이 있어요. 예약 내역을 확인해 보세요.` : null;
}
