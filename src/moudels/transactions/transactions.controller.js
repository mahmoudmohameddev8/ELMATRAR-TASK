import { asyncHandler } from "../../../utlis/asyncHandlers.js";
import { Transfer } from "../../../DB/models/transactions.model.js";
import { User } from "../../../DB/models/user.model.js";

const TEN_MIN_MS = 10 * 60 * 1000;


export const makeTransfer = asyncHandler(async (req, res, next) => {

  if (!req.user) {
    const err = new Error("Authentication required");
    err.status = 401;
    return next(err);
  }

  const { email, amount } = req.body;
  const senderId = req.user._id;

  
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    const err = new Error("Transfer amount must be a positive number");
    err.status = 400;
    return next(err);
  }
    const normalizedEmail = String(email || "").trim().toLowerCase();

  // Fast self-transfer guard by email (cheap pre-check)
  if (normalizedEmail && normalizedEmail === String(req.user.email || "").toLowerCase()) {
    const err = new Error("You cannot transfer points to yourself");
    err.status = 400;
    return next(err);
  }

  const recipient = await User.findOne({ email });
  if (!recipient) {
    const err = new Error("Recipient not found");
    err.status = 404;
    return next(err);
  }

  const dec = await User.updateOne(
    { _id: senderId, points: { $gte: amt } },
    { $inc: { points: -amt, pending: +amt } }
  );
  if (dec.modifiedCount === 0) {
    const err = new Error("Your points are not enough");
    err.status = 400;
    return next(err);
  }

  
  try {
    const heldAt = new Date();
    const transfer = await Transfer.create({
      sender: senderId,
      receiver: recipient._id,
      amount: amt,
      status: "pending",
      heldAt
    });

    return res.json({
      success: true,
      message: "Transfer created. Please confirm within 10 minutes.",
      transferId: transfer._id
    });
  } catch (err) {
  
    await User.updateOne(
      { _id: senderId },
      { $inc: { points: +amt, pending: -amt } }
    );
    return next(err);
  }
});

export const confirmTransfer = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    const err = new Error("Authentication required");
    err.status = 401;
    return next(err);
  }

  const { transferId } = req.body;
  const senderId = req.user._id;

  const now = Date.now();


  const transfer = await Transfer.findOneAndUpdate(
    {
      _id: transferId,
      sender: senderId,
      status: "pending",
      heldAt: { $gte: new Date(now - TEN_MIN_MS) }
    },
    { $set: { status: "confirmed" } },
    { new: true }
  );

  if (!transfer) {
    const err = new Error("Transfer not found or already expired");
    err.status = 400;
    return next(err);
  }

 
  await User.updateOne(
    { _id: senderId },
    { $inc: { pending: -transfer.amount } }
  );
  await User.updateOne(
    { _id: transfer.receiver },
    { $inc: { points: +transfer.amount } }
  );

  return res.json({ success: true, message: "Transfer confirmed successfully" });
});


export const getMyPoints = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    const err = new Error("Authentication required");
    err.status = 401;
    return next(err);
  }
  const me = await User.findById(req.user._id).select("points").lean();
  return res.json({ success: true, points: me?.points ?? 0 });
});


export const getMyTransactions = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    const err = new Error("Authentication required");
    err.status = 401;
    return next(err);
  }

  const userId = req.user._id;
  const {
    type = "all",
    status,
    page = 1,
    limit = 20,
    sort = "newest"
  } = req.query;


  const filter =
    type === "sent"
      ? { sender: userId }
      : type === "received"
      ? { receiver: userId }
      : { $or: [{ sender: userId }, { receiver: userId }] };

  if (status) filter.status = status;

 
  const skip = (Number(page) - 1) * Number(limit);
  const sortObj = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

 
  const items = await Transfer.find(filter)
    .select("-_id sender receiver amount status heldAt refunded createdAt updatedAt")
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit))
    .populate({ path: "sender", select: "name email -_id" })
    .populate({ path: "receiver", select: "name email -_id" })
    .lean();

  const shaped = items.map((t) => ({
    sender: t.sender ? { email: t.sender.email, username: t.sender.name } : null,
    receiver: t.receiver ? { email: t.receiver.email, username: t.receiver.name } : null,
    amount: t.amount,
    status: t.status,
    heldAt: t.heldAt,
    refunded: t.refunded,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  }));

  return res.json({ success: true, items: shaped });
});