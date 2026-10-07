import { AsyncLocalStorage } from "node:async_hooks";
import mongoose from "mongoose";

export const campusStorage = new AsyncLocalStorage();

export function getCampusContext() {
  return campusStorage.getStore() || { campusId: null, allCampuses: true };
}

export function enterCampusContext(user, requestedCampusId) {
  const roles = user?.roles || [];
  const hasGlobalAccess = roles.includes("admin") || roles.includes("headofaccount");
  const assignedCampusId = user?.campusId?.toString?.() || null;
  const requested = String(requestedCampusId || "").trim();

  let campusId = assignedCampusId;
  let allCampuses = false;

  if (hasGlobalAccess) {
    if (!requested || requested === "all") {
      campusId = null;
      allCampuses = true;
    } else if (mongoose.isValidObjectId(requested)) {
      campusId = requested;
    }
  }

  campusStorage.enterWith({ campusId, allCampuses, hasGlobalAccess });
  return { campusId, allCampuses, hasGlobalAccess };
}

// Adds transparent request-level campus isolation to records used by both
// Admissions and Accounts. Existing controller queries therefore cannot
// accidentally leak another campus when a new endpoint is added.
export function campusScopedPlugin(schema) {
  schema.add({
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "School", index: true },
  });

  const applyQueryScope = function () {
    const { campusId, allCampuses } = getCampusContext();
    if (!allCampuses && campusId && !Object.prototype.hasOwnProperty.call(this.getQuery(), "campusId")) {
      this.where({ campusId });
    }
  };

  schema.pre(/^find/, applyQueryScope);
  schema.pre(/^count/, applyQueryScope);
  schema.pre(/^update/, applyQueryScope);
  schema.pre(/^delete/, applyQueryScope);

  schema.pre("aggregate", function () {
    const { campusId, allCampuses } = getCampusContext();
    if (!allCampuses && campusId) this.pipeline().unshift({ $match: { campusId: new mongoose.Types.ObjectId(campusId) } });
  });

  schema.pre("save", function (next) {
    const { campusId } = getCampusContext();
    if (this.isNew && !this.campusId && campusId) this.campusId = campusId;
    next();
  });

  schema.pre("insertMany", function (next, docs) {
    const { campusId } = getCampusContext();
    if (campusId) docs.forEach((doc) => { if (!doc.campusId) doc.campusId = campusId; });
    next();
  });
}
