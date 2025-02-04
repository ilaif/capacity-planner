export function getCurrentPlanId(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  const planId = searchParams.get('id');
  return planId;
}

export function setCurrentPlanId(planId: string): void {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set('id', planId);
  window.history.pushState({}, '', window.location.pathname + '?' + searchParams.toString());
}

export function generatePlanId(): string {
  return crypto.randomUUID();
}
