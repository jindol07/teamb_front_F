import { useSyncExternalStore } from 'react';

export const COMPACT_CHATBOT_QUERY = '(max-width: 768px), (hover: none)';
const subscribe = (notify: () => void) => {
    const media = window.matchMedia(COMPACT_CHATBOT_QUERY);
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
};
const snapshot = () => window.matchMedia(COMPACT_CHATBOT_QUERY).matches;

export function useCompactChatbot() {
    return useSyncExternalStore(subscribe, snapshot, () => false);
}
