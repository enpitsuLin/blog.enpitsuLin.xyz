import React from 'react';
import logo from './logo.svg';
import { PageContextProvider } from './usePageContext';
import { Link } from './Link';
import type { PageContext } from './types';

export { PageWrapper };

function PageWrapper({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <Layout>
          <Sidebar>
            <Logo />
            <Link className="py-1 px-2" href="/">
              Home
            </Link>
            <Link className="py-1 px-2" href="/dynamic">
              Dynamic
            </Link>
            <Link className="py-1 px-2" href="/static">
              Static
            </Link>
            <Link className="py-1 px-2" href="/isr">
              ISR
            </Link>
            <Link className="py-1 px-2" href="/named/id-1">
              Named
            </Link>
            <Link className="py-1 px-2" href="/catch-all/a/b/c">
              Catch-all
            </Link>
            <Link className="py-1 px-2" href="/function/a">
              Function
            </Link>
            <Link className="py-1 px-2" href="/edge">
              Edge Function endpoint
            </Link>
          </Sidebar>
          <Content>{children}</Content>
        </Layout>
      </PageContextProvider>
    </React.StrictMode>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        maxWidth: 900,
        margin: 'auto'
      }}
    >
      {children}
    </div>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 20,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: '1.8em'
      }}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 20,
        paddingBottom: 50,
        borderLeft: '2px solid #eee',
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 10
      }}
    >
      <a href="/">
        <img src={logo} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
