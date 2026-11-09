<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- PIX creation and status checks use the Fruitfy API (api.fruitfy.io) exclusively; the token and Store-Id must remain server-side.
- Every order is charged against the single generic Fruitfy store product at the exact order total, so PIX works for any product in the catalog.
- Parse Fruitfy payment responses with the shared payment contract (src/lib/fruitfy.ts) before displaying a QR code or confirming payment.
