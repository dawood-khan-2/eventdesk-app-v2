"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export const BookDemoButton = () => {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "demo-of-eventdesk" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <Button
      variant="outline"
      data-cal-namespace="demo-of-eventdesk"
      data-cal-link="raja-ramachandran-br5zin/demo-of-eventdesk"
      data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
    >
      Book a Demo
    </Button>
  );
};
