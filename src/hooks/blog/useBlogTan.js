import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import blogApi from "../../api/blogApi";

const BLOG_KEYS = {
  all: ["blogs"],
  list: (params) => [...BLOG_KEYS.all, "list", params],
  detail: (id) => [...BLOG_KEYS.all, "detail", id],
  categories: () => [...BLOG_KEYS.all, "categories"],
  popular: (limit) => [...BLOG_KEYS.all, "popular", limit],
  featured: (limit) => [...BLOG_KEYS.all, "featured", limit],
  related: (id, limit) => [...BLOG_KEYS.all, "related", id, limit],
};

export const useBlogs = (params = {}) => {
  return useQuery({
    queryKey: BLOG_KEYS.list(params),
    queryFn: () => blogApi.getAll(params),
  });
};

export const useBlog = (id, options = {}) => {
  return useQuery({
    queryKey: BLOG_KEYS.detail(id),
    queryFn: () => blogApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

export const useBlogCategories = () => {
  return useQuery({
    queryKey: BLOG_KEYS.categories(),
    queryFn: () => blogApi.getCategories(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const usePopularBlogs = (limit = 5) => {
  return useQuery({
    queryKey: BLOG_KEYS.popular(limit),
    queryFn: () => blogApi.getPopular(limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFeaturedBlogs = (limit = 3) => {
  return useQuery({
    queryKey: BLOG_KEYS.featured(limit),
    queryFn: () => blogApi.getFeatured(limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRelatedBlogs = (id, limit = 3) => {
  return useQuery({
    queryKey: BLOG_KEYS.related(id, limit),
    queryFn: () => blogApi.getRelated(id, limit),
    enabled: !!id,
  });
};

export const useToggleBlogLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => blogApi.toggleLike(id),
    onSuccess: (data, id) => {
      // FE-55: the old code invalidated BLOG_KEYS.all for a single
      // like — every blog list, detail, categories, popular and
      // featured query refetched. The server returns the
      // authoritative count ({ data: { likes } }, blog.controller
      // likeBlog), so patch the affected post directly in every
      // cached blog surface instead and invalidate nothing.
      // Surfaces whose payload has no post collection (categories,
      // stats, sources) are returned untouched by the updater.
      const likes = data?.data?.likes;
      if (!Number.isFinite(likes)) {
        // No usable count in the response: a direct update is not
        // safe, so fall back to the narrowest invalidation that
        // covers the visible like counts — this post's detail and
        // the blog lists — never the whole domain.
        queryClient.invalidateQueries({ queryKey: BLOG_KEYS.detail(id) });
        queryClient.invalidateQueries({ queryKey: [...BLOG_KEYS.all, "list"] });
        return;
      }
      const isTarget = (post) => post && (post._id === id || post.slug === id);
      const patchPost = (post) => (isTarget(post) ? { ...post, likes } : post);
      const patchCache = (old) => {
        if (!old?.data) return old;
        if (old.data.blog) {
          return isTarget(old.data.blog)
            ? { ...old, data: { ...old.data, blog: patchPost(old.data.blog) } }
            : old;
        }
        if (Array.isArray(old.data.blogs)) {
          return old.data.blogs.some(isTarget)
            ? {
                ...old,
                data: { ...old.data, blogs: old.data.blogs.map(patchPost) },
              }
            : old;
        }
        return old;
      };
      queryClient.setQueriesData({ queryKey: BLOG_KEYS.all }, patchCache);
    },
  });
};

export const useBlogSources = () => {
  return useQuery({
    queryKey: [...BLOG_KEYS.all, "sources"],
    queryFn: () => blogApi.getSources(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
};

export const useBlogStats = () => {
  return useQuery({
    queryKey: [...BLOG_KEYS.all, "stats"],
    queryFn: () => blogApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};
