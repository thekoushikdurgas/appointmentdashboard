"use client";

import { Search, Users, CheckCircle, List, Globe, AtSign } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmailFinderSingleTab } from "@/components/feature/email/EmailFinderSingleTab";
import { EmailBulkFinderTab } from "@/components/feature/email/EmailBulkFinderTab";
import { EmailBulkVerifierTab } from "@/components/feature/email/EmailBulkVerifierTab";
import { EmailVerifierTab } from "@/components/feature/email/EmailVerifierTab";
import { EmailWebSearchTab } from "@/components/feature/email/EmailWebSearchTab";
import { EmailPatternsTab } from "@/components/feature/email/EmailPatternsTab";

export default function EmailPage() {
  return (
    <DashboardPageLayout>
      <Tabs
        defaultValue="finder-single"
        variant="floating"
        className="c360-tabs--email c360-tabs--floating-bottom"
      >
        <TabsList>
          <TabsTrigger value="finder-single" icon={<Search size={16} />}>
            Single Finder
          </TabsTrigger>
          <TabsTrigger value="finder-bulk" icon={<Users size={16} />}>
            Bulk Finder
          </TabsTrigger>
          <TabsTrigger value="verifier-single" icon={<CheckCircle size={16} />}>
            Single Verifier
          </TabsTrigger>
          <TabsTrigger value="verifier-bulk" icon={<List size={16} />}>
            Bulk Verifier
          </TabsTrigger>
          <TabsTrigger value="web-search" icon={<Globe size={16} />}>
            Web Search
          </TabsTrigger>
          <TabsTrigger value="patterns" icon={<AtSign size={16} />}>
            Email Patterns
          </TabsTrigger>
        </TabsList>
        <TabsContent value="finder-single" className="c360-mt-6">
          <EmailFinderSingleTab />
        </TabsContent>
        <TabsContent value="finder-bulk" className="c360-mt-6">
          <EmailBulkFinderTab />
        </TabsContent>
        <TabsContent value="verifier-single" className="c360-mt-6">
          <EmailVerifierTab />
        </TabsContent>
        <TabsContent value="verifier-bulk" className="c360-mt-6">
          <EmailBulkVerifierTab />
        </TabsContent>
        <TabsContent value="web-search" className="c360-mt-6">
          <EmailWebSearchTab />
        </TabsContent>
        <TabsContent value="patterns" className="c360-mt-6">
          <EmailPatternsTab />
        </TabsContent>
      </Tabs>
    </DashboardPageLayout>
  );
}
