import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Doc Q&A Portal',
  description: 'Ask questions about your documents using AI-powered RAG',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
            <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <a href="/" className="text-xl font-bold text-accent-600 dark:text-accent-400">
                Doc Q&A
              </a>
              <div className="flex gap-6">
                <a
                  href="/"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Ask
                </a>
                <a
                  href="/docs"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Add Documents
                </a>
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--muted)]">
            <p>Doc Q&A Portal - RAG-powered document search</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

