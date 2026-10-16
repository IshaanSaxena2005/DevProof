import { DemoProvider } from "./DemoContext";
import DashboardLayout from "../layouts/DashboardLayout";

/**
 * The `/demo` shell.
 *
 * It renders the *real* dashboard layout — same sidebar, same header, same video
 * background — inside a `DemoProvider`. That is the whole trick: the demo is the
 * product, wearing a badge, reading sample data. A separate demo-only layout
 * would drift from the real one and stop demonstrating it.
 *
 * Nothing here authenticates. The visitor stays signed out; the pages below ask
 * the context whether they are in the demo and, if so, read the sample dataset
 * instead of calling the API.
 */
export default function DemoShell() {
  return (
    <DemoProvider>
      <DashboardLayout />
    </DemoProvider>
  );
}
