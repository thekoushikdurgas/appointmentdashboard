"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface LinkedInUrlSearchProps {
  onSearch: (url: string) => Promise<void>;
  loading?: boolean;
  placeholder?: string;
}

export function LinkedInUrlSearch({
  onSearch,
  loading,
  placeholder = "Paste a LinkedIn URL…",
}: LinkedInUrlSearchProps) {
  const [url, setUrl] = useState("");

  const handleSearch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    await onSearch(trimmed);
  };

  return (
    <div className="c360-flex c360-gap-2 c360-items-end">
      <div className="c360-flex-1">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      <Button
        leftIcon={<Search size={16} />}
        loading={loading}
        disabled={!url.trim()}
        onClick={handleSearch}
      >
        Search
      </Button>
    </div>
  );
}
