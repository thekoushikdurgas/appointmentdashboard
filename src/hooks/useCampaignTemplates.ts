"use client";

import { useState, useEffect, useCallback } from "react";
import {
  campaignSatelliteService,
  parseCampaignTemplates,
} from "@/services/graphql/campaignSatelliteService";
import {
  mapTemplateSatelliteToRow,
  type TemplateListRow,
} from "@/lib/templateListMapping";
import { isCampaignSatelliteUnavailableMessage } from "@/lib/campaignSatelliteErrors";

export function useCampaignTemplates() {
  const [templates, setTemplates] = useState<TemplateListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const res = await campaignSatelliteService.listTemplates();
      const parsed = parseCampaignTemplates(
        res.campaignSatellite.campaignTemplates,
      );
      setTemplates(parsed.map((row, i) => mapTemplateSatelliteToRow(row, i)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isCampaignSatelliteUnavailableMessage(msg)) {
        setNotConfigured(true);
        setTemplates([]);
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

  return { templates, loading, error, notConfigured, refresh, clearError };
}
