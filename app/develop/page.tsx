'use client';

import { CodeBlock } from '@ui/CodeBlock';
import { DocPage } from '@ui/DocPage';
import { Card, Cards } from '@ui/Card';
import { DEPENDENCIES, ENTRY_POINTS, PEERS, VERSION } from '@ui/package';

const INSTALL = `npm install alpenglow

import 'alpenglow/styles.css';
import { Button } from 'alpenglow';`;

/**
 * The Developers section: how the package reaches an app, and the two
 * things a consumer decides once — whether Tailwind reads the tokens, and
 * how the theme is chosen.
 */
export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>alpenglow {VERSION}</p>
          <p>{ENTRY_POINTS} entry points</p>
          <p>
            {PEERS.length} peers, {DEPENDENCIES} dependencies
          </p>
        </>
      }
    >
      <div className="hero">
        <div>
          <h1>Developers</h1>
          <p className="lead">
            One package, one stylesheet, and components that render on the server. What follows
            is everything an app has to decide, in the order it decides it.
          </p>
        </div>
        <CodeBlock lang="ts" code={INSTALL} />
      </div>

      <h2>In this section</h2>
      <Cards>
        <Card
          href="/install"
          title="Install"
          description="The package, its stylesheet, and a first component in a Next.js or Vite app."
        />
        <Card
          href="/tailwind"
          title="Tailwind"
          description="The tokens as a Tailwind v4 theme, pointing at the same variables."
        />
        <Card
          href="/dark-mode"
          title="Dark mode"
          description="One attribute on the root, a script that runs before the first paint, and what changes with the light."
        />
      </Cards>
    </DocPage>
  );
}
