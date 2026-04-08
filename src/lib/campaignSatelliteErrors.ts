/** Heuristic: gateway / client message when the campaign satellite is not wired. */
export function isCampaignSatelliteUnavailableMessage(
  message: string,
): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("campaign_api_url") ||
    m.includes("not configured") ||
    m.includes("campaign service") ||
    m.includes("service unavailable") ||
    m.includes("503")
  );
}
