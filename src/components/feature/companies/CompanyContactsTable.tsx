"use client";

import { useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import {
  ContactsDataTable,
  type ContactsDataTableColumnId,
} from "@/components/feature/contacts/ContactsDataTable";
import { Pagination } from "@/components/ui/Pagination";
import type { Contact } from "@/services/graphql/contactsService";

const EMBEDDED_VISIBLE_COLUMNS: ContactsDataTableColumnId[] = [
  "name",
  "title",
  "department",
  "region",
  "email",
  "added",
  "action",
];

interface CompanyContactsTableProps {
  companyName: string;
  contacts: Contact[];
  loading: boolean;
  error?: string | null;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function CompanyContactsTable({
  companyName,
  contacts,
  loading,
  error = null,
  page,
  total,
  pageSize,
  onPageChange,
  sortBy,
  onSortChange,
}: CompanyContactsTableProps) {
  const noop = useCallback(() => {}, []);
  const noopId = useCallback((_id: string) => {}, []);
  const noopIds = useCallback((_ids: string[]) => {}, []);
  const noopSize = useCallback((_n: number) => {}, []);

  const rowsWithCompany = useMemo(
    () => contacts.map((c) => ({ ...c, company: companyName })),
    [contacts, companyName],
  );

  return (
    <>
      <Card padding="none">
        <div className="c360-p-0">
          <ContactsDataTable
            className="c360-company-contacts-dt"
            contacts={rowsWithCompany}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={noopSize}
            loading={loading}
            error={error}
            search=""
            onSearchChange={noop}
            sortBy={sortBy}
            onSortChange={onSortChange}
            embeddedServerSort
            selected={[]}
            onSelectionChange={noopIds}
            expandedRow={null}
            onToggleExpand={noopId}
            visibleColumns={EMBEDDED_VISIBLE_COLUMNS}
            showToolbarSearch={false}
            showColumnPicker={false}
            showPageSizeControl={false}
            showPaginationFooter={false}
            embedded
          />
        </div>
      </Card>

      {total > pageSize ? (
        <div className="c360-company-contacts-dt__pagination c360-flex c360-justify-end c360-mt-3">
          <Pagination
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </>
  );
}
