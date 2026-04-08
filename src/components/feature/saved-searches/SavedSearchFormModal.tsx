"use client";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const TYPE_OPTIONS = [
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "all", label: "All" },
];

export interface SavedSearchFormState {
  name: string;
  type: string;
  description: string;
  searchTerm: string;
}

interface CreateModalProps {
  open: boolean;
  form: SavedSearchFormState;
  loading: boolean;
  onClose: () => void;
  onChange: (form: SavedSearchFormState) => void;
  onSubmit: () => void;
}

export function SavedSearchCreateModal({
  open,
  form,
  loading,
  onClose,
  onChange,
  onSubmit,
}: CreateModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="New Saved Search"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={onSubmit}
            disabled={!form.name || !form.type}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="c360-section-stack">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="My contacts search"
          required
        />
        <div>
          <label className="c360-form-label-block">Type</label>
          <Select
            value={form.type}
            onChange={(e) => onChange({ ...form, type: e.target.value })}
            options={TYPE_OPTIONS}
            className="c360-w-full"
          />
        </div>
        <Input
          label="Search term (optional)"
          value={form.searchTerm}
          onChange={(e) => onChange({ ...form, searchTerm: e.target.value })}
          placeholder="e.g. software engineer"
        />
        <Input
          label="Description (optional)"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Brief description"
        />
      </div>
    </Modal>
  );
}

interface EditModalProps {
  open: boolean;
  form: SavedSearchFormState;
  loading: boolean;
  onClose: () => void;
  onChange: (form: SavedSearchFormState) => void;
  onSubmit: () => void;
}

export function SavedSearchEditModal({
  open,
  form,
  loading,
  onClose,
  onChange,
  onSubmit,
}: EditModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Edit Saved Search"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={loading} onClick={onSubmit} disabled={!form.name}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="c360-section-stack">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Search term (optional)"
          value={form.searchTerm}
          onChange={(e) => onChange({ ...form, searchTerm: e.target.value })}
        />
        <Input
          label="Description (optional)"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>
    </Modal>
  );
}

interface DeleteModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SavedSearchDeleteModal({
  open,
  loading,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Delete Saved Search"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <p>
        Are you sure you want to delete this saved search? This cannot be
        undone.
      </p>
    </Modal>
  );
}
