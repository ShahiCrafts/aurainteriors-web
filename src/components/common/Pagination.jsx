import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, pageSize = 10, totalItems, onPageChange, variant = "numbered", theme = "admin", disabled = false }) {

    if (!Number.isFinite(page) || !Number.isFinite(totalPages)) return null;

    const safeTotalPages = Math.floor(totalPages);
    if (safeTotalPages <= 1) return null;

    const clampedPage = Math.min(Math.max(Math.trunc(page), 1), safeTotalPages);
    const safeTotalItems = Number.isFinite(totalItems) ? Math.max(0, Math.trunc(totalItems)) : 0;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : 10;

    const goPrev = () => onPageChange(Math.max(1, clampedPage - 1));
    const goNext = () => onPageChange(Math.min(safeTotalPages, clampedPage + 1));
    const prevDisabled = disabled || clampedPage === 1;
    const nextDisabled = disabled || clampedPage === safeTotalPages;

    if (variant === "simple") {
        return (
            <div className="flex items-center justify-center gap-4">
                <button
                    type="button"
                    aria-label="Previous page"
                    onClick={goPrev}
                    disabled={prevDisabled}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>
                <span className="text-sm text-gray-600">
                    Page {clampedPage} of {safeTotalPages}
                </span>
                <button
                    type="button"
                    aria-label="Next page"
                    onClick={goNext}
                    disabled={nextDisabled}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    if (theme === "customer") {
        const visible = [...new Set([1, safeTotalPages, clampedPage - 1, clampedPage, clampedPage + 1])]
            .filter((n) => n >= 1 && n <= safeTotalPages)
            .sort((a, b) => a - b);
        const items = [];
        visible.forEach((n, i) => {
            if (i > 0 && n - visible[i - 1] > 1) {
                items.push(
                    <span key={`gap-${n}`} className="w-9 text-center text-xs text-neutral-300">
                        …
                    </span>
                );
            }
            items.push(
                <button
                    key={n}
                    type="button"
                    aria-current={n === clampedPage ? "page" : undefined}
                    onClick={() => onPageChange(n)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${n === clampedPage
                        ? 'bg-brand text-white'
                        : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-50 bg-white'
                        }`}
                >
                    {n}
                </button>
            );
        });

        const navButtonClass = "flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1A1714] border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white";
        return (
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    aria-label="Previous page"
                    onClick={goPrev}
                    disabled={prevDisabled}
                    className={navButtonClass}
                >
                    <ChevronLeft size={13} />
                    Previous
                </button>
                <div className="flex items-center gap-1">{items}</div>
                <button
                    type="button"
                    aria-label="Next page"
                    onClick={goNext}
                    disabled={nextDisabled}
                    className={navButtonClass}
                >
                    Next
                    <ChevronRight size={13} />
                </button>
            </div>
        );
    }

    const renderPageButtons = () => {
        const buttons = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, clampedPage - 2);
        let endPage = Math.min(safeTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    aria-current={i === clampedPage ? "page" : undefined}
                    onClick={() => onPageChange(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${i === clampedPage
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    const rangeStart = safeTotalItems === 0 ? 0 : (clampedPage - 1) * safePageSize + 1;
    const rangeEnd = Math.min(clampedPage * safePageSize, safeTotalItems);

    return (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
                Showing {rangeStart} to {rangeEnd} of {safeTotalItems}
            </p>
            <div className="flex items-center gap-1">
                <button
                    aria-label="Previous page"
                    onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
                    disabled={clampedPage === 1}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                {renderPageButtons()}
                <button
                    aria-label="Next page"
                    onClick={() => onPageChange(Math.min(safeTotalPages, clampedPage + 1))}
                    disabled={clampedPage === safeTotalPages}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
