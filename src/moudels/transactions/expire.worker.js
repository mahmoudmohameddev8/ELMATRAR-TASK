import { User } from "../../../DB/models/user.model.js";
import { Transfer } from "../../../DB/models/transactions.model.js";

const BATCH = 200;
const EVERY_MS =  30 * 1000; // every 30 seconds
const TEN_MIN_MS = 10 * 60 * 1000;

export async function processExpiredTransfers() {
  const now = Date.now();
  let marked = 0, refunded = 0;

 
  while (true) {
    const batch = await Transfer.find({
      status: "pending",
      heldAt: { $lte: new Date(now - TEN_MIN_MS) }
    })
    .sort({ heldAt: 1 })
    .limit(BATCH)
    .lean();

    if (!batch.length) break;

    for (const t of batch) {
      const updated = await Transfer.findOneAndUpdate(
        { _id: t._id, status: "pending", heldAt: { $lte: new Date(now - TEN_MIN_MS) } },
        { $set: { status: "expired" } },
        { new: true }
      );
      if (updated) marked++;
    }

    if (batch.length < BATCH) break;
  }

  while (true) {
    const batch = await Transfer.find({ status: "expired", refunded: false })
      .sort({ heldAt: 1 })
      .limit(BATCH)
      .lean();

    if (!batch.length) break;

    for (const t of batch) {
     
      const claimed = await Transfer.findOneAndUpdate(
        { _id: t._id, status: "expired", refunded: false },
        { $set: { refunded: true } },
        { new: true }
      );
      if (!claimed) continue; 

      
      await User.updateOne(
        { _id: claimed.sender },
        { $inc: { points: +claimed.amount, pending: -claimed.amount } }
      );
      refunded++;
    }

    if (batch.length < BATCH) break;
  }

  
}

export function startExpireScheduler() {
  const tick = async () => {
    try { await processExpiredTransfers(); }
    catch (e) { console.error("[expire.worker] error:", e?.message || e); }
  };
  tick();
  setInterval(tick, EVERY_MS);
}