import React from "react";
import { FONT, SiteHeader } from "./SiteLayout";

// Same header as the public website, shown above login / signup and other
// logged-out pages so the whole site looks consistent.
const SiteHeaderWithFont = () => (
  <div className="cisd-site">
    <style>{FONT}</style>
    <SiteHeader />
  </div>
);

export default SiteHeaderWithFont;
