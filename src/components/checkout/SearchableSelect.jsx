import { useState, useRef, useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";
import { ChevronDown, Search, Check } from "lucide-react";

export default function SearchableSelect({
  control,
  name,
  label,
  options,
  placeholder = "Select...",
  error,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <div className="space-y-1" ref={wrapperRef}>
          <label className="block text-[16px] text-neutral-500 mb-2 ml-1">
            {label}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={`w-full px-5 py-3 bg-white border rounded-md text-[16px] font-medium text-left flex items-center justify-between transition-all duration-300 focus:outline-none ${
                error
                  ? "border-red-400"
                  : open
                  ? "border-[#F27318]"
                  : "border-neutral-200"
              } ${value ? "text-[#1A1714]" : "text-neutral-300"}`}
            >
              <span className="truncate">{value || placeholder}</span>
              <ChevronDown
                size={18}
                className={`text-neutral-400 shrink-0 ml-2 transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div className="absolute z-30 mt-2 w-full bg-white border border-neutral-200 rounded-md shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-100">
                  <Search size={15} className="text-neutral-300 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${label?.toLowerCase() || ""}...`}
                    className="w-full text-[14px] font-medium text-[#1A1714] placeholder:text-neutral-300 outline-none bg-transparent"
                  />
                </div>
                <ul className="max-h-56 overflow-y-auto py-1">
                  {filtered.length === 0 ? (
                    <li className="px-4 py-3 text-[14px] text-neutral-400">
                      No results found
                    </li>
                  ) : (
                    filtered.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          onClick={() => {
                            onChange(opt);
                            setOpen(false);
                            setQuery("");
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] font-medium text-left hover:bg-[#FCFBFA] transition-colors"
                        >
                          <span
                            className={
                              opt === value
                                ? "text-[#F27318] font-bold"
                                : "text-[#1A1714]"
                            }
                          >
                            {opt}
                          </span>
                          {opt === value && (
                            <Check size={14} className="text-[#F27318]" />
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
          {error && (
            <p className="text-[14px] font-medium text-red-500 mt-1 ml-1">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}