"use client";

import { Header } from "../components/header";
import { BillsClient } from "./components/bills-client";

export default function BillsPage() {
  return (
    <>
      <Header page="Bills" pages={["Home"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <BillsClient
          initialBills={[]}
          initialPage={1}
          initialSearch=""
          initialTotalPages={1}
        />
      </div>
    </>
  );
}
