"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { companiesService } from "@/services/graphql/companiesService";
import type { CreateCompanyInput } from "@/graphql/generated/types";
import { toast } from "sonner";

export interface CompanyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type CreateCompanyForm = {
  name: string;
  employeesCount: string;
  industriesCsv: string;
  address: string;
  textSearch: string;
};

const EMPTY_FORM: CreateCompanyForm = {
  name: "",
  employeesCount: "",
  industriesCsv: "",
  address: "",
  textSearch: "",
};

function toCreateInput(form: CreateCompanyForm): CreateCompanyInput {
  const industries = form.industriesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    name: form.name.trim() || undefined,
    employeesCount: form.employeesCount.trim()
      ? Number(form.employeesCount)
      : undefined,
    industries: industries.length ? industries : undefined,
    address: form.address.trim() || undefined,
    textSearch: form.textSearch.trim() || undefined,
  };
}

export function CompanyCreateModal({
  isOpen,
  onClose,
  onCreated,
}: CompanyCreateModalProps) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateCompanyForm>(EMPTY_FORM);

  const handleCreateCompany = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await companiesService.create(toCreateInput(form));
      toast.success("Company created successfully!");
      setForm(EMPTY_FORM);
      onClose();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Company" size="md">
      <div className="c360-section-stack">
        <p className="c360-text-muted c360-text-sm c360-m-0">
          Fields match gateway{" "}
          <code className="c360-text-xs">CreateCompanyInput</code> (no separate
          website/domain/country on the schema — use text search for hints).
        </p>
        <Input
          label="Company name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Employee count"
          type="number"
          value={form.employeesCount}
          onChange={(e) =>
            setForm((f) => ({ ...f, employeesCount: e.target.value }))
          }
          placeholder="e.g. 50"
        />
        <Input
          label="Industries"
          value={form.industriesCsv}
          onChange={(e) =>
            setForm((f) => ({ ...f, industriesCsv: e.target.value }))
          }
          placeholder="Technology, Finance (comma-separated)"
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
        <Input
          label="Text search / domain / location hints"
          value={form.textSearch}
          onChange={(e) =>
            setForm((f) => ({ ...f, textSearch: e.target.value }))
          }
          placeholder="e.g. example.com or San Francisco"
        />
        <div className="c360-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={creating} onClick={handleCreateCompany}>
            Create Company
          </Button>
        </div>
      </div>
    </Modal>
  );
}
