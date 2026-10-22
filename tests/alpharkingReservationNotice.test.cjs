const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/components/alpharkingReservationNotice.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = { exports: {} };
new Function('exports', compiled.outputText)(loaded.exports);
const { reservationNotice } = loaded.exports;
const now = new Date('2026-10-22T10:00:00+09:00');
const row = (start, end, status = 'CONFIRMED') => ({
    reservation_start_at: start, reservation_end_at: end, status_code: status
});

test('오늘과 겹치는 여러 날짜 예약도 오늘 안내로 선택', () => {
    assert.match(reservationNotice([row('2026-10-21T12:00:00', '2026-10-23T12:00:00')], now), /^오늘 예약/);
});
test('취소·과거 예약을 제외하고 가장 가까운 확정 예약 선택', () => {
    assert.match(reservationNotice([
        row('2026-10-22T12:00:00', '2026-10-22T13:00:00', 'CANCELED'),
        row('2026-10-21T12:00:00', '2026-10-21T13:00:00'),
        row('2026-10-25T12:00:00', '2026-10-25T13:00:00'),
        row('2026-10-23T12:00:00', '2026-10-23T13:00:00')
    ], now), /^2026-10-23 예약/);
});
test('UTC 날짜가 전날이어도 한국 날짜로 오늘을 판단', () => {
    assert.match(reservationNotice([row('2026-10-21T16:00:00Z', '2026-10-21T17:00:00Z')], now), /^오늘 예약/);
});
test('내일 0시 시작은 오늘 예약에 포함하지 않음', () => {
    assert.match(reservationNotice([row('2026-10-23T00:00:00', '2026-10-23T12:00:00')], now), /^2026-10-23 예약/);
});
test('빈 목록과 잘못된 날짜는 개인 안내를 만들지 않음', () => {
    for (const data of [[], null, {}, [row('invalid', 'invalid')], [null]]) {
        assert.equal(reservationNotice(data, now), null);
    }
});
