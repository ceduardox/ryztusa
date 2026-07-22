# RYZTOR Shopify Theme

Custom RYZTOR storefront built on Shopify Horizon 4.1.3.

## Store workflow

- Live store: `ryztor.myshopify.com`
- Development theme in Shopify: `RYZTOR Working`
- Shopify theme ID: `188277522728`
- Primary branch: `main`

All design changes should be developed and reviewed in `RYZTOR Working` before publishing.

## Validate

```powershell
npx.cmd -y @shopify/cli theme check --path .
```

## Pull the working theme

```powershell
npx.cmd -y @shopify/cli theme pull --store ryztor.myshopify.com --theme 188277522728 --path .
```

## Push selected files

```powershell
npx.cmd -y @shopify/cli theme push --store ryztor.myshopify.com --theme 188277522728 --path . --only path/to/file
```

Do not use `--allow-live` during normal development.
