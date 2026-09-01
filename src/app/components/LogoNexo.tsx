/**
 * Logo de Nexo pintado con el gradiente de marca.
 *
 * El único asset que existe es `logo.png` en BLANCO, pensado para fondos
 * oscuros. Sobre el tema claro quedaba blanco sobre blanco, o sea invisible.
 *
 * En vez de pedir un asset nuevo, se usa el PNG como MÁSCARA: el navegador toma
 * su canal alfa y lo rellena con el gradiente violeta→rosa. Así el logo queda
 * en color de marca sobre fondo claro, sin depender de que alguien exporte otra
 * versión, y si mañana cambia el gradiente cambia también el logo.
 *
 * `variante="blanco"` conserva el render original para las superficies oscuras
 * que siguen existiendo (el admin).
 */
export default function LogoNexo({
  alto = 88,
  variante = 'marca',
  className = '',
}: {
  alto?: number
  variante?: 'marca' | 'blanco'
  className?: string
}) {
  const mascara = {
    maskImage: 'url(/logo.png)',
    WebkitMaskImage: 'url(/logo.png)',
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  } as const

  return (
    <span
      role="img"
      aria-label="Previnca Nexo"
      className={className}
      style={{
        display: 'block',
        /* Se centra solo: es un bloque de ancho fijo, y `text-center` del
           contenedor no lo alcanza. Asi funciona en las seis pantallas que lo
           usan sin que cada una tenga que acordarse. */
        marginInline: 'auto',
        height: `${alto}px`,
        /* El PNG es apaisado (~2.5:1). Se fija el ancho por aspect-ratio para
           que la máscara no se recorte ni deforme. */
        width: `${Math.round(alto * 2.5)}px`,
        background:
          variante === 'blanco'
            ? '#ffffff'
            : 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
        ...mascara,
      }}
    />
  )
}
