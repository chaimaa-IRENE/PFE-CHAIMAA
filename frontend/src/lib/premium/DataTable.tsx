import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PremiumEmptyState } from "./EmptyState";
import { soundManager } from "./SoundManager";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface PremiumTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  filterable?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  className?: string;
}

export function PremiumTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchKeys,
  filterable = false,
  pageSize = 10,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Aucune donnée disponible pour le moment.",
  emptyActionLabel,
  onEmptyAction,
  className = "",
}: PremiumTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...data];

    if (search && searchKeys) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((k) => String(row[k] || "").toLowerCase().includes(q)),
      );
    } else if (search) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((v) => String(v || "").toLowerCase().includes(q)),
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        return sortDir === "asc"
          ? String(av || "").localeCompare(String(bv || ""))
          : String(bv || "").localeCompare(String(av || ""));
      });
    }

    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const pages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    soundManager.tap();
    const key = String(col.key);
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (data.length === 0) {
    return (
      <div className={`glass-strong rounded-3xl overflow-hidden ${className}`}>
        <PremiumEmptyState
          type="search"
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className={`glass-strong rounded-3xl overflow-hidden ${className}`}>
      {(searchable || filterable) && (
        <div className="p-4 flex items-center gap-3 border-b border-white/[0.03]">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 glass border border-white/[0.04] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/30 transition-all"
              />
            </div>
          )}
          {filterable && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowFilters(!showFilters);
                soundManager.tap();
              }}
              className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </motion.button>
          )}
          <div className="ml-auto text-xs text-slate-500">
            {filtered.length} {filtered.length > 1 ? "résultats" : "résultat"}
          </div>
        </div>
      )}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.03]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col)}
                      className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown
                        className={`w-3 h-3 transition-transform ${
                          sortKey === String(col.key)
                            ? "text-blue-400 " + (sortDir === "asc" ? "rotate-0" : "rotate-180")
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {pageData.map((row, i) => (
                <motion.tr
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3 text-sm text-slate-300 group-hover:text-slate-100 transition-colors"
                    >
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="p-4 flex items-center justify-between border-t border-white/[0.03]">
          <span className="text-xs text-slate-500">
            Page {page + 1} sur {pages}
          </span>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPage(Math.max(0, page - 1));
                soundManager.tap();
              }}
              disabled={page === 0}
              className="p-2 glass rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPage(Math.min(pages - 1, page + 1));
                soundManager.tap();
              }}
              disabled={page >= pages - 1}
              className="p-2 glass rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
