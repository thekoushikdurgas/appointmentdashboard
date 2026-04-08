"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { contactsService } from "@/services/graphql/contactsService";
import type { CreateContactInput } from "@/graphql/generated/types";
import { toast } from "sonner";

const EMPTY_FORM: CreateContactInput = {
  firstName: "",
  lastName: "",
  email: "",
  title: "",
  mobilePhone: "",
};

interface ContactCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ContactCreateModal({
  isOpen,
  onClose,
  onCreated,
}: ContactCreateModalProps) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateContactInput>(EMPTY_FORM);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await contactsService.create(form);
      toast.success("Contact created successfully!");
      setForm(EMPTY_FORM);
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create contact");
    } finally {
      setCreating(false);
    }
  };

  const field =
    <K extends keyof CreateContactInput>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Contact" size="md">
      <div className="c360-section-stack">
        <div className="c360-form-grid">
          <Input
            label="First name"
            value={form.firstName ?? ""}
            onChange={field("firstName")}
          />
          <Input
            label="Last name"
            value={form.lastName ?? ""}
            onChange={field("lastName")}
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email ?? ""}
          onChange={field("email")}
        />
        <Input
          label="Job title"
          value={form.title ?? ""}
          onChange={field("title")}
        />
        <Input
          label="Phone"
          value={form.mobilePhone ?? ""}
          onChange={field("mobilePhone")}
        />
        <p className="c360-text-muted c360-text-sm c360-m-0">
          Location fields are not on{" "}
          <code className="c360-text-xs">CreateContactInput</code> in the
          gateway; use Connectra or edit after sync if your deployment adds
          them.
        </p>
        <div className="c360-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={creating} onClick={handleCreate}>
            Create Contact
          </Button>
        </div>
      </div>
    </Modal>
  );
}
