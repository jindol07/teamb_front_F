import { useEffect, useState } from 'react';
import { authFetch } from '../../../api/axios';

interface ReservationAvailabilityResponse {
  availableSpaceIds?: unknown;
  available_space_ids?: unknown;
}

interface ReservationAvailabilityState {
  availableSpaceIds: Set<number> | null;
  loading: boolean;
  error: string | null;
}

const formatDate = (date: Date | null) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const getAvailableSpaceIds = (response: unknown): Set<number> => {
  const payload = response as ReservationAvailabilityResponse;
  const values = Array.isArray(response)
    ? response
    : Array.isArray(payload?.availableSpaceIds)
      ? payload.availableSpaceIds
      : payload?.available_space_ids;

  if (!Array.isArray(values)) {
    throw new Error('자리 현황 응답 형식이 올바르지 않습니다.');
  }

  return new Set(
    values
      .map((value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return Number(value);
        if (value && typeof value === 'object') {
          const row = value as { parking_space_id?: unknown; parkingSpaceId?: unknown };
          return Number(row.parking_space_id ?? row.parkingSpaceId);
        }
        return Number.NaN;
      })
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  );
};

export function useReservationAvailability(
  startDate: Date | null,
  endDate: Date | null,
): ReservationAvailabilityState {
  const startDateString = formatDate(startDate);
  const endDateString = formatDate(endDate);
  const [availableSpaceIds, setAvailableSpaceIds] = useState<Set<number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDateString || !endDateString) {
      setAvailableSpaceIds(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const fetchAvailability = async () => {
      setAvailableSpaceIds(null);
      setLoading(true);
      setError(null);

      try {
        const apiBaseUrl = (
          import.meta.env.VITE_BOOT_API_BASE_URL_U || 'http://localhost/alpharking'
        ).replace(/\/$/, '');
        const query = new URLSearchParams({
          start_date_str: startDateString,
          end_date_str: endDateString,
        });
        const response = await authFetch(
          `${apiBaseUrl}/api/reservation/availability?${query.toString()}`,
          {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          },
        );
        const responseBody = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            responseBody?.message || `자리 현황 조회에 실패했습니다. (${response.status})`,
          );
        }

        setAvailableSpaceIds(getAvailableSpaceIds(responseBody));
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setAvailableSpaceIds(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : '선택한 날짜의 자리 현황을 조회하지 못했습니다.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchAvailability();
    return () => controller.abort();
  }, [startDateString, endDateString]);

  return { availableSpaceIds, loading, error };
}
