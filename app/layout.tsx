import "@/app/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "P2P CSV Generator",
  description: "Generate P2P CSV datasets with anomalies"
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header>
            <h1>P2P CSV Generator</h1>
            <p>Generate deterministic P2P datasets with controlled anomalies.</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
