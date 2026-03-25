import React, { useEffect, useMemo, useState } from "react";
import GiftModal from "./components/GiftModal.jsx";
import LeftCatalog from "./components/LeftCatalog.jsx";
import LoginPage from "./components/LoginPage.jsx";
import logoApp from "./assets/Logo/logoapp.png";
import diamondImg from "./assets/Logo/diamond.png";

export default function App() {
  const VIDEO_URL = "https://www.youtube.com/@BADSACHINFF1";

  const items = useMemo(() => {
    const bundlesModules = import.meta.glob(
      "./assets/Bundles/*.{png,jpg,jpeg,webp,gif,svg}",
      { eager: true, import: "default" },
    );
    const weaponsModules = import.meta.glob(
      "./assets/weapons/*.{png,jpg,jpeg,webp,gif,svg}",
      { eager: true, import: "default" },
    );
    const emotesModules = import.meta.glob(
      "./assets/Emotes/*.{png,jpg,jpeg,webp,gif,svg}",
      { eager: true, import: "default" },
    );
    const diamondsModules = import.meta.glob(
      "./assets/catalog/*.{png,jpg,jpeg,webp,gif,svg}",
      { eager: true, import: "default" },
    );

    function toBaseTitle(path) {
      const parts = path.split("/");
      const file = parts[parts.length - 1] ?? path;
      return file.replace(/\.[^.]+$/, "");
    }

    function toTitleCase(str) {
      const cleaned = String(str)
        .replace(/[_-]+/g, " ")
        .replace(/[^a-zA-Z0-9 ]+/g, " ")
        .trim();
      if (!cleaned) return "";

      const words = cleaned.split(/\s+/).filter(Boolean);
      return words
        .map((w) => {
          if (/^\d+$/.test(w)) return w;
          const lower = w.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
    }

    function maybePriceFromName(name, fallback) {
      const m = name.match(/\d+/);
      const n = m ? Number(m[0]) : NaN;
      if (!Number.isNaN(n) && n >= 100) return n;
      return fallback;
    }

    function toItemsFromModules(modules, category, accent, defaultPrice, badge) {
      const entries = Object.entries(modules);
      // stable order by filename (you can switch to numeric sorting later)
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      return entries.map(([path, src], idx) => {
        const title = toTitleCase(toBaseTitle(path));
        const pricePerGift = maybePriceFromName(title, defaultPrice + idx * 10);
        return {
          id: `${category}-${idx}`,
          title,
          rarity: `${pricePerGift} Diamonds`,
          badge,
          pricePerGift,
          accent,
          category,
          image: src,
        };
      });
    }

    const fallbackDiamonds = [
      { diamond: 100, rs: 80 },
      { diamond: 310, rs: 240 },
      { diamond: 520, rs: 400 },
      { diamond: 1060, rs: 800 },
      { diamond: 2180, rs: 1600 },
      // Replaces the old "5600" tile with a custom input tile.
      { diamond: 5600, rs: 4000, isCustomDiamonds: true },
    ].map((x, idx) => {
      const title = x.isCustomDiamonds
        ? "Custom Diamonds"
        : toTitleCase(`Top Up ${x.diamond}`);
      return {
        id: `Diamonds-fallback-${idx}`,
        title,
        rarity: `${x.diamond} Diamonds`,
        badge: x.isCustomDiamonds ? "CUSTOM" : "TOPUP",
        pricePerGift: x.diamond,
        rsPrice: x.rs,
        accent: "#8b5cff",
        category: "Diamonds",
        image: null,
        isCustomDiamonds: x.isCustomDiamonds ?? false,
      };
    });

    const customDiamondFallback = fallbackDiamonds.find(
      (x) => x?.isCustomDiamonds === true,
    );

    let diamondsItems = fallbackDiamonds;
    if (Object.keys(diamondsModules).length > 0 && customDiamondFallback) {
      const real = toItemsFromModules(
        diamondsModules,
        "Diamonds",
        "#8b5cff",
        500,
        "DIAMOND",
      );

      // Replace the "5600" preset card, if it exists; otherwise append custom.
      const idx = real.findIndex(
        (x) =>
          x?.pricePerGift === 5600 ||
          String(x?.rarity ?? "").includes("5600") ||
          String(x?.title ?? "").includes("5600"),
      );
      if (idx >= 0) real[idx] = customDiamondFallback;
      else real.push(customDiamondFallback);

      diamondsItems = real;
    }

    return [
      ...toItemsFromModules(
        bundlesModules,
        "Bundles",
        "#ffc107",
        1200,
        "BUNDLE",
      ),
      ...toItemsFromModules(
        weaponsModules,
        "Weapon Skins",
        "#45f6ff",
        800,
        "WEAPON",
      ),
      ...diamondsItems,
      ...toItemsFromModules(
        emotesModules,
        "Emotes",
        "#ff4fd8",
        650,
        "EMOTE",
      ),
    ];
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(items[0]);
  const [authUser, setAuthUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  function showToast(message) {
    setToast({ id: Date.now(), message });
  }

  function sendGiftDeductDiamonds(cost) {
    if (!authUser) return false;
    const diamonds = typeof authUser.diamonds === "number" ? authUser.diamonds : 0;
    const safeCost = typeof cost === "number" ? cost : Number(cost);
    if (!safeCost || diamonds < safeCost) return false;

    const nextDiamonds = Math.max(0, diamonds - safeCost);
    const nextUser = { ...authUser, diamonds: nextDiamonds };
    setAuthUser(nextUser);
    try {
      localStorage.setItem("ffg_dummy_user", JSON.stringify(nextUser));
    } catch {
      // ignore write errors
    }
    return true;
  }

  // Close modal on ESC.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setModalOpen(false);
    }
    if (modalOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ffg_dummy_user");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.username && parsed?.uid) {
        setAuthUser({
          ...parsed,
          diamonds: typeof parsed.diamonds === "number" ? parsed.diamonds : 3500,
        });
      }
    } catch {
      // ignore storage parsing errors
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // If we were redirected to YouTube and returned, reopen the modal.
  useEffect(() => {
    if (!authUser) return;
    try {
      const pendingItemId = localStorage.getItem(
        "ffg_video_return_open_item_id",
      );
      const pendingUid = localStorage.getItem(
        "ffg_video_return_open_user_uid",
      );
      const uidA = authUser?.uid == null ? "" : String(authUser.uid);
      const uidB = pendingUid == null ? "" : String(pendingUid);

      if (pendingItemId) {
        const found = items.find((x) => x.id === pendingItemId);
        if (found) {
          setSelectedItem(found);
          setModalOpen(true);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [authUser, items]);

  return (
    <div className="ffg-root">
      <div className="ffg-bg" aria-hidden="true" />

      {!authUser ? (
        <LoginPage
          onLogin={(u) => {
            setAuthUser(u);
            showToast("Login successful!");
          }}
        />
      ) : (
        <main className="ffg-main">
          <div className="ffg-phoneFrame">
            <div className="ffg-phoneNav" aria-label="Top navigation">
              <div className="ffg-navBrand">
                <div className="ffg-navLogo" aria-hidden="true">
                  <img className="ffg-navLogoImg" src={logoApp} alt="" />
                </div>
                <div className="ffg-navBrandText">
                  <div className="ffg-navBrandTop">FF UNLOCK</div>
                  {/* <div className="ffg-navBrandSub">GIFT CATALOGUE</div> */}
                </div>
              </div>

              <div className="ffg-navSearch">
                <span className="ffg-navSearchIcon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  className="ffg-navSearchInput"
                  placeholder="Search"
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="ffg-userChip" aria-label="User icon">
                <div className="ffg-userAvatar" aria-hidden="true">
                  {(authUser.username ?? "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="ffg-userDiamonds" aria-label="User diamonds">
                  <img
                    className="ffg-diamondIconImg ffg-diamondIconSmall"
                    src={diamondImg}
                    alt=""
                    aria-hidden="true"
                  />
                  <span className="ffg-userDiamondsValue">
                    {authUser?.diamonds ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <LeftCatalog
              items={items}
              onInitiate={(item, diamondOverride) => {
                const v = Number(diamondOverride);
                const hasOverride = Number.isFinite(v) && v > 0;
                const nextItem = hasOverride
                  ? {
                      ...item,
                      pricePerGift: v,
                      rarity: `${v} Diamonds`,
                      title: `Custom Diamonds ${v}`,
                    }
                  : item;
                setSelectedItem(nextItem);
                setModalOpen(true);
              }}
              searchQuery={searchQuery}
            />
          </div>
        </main>
      )}

      <GiftModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedItem}
        onSuccess={(msg) => showToast(msg)}
        userDiamonds={authUser?.diamonds ?? 0}
        onSendGift={(cost) => sendGiftDeductDiamonds(cost)}
        userUid={authUser?.uid ?? ""}
        videoUrl={VIDEO_URL}
      />

      {toast ? (
        <div className="ffg-toastWrap" aria-live="polite" aria-atomic="true">
          <div className="ffg-toast">{toast.message}</div>
        </div>
      ) : null}
    </div>
  );
}

