# Painel de Veículos — Vitória Motors BYD Vila Velha

Sistema web (celular e computador) para acompanhar onde está e em que etapa está cada carro BYD, do HUB até a entrega.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e envie **todo o conteúdo desta pasta** (index.html na raiz).
2. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.
3. Em 1–2 minutos o endereço aparece no topo da página de Pages (ex.: `https://SEU-USUARIO.github.io/painel-veiculos/`).

## Configuração
- `js/painel-config.js` — endereço e chave **publishable** do Supabase (pode ficar pública; a segurança está nas regras do banco). Nunca coloque a chave *secret* aqui.
- No Supabase, em **Authentication → URL Configuration**, coloque o endereço do GitHub Pages em *Site URL*.

## Banco (já feito neste projeto)
Os arquivos em `supabase/` são os SQL usados: `schema.sql`, `importacao.sql`, `usuarios.sql`, `usuario-admin.sql`, `remover-denza-yaris.sql`.

## Planilhas
Administrador/Supervisora: **Usuários → Cargas de planilha → Escolher planilha** (HUB SERRA primeiro, depois AGENDA). Só entram veículos com MARCA = BYD; Yaris e Denza são ignorados.
