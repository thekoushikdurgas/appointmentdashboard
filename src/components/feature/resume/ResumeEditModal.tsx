"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { ResumeRecord } from "@/services/graphql/resumeService";

interface ResumeEditModalProps {
  isOpen: boolean;
  resume: ResumeRecord | null;
  onClose: () => void;
  onSave: (id: string, title: string) => Promise<void>;
}

export function ResumeEditModal({
  isOpen,
  resume,
  onClose,
  onSave,
}: ResumeEditModalProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resume) {
      setTitle((resume.resumeData as { title?: string })?.title ?? "");
    }
  }, [resume]);

  const handleSave = async () => {
    if (!resume || !title.trim()) return;
    setSaving(true);
    try {
      await onSave(resume.id, title.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Resume"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Update
          </Button>
        </>
      }
    >
      <div className="c360-form-group">
        <label className="c360-label" htmlFor="resume-title-edit">
          Title
        </label>
        <input
          id="resume-title-edit"
          className="c360-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Software Engineer Resume"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </div>
    </Modal>
  );
}
