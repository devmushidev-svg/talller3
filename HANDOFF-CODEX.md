# Brief para Codex — rediseño de UI de Multiplanet

> **Estado: los cuatro lotes están terminados y verificados.** Este documento
> se conserva como referencia de la dirección, los tokens y las reglas. Si
> volvés a abrirlo para trabajo nuevo, releé la sección 6 (cómo verificar):
> las tres trampas que describe se repitieron y cuestan tiempo.

Rama: `rediseno-ui`. Commits base: `dc3ce61` (tokens) y `8d87919` (estados de error).
**Leé esto entero antes de tocar un archivo.** Está escrito para que puedas trabajar
sin haber visto la conversación donde se decidió todo.

---

## 1. Qué es esto

Sistema de tickets de un taller de reparación (impresoras, computadoras, laptops) en
Tocoa, Colón, Honduras. Next 16 + React 19 + Tailwind v4 + shadcn/ui + Supabase.
**El sistema funciona. Lo único que se está cambiando es la interfaz.** No toques
lógica de negocio, endpoints, consultas ni tipos de datos salvo que el brief lo pida.

Se usa en el mostrador, con las manos sucias o con guantes, y también desde el
teléfono. Eso manda sobre cualquier consideración estética.

---

## 2. La dirección visual — esto no se renegocia

> **Taller a oscuras.** Fondo carbón, superficies que suben por capas, tinta casi
> blanca. **El acento es la ausencia de color:** el botón primario es blanco sobre
> negro. Tipografía Geist. Radios moderados, un solo valor por concepto.
> **Prohibido:** ningún degradado, ningún color decorativo, ninguna sombra que no
> separe capas. El único color de la pantalla es el estado del ticket — y por eso
> se lee.

El tema oscuro es el principal. El claro existe y tiene conmutador, pero se diseña
primero el oscuro.

**Se eliminó el violeta y el magenta de toda la app.** Si ves un violeta en algún
lado, es un resto: sacalo.

### Prohibiciones explícitas

| No | Por qué |
|---|---|
| Degradados (`bg-gradient-*`, `text-gradient`, degradados en `style`) | Es la firma más reconocible de app generada a las apuradas. Se quitaron 17. |
| Colores crudos de Tailwind (`bg-green-600`, `text-amber-500`…) | Todo color sale de un token. |
| Verde, ámbar, rojo o cian decorativos | Están reservados a los estados del ticket. Un verde de adorno le quita fuerza al verde que dice "listo". |
| Sombras teñidas (`shadow-primary/25`) | Solo existen dos sombras y son neutras. |
| Chips de ícono de colores distintos en fila | Convierte la pantalla en un arcoíris donde nada destaca. |
| Animaciones decorativas (`float`, `pulse-glow`, `stagger`) | El `stagger` dejaba la barra lateral en blanco medio segundo en cada carga. |
| `alert()` nativo | Usá `toast` de `sonner`, ya montado en `app/layout.tsx`. |

---

## 3. Los tokens — leelos antes de escribir CSS

Todo vive en **`app/globals.css`**. `:root` es el tema claro, `.dark` el oscuro.
**Ninguna pantalla vuelve a escribir un color.**

```
Superficies      --background  --card  --popover  --muted  --secondary  --accent
Tinta            --foreground  --muted-foreground  --secondary-foreground
Acento           --primary / --primary-foreground   (blanco sobre negro en oscuro,
                                                     negro sobre blanco en claro)
Bordes           --border  (decorativo, separa capas)
                 --input   (contorno de CONTROL, verificado a 3:1)
                 --ring    (anillo de foco)
Estados          --st-recibido      --st-recibido-fg
                 --st-diagnostico   --st-diagnostico-fg
                 --st-reparacion    --st-reparacion-fg
                 --st-listo         --st-listo-fg
                 --st-entregado     --st-entregado-fg
Alias            --success/-fg  --warning/-fg  --danger/-fg   (mismos valores)
Radio            --radius (0.625rem). Los demás se derivan en @theme.
Sombras          --shadow-layer  --shadow-float   (y nada más)
```

