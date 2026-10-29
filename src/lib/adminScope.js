import useAuthStore from "../store/authStore";

export const adminScope = () => useAuthStore.getState().user?._id || "guest";

/** Base key for an admin resource: [resource, currentUserId]. */
export const scopedAdminKey = (resource) => [resource, adminScope()];
