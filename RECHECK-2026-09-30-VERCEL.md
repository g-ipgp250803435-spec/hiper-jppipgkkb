# Vercel Recheck — 2026-09-30

## Vercel failure reproduced from build log

The reported compiler error was:

`src/pages/TempahanPage.tsx(326,11): TS2345: Argument of type '{} | null' is not assignable to parameter of type 'string | null | undefined'.`

## Root cause

`processRoomBookingRpcResponse()` described `data` as `Record<string, unknown>`. Therefore `outcome.data?.id` had type `unknown` instead of the UUID/string expected by `notifyAdmins()`.

## Fix

`src/lib/bookingService.ts` now defines `RoomBookingRpcData` with:

```ts
id?: string | null
```

Both the raw RPC result and processed outcome use that type. This fixes the type at the service boundary instead of suppressing the compiler with a type assertion in the page.

## Verification notes

- The exact failing call in `TempahanPage.tsx` now receives `string | null` for `newRecId`.
- Project JSON files parse successfully.
- A repository-wide search found no other uses of `outcome.data?.id` with this helper.
- Local `npm ci` could not complete in the inspection sandbox because dependency installation repeatedly timed out and left `node_modules` incomplete. The resulting missing `@types/*` diagnostics are environmental, not the Vercel error above.
- Vercel successfully installed dependencies in the supplied log, so redeploying this commit is the authoritative full build check.

## What to do

Commit/push this repaired project, then redeploy on Vercel. If Vercel exposes another TypeScript/build error after this one is removed, copy the full new build log back into ChatGPT for the next pass.