### Por qué cada estado tiene DOS colores

Esta es la parte importante y la que más fácil se rompe.

El código viejo pintaba el badge así, y estaba mal:

```tsx
// ❌ el texto usa el MISMO color que el tinte del fondo
style={{ backgroundColor: `color-mix(in oklch, ${c} 16%, transparent)`, color: c }}
```

Un color al 16% sobre blanco casi no se oscurece, así que quedaba texto claro sobre
fondo casi blanco. **Medido en el navegador antes del cambio: `en_diagnostico`
1.83:1, `listo` 2.69:1, `en_reparacion` 2.70:1, `recibido` 4.29:1** — cuatro de los
cinco estados por debajo del mínimo de 4.5:1, en el único dato que alguien viene a
leer en esta app.

La solución es el par:

- `--st-x` → **color vivo**: barras, puntos, íconos. Le alcanza con 3:1.
- `--st-x-fg` → **tinta**: el texto sobre el tinte. Necesita 4.5:1. Es otro valor.

Medido después del cambio: **8.32–10.20:1 en oscuro, 4.63–6.46:1 en claro.**

**No repliques el patrón viejo.** Usá el componente que ya existe:

```tsx
import { StatusPill, PaymentPill, statusBase } from '@/components/status-pill'

<StatusPill status={ticket.status} />        // píldora con punto redundante
<PaymentPill status={ticket.payment_status} />
<span style={{ background: statusBase(ticket.status) }} />  // barra sólida
```

Si necesitás un tinte para algo que no es un estado de ticket, usá la utilidad:

```tsx
<div className="estado-tinte" style={{ '--st': 'var(--danger)', color: 'var(--danger-fg)' }}>
```

---

## 4. Lo que ya está hecho — no lo rehagas

- `app/globals.css` reescrito entero. `styles/globals.css` (125 líneas que nadie
  importaba) **borrado**.
- `app/layout.tsx`: se monta `ThemeProvider` (`defaultTheme="dark"`) y `Toaster`.
  Antes ninguno de los dos estaba montado, así que los 85 tokens `.dark` y las 51
  utilidades `dark:` eran **código muerto que nunca corrió**.
- `components/theme-toggle.tsx` nuevo, en el pie de la barra lateral.
- `components/status-pill.tsx`, `components/estado-lista.tsx`, `lib/fetch-lista.ts` nuevos.
- `components/sidebar.tsx`, `components/page-header.tsx`, `components/dashboard-layout.tsx`
  rehechos. El `PageHeader` **ya no acepta `icon`**.
- `components/ui/`: `button`, `input`, `select`, `textarea`, `card`, `badge` ajustados
  (44px táctil, sin sombras de color, radios del token).
- `app/page.tsx` (inicio): 7 tarjetas con 11 números → 2 números grandes accionables
  + una línea de contexto.
- Los 10 `alert()` → `toast`.
- Estados de error en `inventario` e `historial`.

---

## 5. Tu trabajo

Cada lote toca archivos distintos para que nadie pise a nadie. **Claude está
trabajando en el Lote C: no abras esos archivos.**

### Lote A — `app/inventario/page.tsx` y `app/configuracion/page.tsx`

1. **Inventario, fila de métricas.** Hoy muestra 4 tarjetas: "Piezas distintas",
   "Unidades en stock", "Categorías activas", "Resultados visibles". Cada una con un
   chip de ícono de un color distinto (ámbar, verde, azul…). Dos problemas: el
   arcoíris, y que "Resultados visibles" y "Categorías activas" no contestan ninguna
   pregunta real.
   - Preguntá: **¿qué viene a resolver quien abre el inventario?** La respuesta es
     "¿tengo esta pieza, y qué se me está por acabar?".
   - Dejá **un** número grande y accionable. Candidato: piezas con stock bajo o en
     cero. El resto, a una línea de contexto como en `app/page.tsx` (copiá esa forma).
   - Los chips de ícono: todos del mismo color (`text-muted-foreground`) o ninguno.
