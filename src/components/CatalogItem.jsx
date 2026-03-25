import React, { useEffect, useMemo, useState } from "react";
import diamondImg from "../assets/Logo/diamond.png";

export default function CatalogItem({ item, onGift }) {
  const isCustomDiamonds = item?.isCustomDiamonds === true;
  const [customValue, setCustomValue] = useState("");
  const [customErr, setCustomErr] = useState("");

  const fallbackImgSrc = useMemo(() => {
    const titleShort = (item?.title ?? "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .slice(0, 2)
      .join(" ")
      .slice(0, 18);

    const badgeShort = (item?.badge ?? "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .slice(0, 2)
      .join(" ")
      .slice(0, 14);

    const a = item?.accent ?? "#35d7ff";
    const b = "#0b0620";
    const safeTitle = titleShort || "GIFT";
    const safeBadge = badgeShort || "ITEM";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${a}" stop-opacity="0.95"/>
            <stop offset="1" stop-color="${b}" stop-opacity="1"/>
          </linearGradient>
          <radialGradient id="r" cx="45%" cy="30%" r="70%">
            <stop offset="0" stop-color="${a}" stop-opacity="0.45"/>
            <stop offset="1" stop-color="${a}" stop-opacity="0"/>
          </radialGradient>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.16 0"/>
          </filter>
        </defs>
        <rect width="240" height="140" rx="20" fill="url(#g)"/>
        <circle cx="96" cy="46" r="70" fill="url(#r)"/>
        <rect width="240" height="140" rx="20" filter="url(#noise)" opacity="0.45"/>
        <g fill="white" opacity="0.95">
          <text x="16" y="86" font-family="Arial Black, Arial" font-size="16" font-weight="900">${safeTitle}</text>
          <text x="16" y="112" font-family="Arial, sans-serif" font-size="12" font-weight="800" opacity="0.72">${safeBadge}</text>
        </g>
        <path d="M10 28 C 60 8, 120 10, 230 34" stroke="${a}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.35"/>
        <path d="M12 122 C 80 104, 145 96, 230 114" stroke="${a}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.2"/>
      </svg>
    `.trim();

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [item?.title, item?.badge, item?.accent]);

  const thumbSrc = item?.image || fallbackImgSrc;

  const diamondText = item?.rarity ?? "";
  const diamondNum = diamondText.match(/\d+/)?.[0] ?? null;
  const isDiamonds = item?.category === "Diamonds";
  const diamondAmount = diamondNum ?? String(item?.pricePerGift ?? "");
  const diamondAmountNum = Number(diamondAmount);
  const rsValue = item?.rsPrice;
  const topupRsText = isDiamonds
    ? typeof rsValue === "number" && Number.isFinite(rsValue)
      ? `₹${rsValue.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : Number.isFinite(diamondAmountNum)
        ? `₹${diamondAmountNum.toFixed(2)}`
        : "₹0.00"
    : "";

  useEffect(() => {
    if (!isCustomDiamonds) return;
    const next = String(item?.pricePerGift ?? 5600);
    setCustomValue(next);
    setCustomErr("");
  }, [isCustomDiamonds, item?.id]);

  if (isCustomDiamonds) {
    return (
      <article
        className={"ffg-item ffg-item--diamonds ffg-item--diamondsCustom"}
        aria-label="Custom diamonds"
      >
        <div
          className="ffg-itemThumb ffg-itemThumb--diamonds ffg-itemThumb--diamondsCustom"
          style={{ ["--accent"]: item.accent }}
        >
          <div className="ffg-itemGlow" aria-hidden="true" />
          <img
            className="ffg-thumbImg"
            src={thumbSrc}
            alt={item.title}
            loading="lazy"
          />

          <div className="ffg-diamTop">
            <img
              className="ffg-diamondIconImg ffg-diamTopIconImg"
              src={diamondImg}
              alt=""
              aria-hidden="true"
            />
            <span className="ffg-diamTopValue">
              {customValue && String(customValue).trim()
                ? String(customValue)
                : "0"}
            </span>
          </div>

          <div className="ffg-diamBottom ffg-diamBottom--custom">
            <input
              className="ffg-customDiamondsInput"
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setCustomErr("");
              }}
              placeholder="Enter diamonds"
              inputMode="numeric"
              aria-label="Enter diamonds amount"
              onClick={(e) => e.stopPropagation()}
            />

            
          </div>

          {customErr ? <div className="ffg-customErr">{customErr}</div> : null}
        </div>
        <button
              type="button"
              className="ffg-customSendBtn"
              onClick={(e) => {
                e.stopPropagation();
                const v = Number(customValue);
                if (!Number.isFinite(v) || v <= 0) {
                  setCustomErr("Enter valid diamonds");
                  return;
                }
                onGift?.(v);
              }}
            >
              SEND
            </button>
      </article>
    );
  }

  return (
    <article
      className={"ffg-item" + (isDiamonds ? " ffg-item--diamonds" : "")}
      role="button"
      tabIndex={0}
      onClick={onGift}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onGift();
      }}
      aria-label={`Open ${item.title} gift`}
    >
      <div
        className={"ffg-itemThumb" + (isDiamonds ? " ffg-itemThumb--diamonds" : "")}
        style={{ ["--accent"]: item.accent }}
      >
        <div className="ffg-itemGlow" aria-hidden="true" />
        <img
          className="ffg-thumbImg"
          src={thumbSrc}
          alt={item.title}
          loading="lazy"
        />

        {isDiamonds ? (
          <>
            <div className="ffg-diamTop">
              <img
                className="ffg-diamondIconImg ffg-diamTopIconImg"
                src={diamondImg}
                alt=""
                aria-hidden="true"
              />
              <span className="ffg-diamTopValue">{diamondAmount}</span>
            </div>

            <div className="ffg-diamBottom" aria-label="Top up price">
              <span className="ffg-diamBottomText">{topupRsText}</span>
            </div>
          </>
        ) : (
          <div className="ffg-itemBadge">{item.badge}</div>
        )}
      </div>

      {!isDiamonds ? (
        <div className="ffg-itemBody">
          <div className="ffg-itemTitle">{item.title}</div>

          <div className="ffg-cardRow">
            <div className="ffg-cardPrice" aria-label="Item price">
              <img
                className="ffg-diamondIconImg ffg-diamondIconSmall"
                src={diamondImg}
                alt=""
                aria-hidden="true"
              />
              <span className="ffg-cardPriceText">
                {diamondNum ? `${diamondNum}` : diamondText}
              </span>
            </div>

            <button
              type="button"
              className="ffg-cardGiftBtn"
              onClick={(e) => {
                e.stopPropagation();
                onGift();
              }}
            >
              GIFT
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

