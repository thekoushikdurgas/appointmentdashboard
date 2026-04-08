"use client";

import { useState, useEffect, useCallback } from "react";
import {
  campaignSatelliteService,
  parseCampaigns,
} from "@/services/graphql/campaignSatelliteService";
import {
  mapCampaignSatelliteToListRow,
  type CampaignListRow,
} from "@/lib/campaignListMapping";
import { isCampaignSatelliteUnavailableMessage } from "@/lib/campaignSatelliteErrors";

export function useCampaignsList() {
  const [campaigns, setCampaigns] = useState<CampaignListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const d = await campaignSatelliteService.listCampaigns();
      const parsed = parseCampaigns(d.campaignSatellite.campaigns);
      setCampaigns(
        parsed.map((row, i) => mapCampaignSatelliteToListRow(row, i)),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isCampaignSatelliteUnavailableMessage(msg)) {
        setNotConfigured(true);
        setCampaigns([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { campaigns, loading, error, notConfigured, refresh };
}