2. **Configuración.** Tiene dos `color-mix(...)` con `--chart-1` y `--chart-2` en
   chips de ícono decorativos (líneas ~144 y ~212). Sacá el color: un ícono neutro.
3. En los dos archivos: radios de tarjeta a `rounded-2xl`, bordes a `border-border`.

### Lote B — `app/nuevo-ticket/page.tsx` (1017 líneas, el más grande)

1. **Radios.** Hay 5 "tarjetas" con `rounded-xl` y 1 con `rounded-lg` que deberían
   ser `rounded-2xl` como todas las demás (líneas aprox. 447, 525, 665, 695, 797, 851).
   Mismo concepto = mismo radio.
2. **Objetivos táctiles.** Es la pantalla que más se usa y la que peor está. Medido:
   9 controles por debajo de 44px de alto. Ojo: los checkboxes de accesorios miden
   16px pero están envueltos en un `<Label>` con `htmlFor`, así que el objetivo real
   es la etiqueta entera — **eso no es un fallo**, no lo "arregles". Verificá cuál es
   el elemento clicable de verdad antes de cambiar nada.
3. **El bloque de ayuda de teclado** (línea ~446, el que explica `Enter` / `Shift+Enter`):
   ocupa media pantalla en móvil. Colapsalo o movelo a un `Popover` detrás de un
   botón "¿Cómo se usa?".
4. `border-primary/40 bg-primary/5` en el chip de accesorio seleccionado (línea ~798):
   con el acento blanco eso queda raro. Usá `border-input bg-accent`.

### Lote D — componentes de impresión y utilidades

`components/print-options.tsx` (8), `print-internal.tsx` (6), `qr-scanner.tsx` (3),
`customer-history.tsx` (3), `print-customer.tsx` (1), `sidebar.tsx` (1).

**48 utilidades de paleta cruda de Tailwind** en total. Reemplazalas por tokens.

⚠️ **Cuidado, y esto importa:** los hexadecimales `#000` / `#fff` dentro de los
componentes de impresión térmica (`thermal-roll-combined-print.tsx`,
`customer-ticket.tsx`, `device-label.tsx`, `accessory-labels.tsx`,
`ticket-receipt.tsx`) **son correctos y no se tocan**. Una impresora térmica no
tiene tema oscuro. Son 44 de los 48 hexadecimales del repo y están bien.
Lo que sí hay que cambiar son las **clases de Tailwind** (`bg-green-50`,
`text-green-600`, `bg-green-950`…) en la UI *previa* a la impresión.

Los pares `bg-green-50` / `bg-green-950` son modo oscuro escrito a mano: reemplazalos
por **un solo** token que ya se invierte solo.

---

## 6. Cómo verificar — esto no es opcional

**Compilar no es funcionar.** En este mismo rediseño, `tsc` pasó limpio con un
desajuste de hidratación en el conmutador de tema que solo apareció en la consola
del navegador.

### Antes de dar algo por terminado

```bash
npx tsc --noEmit
npm run dev
```

Y con el navegador abierto en la pantalla que tocaste, pegá esto en la consola.
**Mide el color real pintando cada valor en un canvas de 1px**, porque Chrome
serializa estos tokens como `lab()` y `oklab()` y un medidor que solo lee `rgb()`
da falsos positivos en masa (el primer intento marcó 22 de 23 elementos como
ilegibles, y en la captura se leían perfecto):

