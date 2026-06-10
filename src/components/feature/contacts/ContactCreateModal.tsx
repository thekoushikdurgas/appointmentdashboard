"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  contactsService,
  type Contact,
} from "@/services/graphql/contactsService";
import type {
  CreateContactInput,
  UpdateContactInput,
} from "@/graphql/generated/types";
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
  /** Called after a successful create or update */
  onCreated: () => void;
  /** When set, the modal updates this contact instead of creating */
  editContact?: Contact | null;
}

export function ContactCreateModal({
  isOpen,
  onClose,
  onCreated,
  editContact = null,
}: ContactCreateModalProps) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateContactInput>(EMPTY_FORM);

  const isEdit = Boolean(editContact);

  useEffect(() => {
    if (!isOpen) return;
    if (editContact) {
      setForm({
        firstName: editContact.firstName ?? "",
        lastName: editContact.lastName ?? "",
        email: editContact.email ?? "",
        title: editContact.title ?? "",
        mobilePhone: editContact.phone ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, editContact]);

  const handleSubmit = async () => {
    setCreating(true);
    try {
      if (editContact) {
        const input: UpdateContactInput = {
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          email: form.email || undefined,
          title: form.title || undefined,
          mobilePhone: form.mobilePhone || undefined,
        };
        await contactsService.update(editContact.id, input);
        toast.success("Contact updated successfully!");
      } else {
        await contactsService.create(form);
        toast.success("Contact created successfully!");
      }
      setForm(EMPTY_FORM);
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save contact");
    } finally {
      setCreating(false);
    }
  };

  const field =
    <K extends keyof CreateContactInput>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit contact" : "Add New Contact"}
      size="md"
    >
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
          gateway; import or edit after sync if your deployment adds them.
        </p>
        <div className="c360-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={creating} onClick={() => void handleSubmit()}>
            {isEdit ? "Save changes" : "Create Contact"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
