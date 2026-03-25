import React, { useMemo, useState } from "react";
import CatalogItem from "./CatalogItem.jsx";

const tabs = ["Bundles", "Weapon Skins", "Diamonds", "Emotes"];

export default function LeftCatalog({ items, onInitiate, searchQuery }) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const filteredItems = useMemo(() => {
    const it = items ?? [];
    const q = (searchQuery ?? "").trim().toLowerCase();
    return it.filter((x) => {
      if (x.category !== activeTab) return false;
      if (!q) return true;
      const text = `${x.title ?? ""} ${x.badge ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [items, activeTab, searchQuery]);

  const totalPages = useMemo(() => {
    const len = filteredItems?.length ?? 0;
    return Math.max(1, Math.ceil(len / pageSize));
  }, [filteredItems]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (filteredItems ?? []).slice(start, start + pageSize);
  }, [filteredItems, page]);

  function goToPage(next) {
    const clamped = Math.min(totalPages, Math.max(1, next));
    setPage(clamped);
  }

  // If user searches, always snap back to page 1.
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  return (
    <section className="ffg-left">
      <div className="ffg-tabs" role="tablist" aria-label="Categories">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={"ffg-tab" + (activeTab === t ? " is-active" : "")}
            onClick={() => {
              setActiveTab(t);
              setPage(1);
            }}
            role="tab"
            aria-selected={activeTab === t}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="ffg-grid" aria-label="Gift items">
        {pagedItems.map((it) => (
          <CatalogItem
            key={it.id}
            item={it}
            onGift={(customDiamonds) => onInitiate(it, customDiamonds)}
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="ffg-pagination" aria-label="Pagination">
          {page > 1 ? (
            <button
              type="button"
              className="ffg-pageBtn"
              onClick={() => goToPage(page - 1)}
              aria-label="Previous page"
            >
              Prev
            </button>
          ) : (
            <div />
          )}
          <div className="ffg-pageNums">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={"ffg-pageNum" + (p === page ? " is-active" : "")}
                onClick={() => goToPage(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ))}
          </div>
          {page < totalPages ? (
            <button
              type="button"
              className="ffg-pageBtn"
              onClick={() => goToPage(page + 1)}
              aria-label="Next page"
            >
              Next
            </button>
          ) : (
            <div />
          )}
        </div>
      ) : null}


    </section>
  );
}