```js
(()=>{const c=document.createElement('canvas');c.width=c.height=1;
const cv=c.getContext('2d',{willReadFrequently:true});
function paint(ls){cv.clearRect(0,0,1,1);cv.fillStyle='#fff';cv.fillRect(0,0,1,1);
 for(const l of ls){cv.fillStyle='rgba(0,0,0,0)';cv.fillStyle=l;cv.fillRect(0,0,1,1)}
 const d=cv.getImageData(0,0,1,1).data;return[d[0],d[1],d[2]]}
function lum([r,g,b]){const a=[r,g,b].map(v=>{v/=255;
 return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4});
 return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function bgL(el){const o=[];for(let e=el;e;e=e.parentElement){
 const b=getComputedStyle(e).backgroundColor;
 if(b&&b!=='transparent'&&!/,\s*0\)\s*$/.test(b))o.unshift(b);
 if(b&&/^rgb\(\d/.test(b))break}return o}
const hex=v=>'#'+v.map(x=>x.toString(16).padStart(2,'0')).join('');
const malos=[];let n=0;
for(const el of document.querySelectorAll('body *')){
 if(el.closest('nextjs-portal'))continue;
 if(!el.textContent?.trim()||el.children.length)continue;
 const r=el.getBoundingClientRect();if(r.width<1||r.height<1)continue;
 const s=getComputedStyle(el);
 if(s.visibility==='hidden'||s.opacity==='0'||s.display==='none')continue;
 const o=bgL(el);n++;
 const fg=paint([...o,s.color]),bg=paint(o);
 const L1=lum(fg),L2=lum(bg),ra=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
 const fs=parseFloat(s.fontSize),w=parseInt(s.fontWeight)||400;
 const min=(fs>=24||(fs>=18.66&&w>=700))?3:4.5;
 if(ra<min)malos.push({t:el.textContent.trim().slice(0,34),
   r:+ra.toFixed(2),min,px:fs,fg:hex(fg),bg:hex(bg)});}
console.table(malos);
console.log('revisados',n,'fallan',malos.length,
 'overflowX',document.documentElement.scrollWidth-document.documentElement.clientWidth);})()
```

Tiene que dar **`fallan 0`** y **`overflowX 0`**, en los dos temas. Para probar el
claro: `document.documentElement.className=''`; para volver: `='dark'`.

### Errores que ya se cometieron acá — no los repitas

1. **El caché de `.next` sirve CSS viejo.** Cambié dos tokens, reinicié el servidor
   dos veces, y el navegador seguía midiendo los valores anteriores. Parecía que el
   arreglo no funcionaba. Era el caché. Si un cambio de `globals.css` no aparece:
   `rm -rf .next` y volvé a levantar.
2. **No reportes roto lo que la automatización no supo manejar.** El círculo negro
   con una "N" abajo a la izquierda es el indicador de desarrollo de Next, no un bug.
   Un `.focus()` por JavaScript no dispara `:focus-visible`: el anillo de foco de
   esta app **funciona**, comprobalo con Tab de verdad antes de "arreglarlo".
3. **Medí antes de afirmar.** Estuve a punto de reportar que la fuente Geist no
   cargaba y que había dos sistemas de diseño en conflicto. Lo medí: Geist carga
   bien, y el segundo CSS simplemente no lo importaba nadie.
4. **Mirá una captura antes de cambiar algo porque un script lo marcó.**

---

## 7. Lista de verificación por pantalla

- [ ] Cero colores escritos a mano fuera de `app/globals.css`
- [ ] Todo `var(--algo)` que se usa está declarado
- [ ] Un solo radio por concepto (tarjeta = `rounded-2xl`)
- [ ] Todo el texto ≥ 4.5:1, **medido en el navegador**, en los dos temas
- [ ] Contornos de control ≥ 3:1
- [ ] Ningún degradado
- [ ] Objetivos táctiles ≥ 44px (verificando cuál es el elemento clicable real)
- [ ] Anillo de foco visible navegando con Tab
- [ ] Sin desplazamiento horizontal a 375px
- [ ] Cada lista tiene sus cuatro estados: cargando / vacía / sin resultados / error
- [ ] Ninguna tarjeta muestra un número que nadie va a usar
- [ ] Alguien que abre la pantalla por primera vez sabe qué está mirando

Y el que de verdad importa: **abrí la pantalla y preguntate qué viene a resolver
quien la abre.** Si no lo podés contestar en una frase, ningún color lo va a arreglar.
