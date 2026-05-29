export const STORAGE_KEY = "subshield.complete.v1";

function isValidDataShape(value) {
  return Boolean(
    value &&
      Array.isArray(value.policies) &&
      Array.isArray(value.contractors) &&
      Array.isArray(value.activity)
  );
}

export function readStoredData(fallback) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!isValidDataShape(parsed)) return fallback;

    return {
      ...fallback,
      ...parsed,
      policies: parsed.policies.length ? parsed.policies : fallback.policies,
      contractors: parsed.contractors.length ? parsed.contractors : fallback.contractors,
      activity: parsed.activity.length ? parsed.activity : fallback.activity,
    };
  } catch {
    return fallback;
  }
}

export function writeStoredData(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Browser storage can fail in private mode. Keep the app usable.
  }
}

export function getStatus(days) {
  if (days <= 10) return { label: "Critical", className: "danger" };
  if (days <= 30) return { label: "Expiring", className: "warning" };
  return { label: "Active", className: "success" };
}

export function getComplianceScore(policies = []) {
  if (!policies.length) return 0;

  const total = policies.reduce((sum, policy) => {
    if (policy.daysRemaining >= 90) return sum + 100;
    if (policy.daysRemaining >= 45) return sum + 84;
    if (policy.daysRemaining >= 30) return sum + 70;
    if (policy.daysRemaining >= 10) return sum + 48;
    return sum + 18;
  }, 0);

  return Math.round(total / policies.length);
}

export function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export function countDocuments(policies = []) {
  return policies.reduce((sum, policy) => sum + (policy.documents?.length || 0), 0);
}

export function packagePolicies(policies = []) {
  return policies.filter((policy) => policy.type !== "license");
}
