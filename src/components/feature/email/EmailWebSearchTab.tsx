"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { emailService } from "@/services/graphql/emailService";
import { parseEmailServiceError } from "@/lib/emailErrors";

function webSearchHits(
  data: unknown,
): Array<{ title: string; url: string; snippet: string }> | null {
  if (!Array.isArray(data)) return null;
  const out: Array<{ title: string; url: string; snippet: string }> = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? o.name ?? o.headline ?? "");
    const url = String(o.url ?? o.link ?? o.href ?? "");
    const snippet = String(
      o.snippet ?? o.description ?? o.summary ?? o.text ?? "",
    );
    if (title || url || snippet)
      out.push({ title: title || url || "Result", url, snippet });
  }
  return out.length ? out : null;
}

export function EmailWebSearchTab() {
  const [fullName, setFullName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ title: string; url: string; snippet: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !companyDomain.trim()) return;
    setLoading(true);
    setError(null);
    setRawJson(null);
    setResults([]);
    try {
      const res = await emailService.webSearch({
        fullName: fullName.trim(),
        companyDomain: companyDomain.trim(),
      });
      const payload = res.email.webSearch;
      const hits = webSearchHits(payload);
      if (hits) {
        setResults(hits);
      } else {
        setRawJson(JSON.stringify(payload, null, 2));
      }
    } catch (err) {
      setError(parseEmailServiceError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Web Search"
      subtitle="Person + company domain discovery (satellite JSON)"
    >
      <form
        onSubmit={handleSearch}
        className="c360-section-stack c360-max-w-600"
      >
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          required
          leftIcon={<Search size={16} />}
        />
        <Input
          label="Company domain"
          value={companyDomain}
          onChange={(e) => setCompanyDomain(e.target.value)}
          placeholder="acme.com"
          required
        />
        <div>
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </div>
        {error && <p className="c360-text-sm c360-text-danger">{error}</p>}
      </form>
      {results.length > 0 && (
        <div className="c360-section-stack c360-mt-4">
          {results.map((r, i) => (
            <div key={i} className="c360-search-result">
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c360-search-result__title"
                >
                  {r.title}
                </a>
              ) : (
                <span className="c360-fw-medium">{r.title}</span>
              )}
              {r.snippet && (
                <p className="c360-search-result__snippet">{r.snippet}</p>
              )}
              {r.url && <p className="c360-search-result__url">{r.url}</p>}
            </div>
          ))}
        </div>
      )}
      {rawJson && <pre className="c360-code-block c360-mt-4">{rawJson}</pre>}
    </Card>
  );
}
