# wally-ahmed.github.io

Personal site — [wally-ahmed.github.io](https://wally-ahmed.github.io)

Built with [Astro](https://astro.build) and Tailwind CSS. Static, with a single
React island for the animated hero. Deployed to GitHub Pages by GitHub Actions
on every push to `main`.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run check    # type + template diagnostics
```

## Adding a project

Projects are content-collection entries — one Markdown file each in
`src/content/projects/`, validated by a Zod schema in `src/content.config.ts`.
Adding one means adding a file; no markup changes.

Entries are either `kind: win` (a placed hackathon project, which must carry an
award, a live URL and a screenshot) or `kind: oss` (a released tool, which must
carry an install command). The schema enforces that — a `win` without something
to click fails the build rather than shipping an unverifiable claim.
