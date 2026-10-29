import { useState, useMemo, useEffect } from "react";
import {
  buildCategoryTree,
  flattenVisibleTree,
  descendantIdSet,
  moveIdWithinSiblings,
  categoryParentId,
} from "../../../../utils/categoryTree";
import { useReorderCategories } from "../../../../hooks/catalog/useCatalogTan";
import { toast } from "../../../../lib/toast";
import formatError from "../../../../utils/errorHandler";

export default function useCategoryTree(categories, editingCategory) {
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [expandedInitialized, setExpandedInitialized] = useState(false);

  const reorderMutation = useReorderCategories();

  // The tree starts fully expanded so the whole hierarchy (and its
  // subtree counts) is visible on first load.
  useEffect(() => {
    if (!expandedInitialized && categories.length > 0) {
      const parentIds = new Set(
        categories.map((c) => categoryParentId(c)).filter(Boolean),
      );
      setExpandedCategories(
        categories
          .filter((c) => parentIds.has(String(c._id)))
          .map((c) => String(c._id)),
      );
      setExpandedInitialized(true);
    }
  }, [categories, expandedInitialized]);

  const toggleExpand = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const treeRoots = useMemo(() => buildCategoryTree(categories), [categories]);
  const treeRows = useMemo(
    () =>
      flattenVisibleTree(treeRoots, new Set(expandedCategories.map(String))),
    [treeRoots, expandedCategories],
  );
  const siblingIdsByParent = useMemo(() => {
    const map = new Map();
    const walk = (nodes, parentKey) => {
      map.set(
        parentKey,
        nodes.map((n) => String(n._id)),
      );
      nodes.forEach((n) => walk(n.children || [], String(n._id)));
    };
    walk(treeRoots, "root");
    return map;
  }, [treeRoots]);

  const handleMoveCategory = (category, direction) => {
    const parentKey = categoryParentId(category) || "root";
    const siblings = siblingIdsByParent.get(parentKey) || [];
    const next = moveIdWithinSiblings(siblings, category._id, direction);
    if (next === siblings) return;
    reorderMutation.mutate(next, {
      onError: (err) =>
        toast.error(formatError(err, "Failed to reorder categories")),
    });
  };

  const parentOptions = useMemo(() => {
    const excluded = editingCategory
      ? descendantIdSet(categories, editingCategory._id)
      : new Set();
    if (editingCategory) excluded.add(String(editingCategory._id));
    const options = [];
    const walk = (nodes, depth) => {
      nodes.forEach((node) => {
        if (!excluded.has(String(node._id)))
          options.push({ category: node, depth });
        walk(node.children || [], depth + 1);
      });
    };
    walk(treeRoots, 0);
    return options;
  }, [categories, treeRoots, editingCategory]);

  return {
    expandedCategories,
    toggleExpand,
    treeRoots,
    treeRows,
    siblingIdsByParent,
    parentOptions,
    handleMoveCategory,
    reorderMutation,
  };
}
