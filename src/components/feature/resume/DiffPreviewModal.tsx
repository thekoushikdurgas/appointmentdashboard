"use client";

import type { ResumeFieldDiff } from "@/lib/resumeAiClient";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface DiffPreviewModalProps {
  open: boolean;
  onClose: () => void;
  changes: ResumeFieldDiff[] | null | undefined;
  onConfirm: () => void;
  confirming?: boolean;
}

export function DiffPreviewModal({
  open,
  onClose,
  changes,
  onConfirm,
  confirming,
}: DiffPreviewModalProps) {
  const list = changes ?? [];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Review AI changes"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={confirming}
            onClick={() => void onConfirm()}
          >
            Save tailored résumé
          </Button>
        </>
      }
    >
      {list.length === 0 ? (
        <p className="c360-text-muted c360-text-sm">
          No granular diff metadata returned — you can still confirm if the preview
          JSON looks correct on the server response.
        </p>
      ) : (
        <div className="c360-overflow-x-auto">
          <table className="c360-w-full c360-text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Path</th>
                <th>Type</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => (
                <tr key={`${c.field_path}-${i}`}>
                  <td>
                    <code className="c360-mono">{c.field_path}</code>
                  </td>
                  <td>{c.change_type}</td>
                  <td className="c360-max-w-md">
                    <div className="c360-text-xs c360-text-muted">Was</div>
                    <div className="c360-mb-2">{c.original_value ?? "—"}</div>
                    <div className="c360-text-xs c360-text-muted">Now</div>
                    <div>{c.new_value ?? "—"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
