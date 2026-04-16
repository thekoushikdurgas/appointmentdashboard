"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { campaignSatelliteService } from "@/services/graphql/campaignSatelliteService";
import { toast } from "sonner";

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Dev / power-user panel: campaign satellite CQL parse + validate (gateway → campaign API).
 */
export function CqlPlaygroundCard() {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  const [parseOut, setParseOut] = useState<string | null>(null);
  const [validateIn, setValidateIn] = useState('{\n  "version": 1\n}');
  const [validateOut, setValidateOut] = useState<string | null>(null);
  const [loading, setLoading] = useState<"parse" | "validate" | null>(null);

  const runParse = async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Enter a CQL query string.");
      return;
    }
    setLoading("parse");
    setParseOut(null);
    try {
      const data = await campaignSatelliteService.cqlParse(
        q,
        target.trim() || null,
      );
      setParseOut(formatJson(data.campaignSatellite.cqlParse));
      toast.success("Parsed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Parse failed.");
    } finally {
      setLoading(null);
    }
  };

  const runValidate = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(validateIn) as Record<string, unknown>;
    } catch {
      toast.error("Validate input must be valid JSON object.");
      return;
    }
    setLoading("validate");
    setValidateOut(null);
    try {
      const data = await campaignSatelliteService.cqlValidate(parsed);
      setValidateOut(formatJson(data.campaignSatellite.cqlValidate));
      toast.success("Validated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Validate failed.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card
      title="CQL tools"
      subtitle="Parse and validate campaign query language via campaignSatellite (requires CAMPAIGN_API_URL on gateway)"
    >
      <div className="c360-section-stack c360-max-w-720">
        <div>
          <Input
            label="Parse — query string"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. segment expression"
          />
          <div className="c360-mt-3">
            <Input
              label="Target (optional)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="optional target key"
            />
          </div>
          <Button
            className="c360-mt-3"
            onClick={() => void runParse()}
            loading={loading === "parse"}
            type="button"
          >
            Parse
          </Button>
          {parseOut && (
            <pre className="c360-code-block c360-mt-3 c360-text-xs c360-overflow-auto">
              {parseOut}
            </pre>
          )}
        </div>

        <hr className="c360-border-t c360-my-4" />

        <div>
          <label className="c360-form-label" htmlFor="cql-validate-json">
            Validate — JSON object
          </label>
          <textarea
            id="cql-validate-json"
            className="c360-input c360-textarea-json-block c360-font-mono c360-text-sm"
            value={validateIn}
            onChange={(e) => setValidateIn(e.target.value)}
            spellCheck={false}
          />
          <Button
            className="c360-mt-3"
            onClick={() => void runValidate()}
            loading={loading === "validate"}
            type="button"
          >
            Validate
          </Button>
          {validateOut && (
            <pre className="c360-code-block c360-mt-3 c360-text-xs c360-overflow-auto">
              {validateOut}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}
