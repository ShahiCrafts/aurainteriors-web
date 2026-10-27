import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    subscribeNewsletter,
    unsubscribeNewsletter,
    getNewsletterSubscribers,
    sendTrendEmail,
    getNewsletterStats,
} from '../../api/newsletterApi';
import { toast } from 'react-toastify';
import { formatError } from '../../utils/errorHandler';
import { reportSendOutcome } from '../../utils/queuedSend';
import { scopedAdminKey } from '../../lib/adminScope';

// FE-08: the subscribers list and stats hold ADMIN data, so their
// keys are scoped to the signed-in admin's id (read at call time)
// instead of the previous identity-less ['newsletter-subscribers'] /
// ['newsletter-stats'].
export const NEWSLETTER_KEYS = {
    all: () => scopedAdminKey('newsletter'),
    subscribers: (params) => [...NEWSLETTER_KEYS.all(), 'subscribers', params],
    stats: () => [...NEWSLETTER_KEYS.all(), 'stats'],
};

/**
 * Hook to subscribe to newsletter
 */
export const useNewsletterSubscribe = () => {
    return useMutation({
        mutationFn: (data) => subscribeNewsletter(data),
        // FE-47: this hook toasts its own errors — opt out of the global toast.
        meta: { suppressGlobalErrorToast: true },
        onSuccess: (data) => {
            toast.success(data.message || 'Successfully subscribed to newsletter!');
        },
        onError: (error) => {
            const message = formatError(error);
            toast.error(message);
        },
    });
};

/**
 * Hook to unsubscribe from newsletter
 */
export const useNewsletterUnsubscribe = () => {
    return useMutation({
        mutationFn: (token) => unsubscribeNewsletter(token),
        // FE-47: this hook toasts its own errors — opt out of the global toast.
        meta: { suppressGlobalErrorToast: true },
        onSuccess: (data) => {
            toast.success(data.message || 'Successfully unsubscribed from newsletter');
        },
        onError: (error) => {
            const message = formatError(error);
            toast.error(message);
        },
    });
};

/**
 * Hook to get newsletter subscribers (Admin)
 */
export const useNewsletterSubscribers = (params) => {
    return useQuery({
        queryKey: NEWSLETTER_KEYS.subscribers(params),
        queryFn: () => getNewsletterSubscribers(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to send trend email (Admin)
 */
export const useSendTrendEmail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => sendTrendEmail(data),
        // FE-47: this hook toasts its own errors — opt out of the global toast.
        meta: { suppressGlobalErrorToast: true },
        onSuccess: (data) => {
            // FE-41: in queue mode (EMAIL_MODE=outbox) the 202 body carries
            // { jobId, queued:true } and no `successful` count — report the
            // queued state, poll the job, and report its real counts.
            // Inline bodies keep the guarded count message.
            void reportSendOutcome(data, { kind: 'newsletter', toast });
            queryClient.invalidateQueries({ queryKey: NEWSLETTER_KEYS.stats() });
        },
        onError: (error) => {
            const message = formatError(error);
            toast.error(message);
        },
    });
};

/**
 * Hook to get newsletter statistics (Admin)
 */
export const useNewsletterStats = () => {
    return useQuery({
        queryKey: NEWSLETTER_KEYS.stats(),
        queryFn: getNewsletterStats,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
