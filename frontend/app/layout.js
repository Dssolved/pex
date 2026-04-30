import "./globals.css";

export const metadata = {
  title: "PEX",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
