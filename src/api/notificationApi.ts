import { userApi } from './axios';

export interface Notification {
  notificationid: number;
  recipienttypecode: string;
  recipientid: number;
  notificationtypecode: string;
  message: string;
  targetid: number | null;
  isread: boolean;
  createdat: string;
}

interface NotificationListParams {
  recipienttypecode: string;
  recipientid: number;
}

interface UnreadCountResponse {
  count: number;
}

const notificationParams = ({ recipienttypecode, recipientid }: NotificationListParams) => ({
  recipienttypecode,
  recipientid,
});

/** userApi adds the logged-in user's JWT and uses the configured user backend. */
export const getUserNotifications = async (
  params: NotificationListParams,
): Promise<Notification[]> => {
  const response = await userApi.get<unknown[]>('/api/notifications', {
    params: notificationParams(params),
  });
  return response.data.map((item) => {
    const value = item as Record<string, unknown>;
    const readFlag = value.isread ?? value.is_read ?? value.readyN ?? value.ready_n ?? value.read_yn;
    return {
      notificationid: Number(value.notificationid ?? value.notification_id),
      recipienttypecode: params.recipienttypecode,
      recipientid: params.recipientid,
      notificationtypecode: String(value.notificationtypecode ?? value.notification_type_code ?? ''),
      message: String(value.message ?? value.content ?? ''),
      targetid: Number(
        value.targetid ?? value.reportId ?? value.report_id ??
        value.vehicleChangeRequestId ?? value.vehicle_change_request_id,
      ) || null,
      isread: readFlag === true || readFlag === 'Y',
      createdat: String(value.createdat ?? value.created_at ?? ''),
    };
  });
};

export const getUserUnreadNotificationCount = async (
  params: NotificationListParams,
): Promise<number> => {
  const response = await userApi.get<UnreadCountResponse>(
    '/api/notifications/unread/count',
    { params: notificationParams(params) },
  );
  return response.data.count;
};

export const markUserNotificationRead = async (
  notificationId: number,
  params: NotificationListParams,
): Promise<void> => {
  await userApi.post(
    `/api/notifications/${notificationId}/read`,
    null,
    { params: notificationParams(params) },
  );
};

const parseNumericId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

/** Resolve the recipient from identity claims; never fall back to a shared ID. */
const findProfileId = (value: unknown, depth = 0): number | null => {
  if (!value || typeof value !== 'object' || depth > 3) return null;
  const profile = value as Record<string, unknown>;
  const idKeys = ['office_id', 'officeId', 'userid', 'userId', 'user_id', 'recipientid', 'recipientId', 'id'];

  for (const key of idKeys) {
    const id = parseNumericId(profile[key]);
    if (id !== null) return id;
  }

  for (const key of ['data', 'office', 'user', 'profile']) {
    const id = findProfileId(profile[key], depth + 1);
    if (id !== null) return id;
  }
  return null;
};

export const getUserNotificationRecipientId = async (): Promise<number | null> => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const profileResponse = await userApi.get('/api/auth/office');
    const profileId = findProfileId(profileResponse.data);
    if (profileId !== null) return profileId;
  } catch {
    // Continue with token claims when the profile endpoint is unavailable.
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(normalizedPayload)) as Record<string, unknown>;

    const idClaims = [
      'office_id', 'officeId', 'officeid',
      'user_id', 'userId', 'userid',
      'recipient_id', 'recipientId', 'recipientid', 'id', 'sub',
    ];

    for (const key of idClaims) {
      const id = parseNumericId(claims[key]);
      if (id !== null) return id;
    }
  } catch {
    return null;
  }

  return null;
};
