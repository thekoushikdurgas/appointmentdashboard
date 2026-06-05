"use client";

import { Search, CheckCircle, Activity } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { PhoneFinderSingleTab } from "@/components/feature/phone/PhoneFinderSingleTab";
import { PhoneVerifierSingleTab } from "@/components/feature/phone/PhoneVerifierSingleTab";
import { PhoneJobStatusTab } from "@/components/feature/phone/PhoneJobStatusTab";

export default function PhonePage() {
  return (
    <DashboardPageLayout>
      <Tabs
        defaultValue="finder-single"
        variant="floating"
        className="c360-tabs--phone c360-tabs--floating-bottom c360-phone-tool-page"
      >
        <TabsList>
          <TabsTrigger value="finder-single" icon={<Search size={16} />}>
            Finder
          </TabsTrigger>
          <TabsTrigger value="verifier-single" icon={<CheckCircle size={16} />}>
            Verifier
          </TabsTrigger>
          <TabsTrigger value="job-status" icon={<Activity size={16} />}>
            Job status
          </TabsTrigger>
        </TabsList>
        <TabsContent value="finder-single" className="c360-mt-6">
          <PhoneFinderSingleTab />
        </TabsContent>
        <TabsContent value="verifier-single" className="c360-mt-6">
          <PhoneVerifierSingleTab />
        </TabsContent>
        <TabsContent value="job-status" className="c360-mt-6">
          <PhoneJobStatusTab />
        </TabsContent>
      </Tabs>
    </DashboardPageLayout>
  );
}
