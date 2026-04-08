"use client";

import { useState, useEffect, useCallback } from "react";
import {
  campaignSatelliteService,
  parseSequences,
} from "@/services/graphql/campaignSatelliteService";
import {
  mapSequenceSatelliteToRow,
  type SequenceListRow,
} from "@/lib/sequenceListMapping";
import { isCampaignSatelliteUnavailableMessage } from "@/lib/campaignSatelliteErrors";

export function useCampaignSequences() {
  const [sequences, setSequences] = useState<SequenceListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const res = await campaignSatelliteService.listSequences();
      const parsed = parseSequences(res.campaignSatellite.sequences);
      setSequences(parsed.map((row, i) => mapSequenceSatelliteToRow(row, i)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isCampaignSatelliteUnavailableMessage(msg)) {
        setNotConfigured(true);
        setSequences([]);
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

  return { sequences, loading, error, notConfigured, refresh, clearError };
}
