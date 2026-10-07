// Shared by the HR-side and self-service appraisal controllers so the
// weighted-average formula only lives in one place.
export const computeOverallScore = (kpis = []) => {
  const totalWeight = kpis.reduce((sum, k) => sum + (Number(k.weightage) || 0), 0);
  if (totalWeight === 0) return 0;
  const weightedSum = kpis.reduce(
    (sum, k) => sum + (Number(k.score) || 0) * (Number(k.weightage) || 0),
    0,
  );
  return Number((weightedSum / totalWeight).toFixed(2));
};
