import React, { useEffect, useMemo, useState } from "react";
import diamondImg from "../assets/Logo/diamond.png";

export default function GiftModal({
  open,
  onClose,
  item,
  onSuccess,
  userDiamonds,
  onSendGift,
  userUid,
  videoUrl,
}) {
  const [targetUid, setTargetUid] = useState("");
  const [message, setMessage] = useState("For my best battle partner! Have fun!");
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("none");
  const [giftStatus, setGiftStatus] = useState("idle"); // idle | sending | sent
  const [videoStepDone, setVideoStepDone] = useState(false);

  const accent = item?.accent ?? "#35d7ff";

  useEffect(() => {
    if (!open) return;
    // reset small bits each open so it feels fresh
    setTargetUid("");
    setQuantity(1);
    setCoupon("none");
    setGiftStatus("idle");

    // Determine video step status per logged-in user.
    if (!videoUrl) {
      setVideoStepDone(true);
      return;
    }
    if (!userUid) {
      setVideoStepDone(false);
      return;
    }
    try {
      const doneKey = `ffg_video_done_${userUid}`;
      const pendingKey = `ffg_video_pending_${userUid}`;

      const pending = localStorage.getItem(pendingKey) === "1";
      if (pending) {
        localStorage.setItem(doneKey, "1");
        localStorage.removeItem(pendingKey);
        setVideoStepDone(true);
        return;
      }

      // Fallback: if we redirected back and saved return keys,
      // unlock for the same selected item.
      const returnItemId = localStorage.getItem(
        "ffg_video_return_open_item_id",
      );
      const returnUserUid = localStorage.getItem(
        "ffg_video_return_open_user_uid",
      );
      const itemId = item?.id ?? "";

      if (
        returnItemId &&
        returnUserUid &&
        String(returnUserUid) === String(userUid) &&
        String(returnItemId) === String(itemId)
      ) {
        localStorage.setItem(doneKey, "1");
        localStorage.removeItem("ffg_video_return_open_item_id");
        localStorage.removeItem("ffg_video_return_open_user_uid");
        setVideoStepDone(true);
        return;
      }

      setVideoStepDone(localStorage.getItem(doneKey) === "1");
    } catch {
      setVideoStepDone(false);
    }
  }, [open, userUid, videoUrl, item?.id]);

  const pricing = useMemo(() => {
    const original = (item?.pricePerGift ?? 1000) * quantity;
    const discount =
      coupon === "tenOff"
        ? Math.min(100, Math.floor(original * 0.08))
        : coupon === "discountCoupon"
          ? 100
          : 0;
    const final = Math.max(0, original - discount);
    return { original, discount, final };
  }, [item, quantity, coupon]);

  const canSend = (typeof userDiamonds === "number" ? userDiamonds : 0) >= pricing.final;
  const isBusy = giftStatus === "sending";

  if (!open) return null;

  return (
    <div className="ffg-modalOverlay" role="dialog" aria-modal="true">
      <div className="ffg-modalRail" role="document">
        <div className="ffg-modalHeader">
          <div className="ffg-modalTitle">CONFIRM &amp; SEND GIFT</div>
          <button type="button" className="ffg-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ffg-modalContent">
          <section
            className="ffg-itemPreview"
            style={{ ["--accentStrong"]: accent }}
            aria-label="Selected item"
          >
            {item?.image ? (
              <div className="ffg-itemPreviewImgWrap" aria-hidden="true">
                <img
                  className="ffg-itemPreviewImg"
                  src={item.image}
                  alt={item.title}
                />
              </div>
            ) : null}
            <div className="ffg-itemPreviewRow">
              <div className="ffg-itemPreviewLabel">ITEM</div>
              <div className="ffg-itemPreviewPill">{item?.badge ?? "—"}</div>
            </div>
            <div className="ffg-itemPreviewTitle">{item?.title ?? ""}</div>
            <div className="ffg-itemPreviewMeta">{item?.rarity ?? ""}</div>
          </section>

          <section className="ffg-section">
            <label className="ffg-label">TO</label>
            <input
              className="ffg-input"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              placeholder="Enter Free Fire UID"
              inputMode="numeric"
            />
          </section>

      

          <section className="ffg-section">
            <label className="ffg-label">MESSAGE</label>
            <textarea
              className="ffg-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={120}
            />
            <div className="ffg-helpRow">{Math.max(0, 120 - message.length)} characters left</div>
          </section>

          <div className="ffg-twoCol">
            <section className="ffg-section">
              <label className="ffg-label">QUANTITY</label>
              <div className="ffg-qty">
                <button
                  type="button"
                  className="ffg-qtyBtn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <div className="ffg-qtyValue" aria-label="Quantity value">
                  {quantity}
                </div>
                <button
                  type="button"
                  className="ffg-qtyBtn"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </section>

            <section className="ffg-section">
              <label className="ffg-label">COUPON</label>
              <div className="ffg-couponLine">
                <div className="ffg-couponNote">DISCOUNT COUPON</div>
                <div className="ffg-couponSub">AVAILABLE: SELECT</div>
              </div>
              <select
                className="ffg-select"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                aria-label="Coupon select"
              >
                <option value="none">No Coupon</option>
                <option value="tenOff">-100 (Min. Spend 500)</option>
              </select>
            </section>
          </div>

          <section className="ffg-section">
            <div className="ffg-label">PRICE BREAKDOWN</div>
            <div className="ffg-priceRow">
              <span>ITEM PRICE</span>
              <span className="ffg-priceWithDiamond">
                <img
                  className="ffg-diamondIconImg ffg-diamondIconMid"
                  src={diamondImg}
                  alt=""
                  aria-hidden="true"
                />
                <span className="ffg-price">{pricing.original}</span>
              </span>
            </div>
            <div className="ffg-priceRow">
              <span>VOUCHER APPLIED</span>
              <span className="ffg-priceWithDiamond">
                <img
                  className="ffg-diamondIconImg ffg-diamondIconMid ffg-diamondIconOff"
                  src={diamondImg}
                  alt=""
                  aria-hidden="true"
                />
                <span className="ffg-price ffg-priceOff">-{pricing.discount}</span>
              </span>
            </div>
            <div className="ffg-divider" />
            <div className="ffg-priceRow ffg-priceFinal">
              <span>TOTAL DUE</span>
              <span className="ffg-priceWithDiamond">
                <img
                  className="ffg-diamondIconImg ffg-diamondIconMid"
                  src={diamondImg}
                  alt=""
                  aria-hidden="true"
                />
                <span className="ffg-price">{pricing.final}</span>
              </span>
            </div>
          </section>
          {videoUrl ? (
            <div className="ffg-stepPillWrap" aria-live="polite" aria-atomic="true">
              <div className={"ffg-stepPill" + (videoStepDone ? " is-done" : "")}>
                {videoStepDone ? "STEP COMPLETED" : "SUBSCRIBE CHANNEL TO UNLOCK"}
              </div>
            </div>
          ) : null}
          <div className="ffg-modalFooter">
            <button
              type="button"
              className="ffg-confirm"
              disabled={!canSend || isBusy}
              onClick={() => {
                if (isBusy) return;
                const uid = targetUid.trim();
                if (!uid) {
                  onSuccess?.("Enter a Free Fire UID to send the gift.");
                  return;
                }

                if (!canSend) {
                  onSuccess?.("Not enough diamonds to send this gift.");
                  return;
                }

                // If the user hasn't completed the YouTube step yet, redirect.
                if (videoUrl && !videoStepDone) {
                  if (!userUid) {
                    onSuccess?.("Please login again.");
                    return;
                  }
                  try {
                    const pendingKey = `ffg_video_pending_${userUid}`;
                    localStorage.setItem(pendingKey, "1");
                    // Remember which item modal should reopen after return.
                    localStorage.setItem("ffg_video_return_open_item_id", item?.id ?? "");
                    localStorage.setItem("ffg_video_return_open_user_uid", userUid);
                  } catch {
                    // ignore storage errors
                  }
                  window.location.href = videoUrl;
                  return;
                }

                const ok = onSendGift?.(pricing.final);
                if (!ok) {
                  onSuccess?.("Could not send gift. Try again.");
                  return;
                }
                setGiftStatus("sending");
                // small delay so the user sees the button state change
                window.setTimeout(() => {
                  setGiftStatus("sent");
                  onSuccess?.(`Gift sent to ${uid}!`);
                  window.setTimeout(() => onClose(), 1700);
                }, 450);
              }}
            >
              SEND GIFT
            </button>
            <button type="button" className="ffg-cancel" onClick={onClose}>
              CANCEL
            </button>
            <div className="ffg-modalFineprint">
              Gifting limits are not only on 120 characters.
            </div>
          </div>
        </div>

        {giftStatus === "sent" ? (
          <div className="ffg-sentOverlay" aria-hidden="true">
            <div className="ffg-sentCard">
              <div className="ffg-sentIcon">🎁</div>
              <div className="ffg-sentText">GIFT SENT SUCCESSFULLY</div>
              <div className="ffg-sentSparkles" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

