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

// Phase 7 split (from Categories.jsx) — the category-tree state
// machine over the EXISTING src/utils/categoryTree.js pure helpers:
// expansion state (the tree starts fully expanded), tree building,
// visible-row flattening, sibling grouping, the parent-picker
// options (excluding the edited category and its descendants) and
// sibling reorder. Logic moved verbatim from the page.
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

  // Phase 6 — hierarchical tree view, built client-side from the
  // flat list (which includes inactive categories, unlike the
  // server's active-only tree endpoint). Subtree product counts
  // roll up from the flat list's direct productCount values.
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

  // Parent picker options: the whole tree, minus — when editing —
  // the category itself and its descendants (the server rejects
  // cycles with a 400; excluding them keeps the invalid choice
  // unselectable in the first place).
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
