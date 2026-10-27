import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userApi from "../../api/userApi";
import { scopedAdminKey } from "../../lib/adminScope";

// FE-08: keys are scoped to the signed-in admin's id (read at call
// time) so one admin's cached users are never served to another.
export const USER_KEYS = {
    all: () => scopedAdminKey("users"),
    list: (params) => [...USER_KEYS.all(), "list", params],
    detail: (id) => [...USER_KEYS.all(), "detail", id],
};
// FE-55: mutations invalidate the narrowest keys that changed —
// the list prefix plus the mutated user's detail — never
// USER_KEYS.all(), whose prefix also matched every other user's
// detail. The old code also invalidated detail(id) redundantly
// after all(), a subset of the first call.
const userListKey = () => [...USER_KEYS.all(), "list"];


// Admin: Get all users
export const useUsers = (params = {}) => {
    return useQuery({
        queryKey: USER_KEYS.list(params),
        queryFn: () => userApi.getAll(params),
    });
};

// Admin: Get single user
export const useUser = (id, options = {}) => {
    return useQuery({
        queryKey: USER_KEYS.detail(id),
        queryFn: () => userApi.getById(id),
        enabled: !!id,
        ...options,
    });
};

// Admin: Update user status
export const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isActive, reason }) => userApi.updateStatus(id, isActive, reason),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: userListKey() });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
        },
    });
};

// Admin: Delete user
export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => userApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userListKey() });
        },
    });
};

// Admin: Reset user password
// FE-09: the mutation's variables hold the plaintext new password, so
// the call site evicts the settled mutation from the mutation cache
// once it settles (see Users.jsx handleResetPassword). Errors are surfaced by that
// call site's onError (formatted like its sibling mutations), so the
// FE-47 global mutation onError must not also toast — hence the
// suppress meta, the same convention as useSubmitContact.
export const useAdminResetPassword = () => {
    return useMutation({
        mutationFn: ({ id, password }) => userApi.resetPassword(id, password),
        meta: { suppressGlobalErrorToast: true },
    });
};
