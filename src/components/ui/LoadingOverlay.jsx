import useLoadingStore from "../../store/loadingStore";
import Skeleton from "../common/Skeleton";

export default function LoadingOverlay() {
    const { isLoading, message } = useLoadingStore();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/85 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-xl max-w-sm w-full mx-4">
                <Skeleton className="w-16 h-16 rounded-2xl" />
                <Skeleton className="w-3/4 h-5 rounded" />
                {message && (
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 font-dm-sans">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
