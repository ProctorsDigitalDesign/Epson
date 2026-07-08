import "./globals.css";

export const metadata = {
  title: "Epson Classroom Simulator | See Every Seat Clearly",
  description:
    "Visualise how Epson projectors transform classroom visibility using the industry-standard 4/6/8 rule. Configure your room, choose a projector, and download a board-ready PDF report.",
  keywords: ["Epson", "classroom", "projector", "visibility", "education", "4/6/8 rule", "simulator"],
  authors: [{ name: "Epson Education" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
