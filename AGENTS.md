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

- PIX creation and status checks use Fruitfy exclusively from server functions; FRUITFY_API_TOKEN/FRUITFY_STORE_ID stay server-side.
- Parse Fruitfy responses with the shared contract in src/lib/fruitfy.ts before showing a QR code or confirming payment.
