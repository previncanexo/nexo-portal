'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { initiatePayment } from './actions'

const TYC_TEXT = `TÉRMINOS Y CONDICIONES

CLAUSULA 1: IDENTIFICACIÓN DEL PRESTADOR Y OBJETO DEL SERVICIO DE INTERMEDIACIÓN

Previnca S.A. CUIT: 30-68914068-4, en adelante "Previnca Salud", opera exclusivamente como una plataforma digital de intermediación y gestión de servicios de salud. Su objeto principal es facilitar a los usuarios el acceso a una red de prestadores médicos, asistenciales, odontológicos y de emergencias que son terceros independientes, (en adelante, los "Prestadores").

Previnca Salud no es prestador directo de servicios de salud en los términos de la Ley N° 26.682 y su reglamentación. La relación contractual de Previnca Salud con el usuario se limita a la provisión de la plataforma tecnológica, los servicios de intermediación para la gestión de turnos, el acceso a información de los Prestadores y la administración de beneficios asociados a la afiliación.

La prestación efectiva de los servicios de salud, incluyendo diagnósticos, actos médicos, odontológicos o de emergencias, es responsabilidad exclusiva de los Prestadores. Estos actúan de forma independiente y bajo su propia dirección y control, siendo los únicos responsables por la calidad, idoneidad, oportunidad o resultado de las prestaciones médicas brindadas, así como por los daños que pudieran derivarse de su atención directa.

Previnca Salud no asume responsabilidad por los actos u omisiones de los Prestadores, ni por la calidad de los servicios médicos que estos brinden, salvo por el incumplimiento de sus propias obligaciones como intermediario y gestor de la plataforma, o por la falta de diligencia en la provisión de su servicio tecnológico. La responsabilidad de Previnca Salud se enmarcará en su rol de facilitador tecnológico, no de garante de los resultados médicos de terceros.

CLAUSULA 2. OBJETO DEL SERVICIO Y MODALIDAD DE AFILIACIÓN

La afiliación a NEXO se realiza de forma exclusivamente digital, a través de la plataforma tecnológica provista por la empresa. Mediante este proceso, el usuario declara haber leído, comprendido y aceptado los presentes Términos y Condiciones, constituyendo su consentimiento electrónico un acuerdo de voluntades válido y vinculante. Previnca Salud, en su rol de intermediario y gestor de servicios de salud, facilita el acceso a una red de Prestadores y a un conjunto de prestaciones de salud que se detallan en el plan. La información sobre las características esenciales de los servicios y las condiciones de su comercialización será provista de forma cierta, clara y detallada.

El acceso efectivo a las prestaciones y servicios se encuentra estrictamente supeditado al cumplimiento concurrente de los siguientes requisitos: a) la correcta finalización del proceso de afiliación digital y b) la acreditación del pago de la cuota correspondiente al período en curso.

Adicionalmente a las prestaciones incluidas en la afiliación, el usuario tendrá la posibilidad de contratar prestaciones adicionales bajo demanda ("pay per use") a través de la plataforma. Estas prestaciones no forman parte de la tarifa de afiliación básica y serán abonadas de forma individual al momento de su solicitud. Los precios de estos servicios adicionales, así como cualquier coseguro asociado a las prestaciones, serán informados de manera clara y fehaciente al usuario antes de su contratación, y cualquier variación en sus valores será notificada con la antelación legalmente requerida.

CLÁUSULA 3: ÁMBITO GEOGRÁFICO DE COBERTURA Y MODIFICACIONES

El servicio de intermediación y gestión de prestaciones de salud de Previnca Salud se encuentra disponible, al momento de la afiliación digital del usuario, exclusivamente en la zona geográfica de la Ciudad de Rosario, Granadero Baigorria y Villa Gobernador Gálvez. Esta delimitación inicial de la zona de cobertura será informada de manera clara, precisa y veraz al usuario antes de la contratación, y su aceptación mediante el "click" de alta implicará la conformidad con este ámbito geográfico específico.

Cualquier modificación que implique una alteración en el ámbito geográfico de las prestaciones será comunicada a los usuarios a través del sitio web nexo.previncasalud.com.ar.

CLÁUSULA 4: CONDICIONES DE AFILIACIÓN Y VERACIDAD DE LA INFORMACIÓN

A los fines de la afiliación a NEXO, será requisito excluyente que el titular sea mayor de edad, debiendo contar con dieciocho (18) años cumplidos al momento de la solicitud.

La afiliación implica la aceptación expresa e incondicional de la totalidad de los presentes Términos y Condiciones, así como de las políticas y procedimientos que los complementen, lo cual se formalizará mediante el consentimiento electrónico del usuario al momento de completar el proceso de alta digital.

CLÁUSULA 5: MODALIDAD DE CONTRATACIÓN Y CONSENTIMIENTO ELECTRÓNICO

La contratación de los servicios de Previnca Salud se realiza de forma 100% digital, en la modalidad de comercio electrónico (e-commerce), a través de la plataforma web nexo.previncasalud.com.ar. Esta modalidad se encuadra dentro de los contratos celebrados a distancia, entendiendo por tales aquellos concluidos con el uso exclusivo de medios de comunicación electrónicos, sin la presencia física simultánea de las partes. El consentimiento del usuario se perfecciona mediante la aceptación expresa de los presentes Términos y Condiciones a través de un "click" en el botón o ícono correspondiente ("clickwrap") en la plataforma digital.

CLÁUSULA 6: SERVICIOS INCLUIDOS EN LA AFILIACIÓN Y SUS CONDICIONES

La afiliación a NEXO y la acreditación del pago de la cuota correspondiente al período en curso otorga al usuario acceso a un conjunto de CUATRO prestaciones de salud específicamente incluidas en la tarifa de afiliación, detalladas a continuación.

1. Telemedicina: La telemedicina se entiende como un servicio asistencial y/o consulta realizada a distancia, utilizando tecnologías adecuadas para garantizar la prestación oportuna y de calidad, especialmente en un contexto de demanda esencial. Previnca Salud determinará la cantidad de sesiones o consultas autorizadas y los procesos de auditoría de estas prestaciones.

2. Guardias Odontológicas: Se facilitará el acceso a guardias odontológicas a través de un prestador tercerizado. El alcance del servicio de urgencia odontológica abarca únicamente las prácticas de medicación, radiografías y apertura de piezas dentarias con fines paliativos. El tratamiento posterior y definitivo de la pieza dentaria no se encuentra incluido en esta modalidad de atención.

3. Emergencias médicas: El servicio de atención médica se limita de manera exclusiva a las prestaciones derivadas de emergencias y urgencias médicas. Queda expresamente excluido de la presente cobertura el servicio de consulta o visita médica programada a domicilio.

4. Descuentos en Farmacia: Los usuarios afiliados tendrán acceso a descuentos en farmacia a través de una red de prestadores cerrada y un vademécum acotado, según los acuerdos establecidos con el colegio farmacéutico.

Previnca Salud, en su rol de intermediario, se esforzará por garantizar la continuidad y calidad de los servicios, pero no asume la responsabilidad directa por la prestación médica en sí, la cual recae en los Prestadores. En caso de que alguna prestación implique un coseguro, su valor será debidamente informado al momento de la afiliación.

CLÁUSULA 7: SERVICIOS ADICIONALES (ON-DEMAND)

Adicionalmente a las prestaciones incluidas en la afiliación básica, NEXO ofrece a sus usuarios la posibilidad de contratar servicios de salud adicionales bajo demanda ("pay per use") a través de su plataforma digital. Estas prestaciones no forman parte de la tarifa de afiliación mensual y serán abonadas de forma individual por el usuario al momento de su solicitud y confirmación.

CLÁUSULA 8: ZONAS RESTRINGIDAS O DE RIESGO PARA LA PRESTACIÓN DE SERVICIOS

Previnca Salud, en su compromiso de garantizar la seguridad y calidad de la atención sanitaria, así como la integridad física de los Prestadores, se reserva la facultad de no prestar servicios en determinadas zonas geográficas que, por razones objetivas de seguridad pública o riesgo inminente para la vida o integridad de las personas, sean calificadas como "zonas restringidas" o "zonas rojas". Esta delimitación del riesgo se fundamenta en la necesidad de proteger al personal que debe concurrir a brindar las prestaciones, y no implicará un incumplimiento contractual por parte de Previnca Salud. La calificación de una zona como restringida o de riesgo se basará en criterios objetivos y verificables, y no en el mero arbitrio de Previnca Salud.

CLÁUSULA 9: OBLIGACIONES DEL USUARIO

El usuario de Previnca Salud se compromete a cumplir con las siguientes obligaciones, esenciales para la correcta prestación y aprovechamiento de los servicios de intermediación y gestión de salud, en un marco de buena fe y colaboración mutua:

1. Uso Adecuado del Servicio y Cooperación: El usuario se obliga a utilizar la plataforma y los servicios ofrecidos por Previnca Salud de manera diligente y responsable, siguiendo las indicaciones y protocolos establecidos para cada prestación. Esto incluye, pero no se limita a, cumplir con las indicaciones médicas o de los Prestadores y cooperar activamente en su propio proceso de atención de salud. La falta de colaboración del paciente con el profesional puede ser un factor relevante en la evaluación de la responsabilidad.

2. Veracidad y Actualización de la Información: El usuario deberá proporcionar información completa, clara y veraz sobre su identidad, datos de contacto y estado de salud al momento de la afiliación y cada vez que le sea requerida para la prestación de un servicio. Asimismo, se compromete a mantener actualizada dicha información. La falsedad, inexactitud u omisión deliberada de datos o información relevante, que demuestre una conducta de mala fe, podrá dar lugar a la resolución del contrato por parte de Previnca Salud, siempre que se acredite fehacientemente la mala fe del usuario en los términos del artículo 961 del Código Civil y Comercial de la Nación.

3. Trato Digno y Respetuoso: El usuario se compromete a dispensar un trato digno y respetuoso al personal de los Prestadores y a cualquier otro profesional o auxiliar que intervenga en la prestación de los servicios, así como a sus familiares o acompañantes, en consonancia con el derecho del paciente a un trato digno y respetuoso.

4. Permitir Acceso al Domicilio: En aquellos casos en que la naturaleza del servicio lo requiera (ej. atención de urgencias médicas domiciliarias), el usuario se obliga a permitir el acceso seguro y oportuno del personal de los Prestadores a su domicilio o al lugar donde se encuentre el paciente, una vez coordinada la atención.

CLÁUSULA 10: PRECIO Y FORMA DE PAGO

El usuario se obliga al pago de los costos de afiliación, suscripción mensual y, en su caso, de los servicios adicionales contratados bajo demanda ("pay per use"), conforme a los valores y condiciones que se detallan en el plan de afiliación y en la información específica de cada servicio. Previnca Salud se compromete a suministrar al usuario, de forma cierta, clara y detallada, toda la información relacionada con las características esenciales de los servicios y las condiciones de su comercialización, incluyendo su cuantía, modo de determinación o actualización, y la existencia de aranceles complementarios o coseguros.

Previnca Salud podrá establecer libremente los valores de las cuotas de los planes de salud ofrecidos durante toda la vigencia del contrato, y el porcentaje de ajuste podrá variar según las características específicas del plan.

Los métodos de pago aceptados por Previnca Salud incluyen, entre otros, la utilización de plataformas de pago digital como Mercado Pago y otras billeteras virtuales, así como la generación de links de pago. El proceso de alta y la gestión de pagos se realizará a través de la plataforma digital de Previnca Salud, donde el usuario podrá vincular sus medios de pago. Los pagos realizados mediante códigos de respuesta rápida (QR) se considerarán medios de pago equivalentes. En caso de generarse cuentas pendientes de pago en la billetera virtual del usuario o mediante links de pago, Previnca Salud notificará al usuario para su regularización.

CLÁUSULA 11: REVOCACIÓN DE LA ACEPTACIÓN, SUSPENSIÓN Y BAJA DEL SERVICIO

Revocación de la aceptación: El usuario tiene derecho a revocar la aceptación del servicio contratado dentro del plazo de diez (10) días corridos contados a partir de la fecha de la afiliación. A tal efecto, podrá utilizar el "Botón de Arrepentimiento" dispuesto de manera visible en la plataforma web. Constituye una condición esencial e indispensable para la procedencia de esta revocación que el servicio no haya sido utilizado dentro del mencionado plazo.

Suspensión del servicio: La falta de pago de una (1) cuota mensual facultará a la Compañía a disponer la suspensión automática del servicio. Previnca Salud notificará la suspensión e intimará al usuario al pago de la suma adeudada.

La extinción del vínculo contractual con Previnca Salud puede originarse por decisión del usuario o por resolución de Previnca Salud, conforme a las siguientes condiciones:

1. Rescisión por Decisión del Usuario: El usuario podrá rescindir el contrato de afiliación en cualquier momento, sin limitación alguna y sin penalidad. Para evitar el ejercicio abusivo de este derecho, el mismo podrá ser ejercido solamente una (1) vez por año. La solicitud de baja podrá realizarse a través de la plataforma digital de Previnca Salud, mediante un mecanismo de "botón de baja" de fácil acceso y directo, que simplifique la gestión y agilice el proceso.

2. Resolución por Parte de Previnca Salud: Previnca Salud podrá resolver el vínculo contractual únicamente por las siguientes causales: a) Por falta de pago: En caso de falta de pago de tres (3) cuotas íntegras y consecutivas, Previnca Salud podrá resolver el vínculo contractual de manera automática, con la finalidad de impedir el devengamiento de nuevos períodos de facturación, notificando al usuario de la resolución. b) Por falsedad de los datos brindados.

CLÁUSULA 12: MODIFICACIÓN DE TÉRMINOS Y CONDICIONES

Previnca Salud se reserva la facultad de modificar los presentes Términos y Condiciones en cualquier momento. En caso de que el usuario no esté de acuerdo con las modificaciones introducidas, tendrá la opción de rescindir el contrato sin cargo ni penalidad alguna, ejerciendo su derecho de baja conforme a lo establecido en la Cláusula 11, sin que ello genere derecho a indemnización alguna por parte de Previnca Salud.

CLÁUSULA 13: RESPONSABILIDAD DE PREVINCA SALUD Y DE LOS PRESTADORES

Previnca Salud opera exclusivamente como una plataforma digital de intermediación y gestión de servicios de salud, facilitando el acceso de los usuarios a una red de Prestadores médicos, asistenciales, odontológicos y de emergencias que son terceros independientes. En tal sentido, Previnca Salud no es el prestador directo de las prestaciones médicas, y su responsabilidad se limita a la provisión y el adecuado funcionamiento de la plataforma tecnológica, los servicios de intermediación para la gestión de turnos, el acceso a información de los Prestadores y la administración de los beneficios asociados a la afiliación.

La prestación efectiva de los servicios de salud, incluyendo diagnósticos, actos médicos, odontológicos o de emergencias, es responsabilidad exclusiva de los Prestadores. Estos actúan de forma independiente y bajo su propia dirección y control, siendo los únicos responsables por la calidad, idoneidad, oportunidad o resultado de las prestaciones médicas brindadas, así como por los daños que pudieran derivarse de su atención directa.

CLÁUSULA 14: PROTECCIÓN DE DATOS PERSONALES Y CONFIDENCIALIDAD

Previnca Salud se compromete a proteger la privacidad y la confidencialidad de los datos personales de sus usuarios, en estricto cumplimiento de la Ley N° 25.326 de Protección de los Datos Personales, su Decreto Reglamentario N° 1558/2001, la Ley N° 26.529 de Derechos del Paciente y su Decreto Reglamentario N° 1089/2012, así como toda la normativa complementaria y concordante en la materia.

CLÁUSULA 15: COMUNICACIONES Y NOTIFICACIONES

El usuario acepta que todas las notificaciones, comunicaciones y avisos relacionados con los presentes Términos y Condiciones, la prestación de los servicios de Previnca Salud y la gestión de su afiliación, se realizarán de forma válida y eficaz a través de medios digitales y electrónicos. La utilización de comunicaciones electrónicas y domicilios electrónicos constituidos posee idéntica eficacia jurídica y valor probatorio que sus equivalentes convencionales.

1. Domicilio Electrónico y Canales Formales de Notificación: El domicilio electrónico del usuario será el canal principal y formal para todas las notificaciones vinculantes. Este domicilio se constituirá a través de la cuenta de usuario en la plataforma de Previnca Salud (sitio web) y/o la dirección de correo electrónico que el usuario haya registrado y validado al momento de la afiliación. Las notificaciones se considerarán perfeccionadas y válidas a partir de la fecha y hora en que queden disponibles en la bandeja de comunicaciones de la plataforma o en la casilla de correo electrónico registrada. En caso de que el usuario haya registrado múltiples domicilios electrónicos y no haya designado uno principal, la notificación realizada en cualquiera de ellos se considerará válida para todos los intervinientes.

2. Circuito de Comunicaciones de Mora en el Pago: En caso de mora en el pago de una (1) cuota, Previnca Salud notificará al usuario la suspensión del servicio a través de su domicilio electrónico constituido (plataforma y/o correo electrónico). Esta comunicación incluirá la intimación para regularizar la situación en el plazo establecido, detallando las sumas adeudadas y las consecuencias de la falta de pago. La interpelación electrónica para constituir en mora al deudor asume eficacia probatoria como documento electrónico.

3. Circuito de Comunicaciones de Baja del Servicio: Las comunicaciones relativas a la baja del servicio, ya sea por decisión del usuario o por resolución de Previnca Salud, se realizarán a través del domicilio electrónico constituido del usuario. Previnca Salud enviará una constancia fehaciente de la recepción del pedido de rescisión o de la notificación de la resolución contractual, y de la fecha de su impacto.

4. Avisos de Cortesía: Previnca Salud podrá utilizar otros medios de comunicación digital, como notificaciones push en la aplicación móvil, mensajes SMS o WhatsApp, para enviar avisos de cortesía, recordatorios o información de interés general. Sin embargo, estos avisos no revisten el carácter de notificación formal y su falta de recepción, cualquiera sea el motivo, no afectará en modo alguno la validez de las notificaciones realizadas a través del domicilio electrónico constituido.

CLÁUSULA 16: LEGISLACIÓN APLICABLE Y JURISDICCIÓN

Los presentes Términos y Condiciones se regirán por el Código Civil y Comercial de la Nación.

En lo que respecta a la jurisdicción para la resolución de cualquier controversia o litigio derivado de la interpretación, validez, celebración, cumplimiento o incumplimiento de los presentes Términos y Condiciones, serán competentes los Tribunales Provinciales de Rosario.

CLÁUSULA 20: ACEPTACIÓN DE LOS TÉRMINOS Y CONDICIONES

Al completar el proceso de afiliación digital y hacer "click" en el botón de aceptación correspondiente, el usuario declara expresamente haber leído, comprendido y aceptado la totalidad de los presentes Términos y Condiciones, así como la Política de Privacidad y cualquier otro anexo o documento complementario que forme parte integral del contrato. Esta manifestación de voluntad constituye un consentimiento electrónico válido y vinculante para las partes.`

function TerminosModal({ onClose }: { onClose: () => void }) {
  const paragraphs = TYC_TEXT.trim().split(/\n\n+/)
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #12053d 0%, #2d1266 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
        >
          <h2 className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Términos y Condiciones
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-3">
          {paragraphs.map((para, i) => {
            const isHeading = /^(TÉRMINOS Y CONDICIONES|CL[AÁ]USULA)/.test(para.trim())
            return isHeading ? (
              <h3 key={i} className="font-bold text-white text-xs uppercase tracking-wide mt-4 first:mt-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {para.trim()}
              </h3>
            ) : (
              <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-dm-sans)' }}>
                {para.trim()}
              </p>
            )
          })}
        </div>
        <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

interface FormData {
  nombre: string
  apellido: string
  dni: string
  email: string
  whatsapp: string
  ciudad: string
  calle: string
  numero: string
  depto: string
  fecha_nacimiento: string
}

const initialForm: FormData = {
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  whatsapp: '',
  ciudad: '',
  calle: '',
  numero: '',
  depto: '',
  fecha_nacimiento: '',
}

const PLAN_BENEFITS = [
  { label: 'Teleconsultas médicas: DOC 24', icon: '🩺' },
  { label: 'Descuentos en farmacias', icon: '💊' },
  { label: 'Emergencias médicas', icon: '🚑' },
  { label: 'Guardias odontológicas', icon: '🦷' },
]

const fieldBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.95rem',
  color: 'white',
}

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--pink)', marginLeft: 2 }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
        style={{ ...fieldBase, colorScheme: 'dark' }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(134,96,239,0.70)'
          e.target.style.background = 'rgba(255,255,255,0.10)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.15)'
          e.target.style.background = 'rgba(255,255,255,0.07)'
        }}
      />
    </div>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
  required = false,
  max,
}: {
  id: string
  label: string
  value: string
  onChange: (val: string) => void
  required?: boolean
  max?: string
}) {
  const isoToDisplay = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return y && m && d ? `${d}/${m}/${y}` : ''
  }

  const [display, setDisplay] = useState(() => isoToDisplay(value))

  useEffect(() => {
    setDisplay(isoToDisplay(value))
  }, [value])

  function handleType(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    setDisplay(formatted)
    if (digits.length === 8) {
      const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4)
      onChange(`${y}-${m}-${d}`)
    } else {
      onChange('')
    }
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
    setDisplay(isoToDisplay(e.target.value))
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--pink)', marginLeft: 2 }}>*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleType}
          placeholder="DD/MM/AAAA"
          required={required}
          className="w-full px-4 py-3 pr-10 rounded-xl text-white outline-none transition-all"
          style={{ ...fieldBase, colorScheme: 'dark', fontFamily: 'var(--font-dm-sans)', fontSize: '0.95rem' }}
          onFocus={(e) => {
            e.target.style.border = '1px solid rgba(134,96,239,0.70)'
            e.target.style.background = 'rgba(255,255,255,0.10)'
          }}
          onBlur={(e) => {
            e.target.style.border = '1px solid rgba(255,255,255,0.15)'
            e.target.style.background = 'rgba(255,255,255,0.07)'
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            type="date"
            value={value}
            onChange={handlePickerChange}
            max={max}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full rounded cursor-pointer"
            style={{ opacity: 0.001, colorScheme: 'dark' }}
          />
        </div>
      </div>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const steps = ['Datos', 'Pagar']
  return (
    <div className="flex items-center mb-7">
      {steps.map((label, i) => {
        const num = i + 1
        const active = num === step
        const done = num < step
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done
                    ? 'linear-gradient(135deg, var(--purple), var(--pink))'
                    : active
                    ? 'white'
                    : 'rgba(255,255,255,0.12)',
                  color: active ? 'var(--purple)' : done ? 'white' : 'rgba(255,255,255,0.35)',
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : num}
              </div>
              <span
                className="text-[10px] font-semibold mt-1 uppercase tracking-wide"
                style={{ color: active ? 'white' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px flex-1 mb-4"
                style={{ background: done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-full font-bold text-sm text-white transition-all mt-1 flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(to right, var(--purple), var(--pink))',
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-sans)',
        border: 'none',
        boxShadow: disabled ? 'none' : '0 8px 24px rgba(134,96,239,0.30)',
      }}
    >
      {children}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 min-h-[44px] rounded-full text-xs font-semibold mt-2 transition-all"
      style={{ color: 'rgba(255,255,255,0.45)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
    >
      ← Volver
    </button>
  )
}

interface PlanInfo {
  id: string
  name: string
  price: number
}

export default function RegistroForm({ plans }: { plans: PlanInfo[] }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo>(plans[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [tycAccepted, setTycAccepted] = useState(false)
  const [tycModalOpen, setTycModalOpen] = useState(false)
  const hasMultiplePlans = plans.length > 1

  const maxBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().slice(0, 10)
  })()

  function setField(field: keyof FormData) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    setError('')
    if (!form.nombre || !form.apellido || !form.dni || !form.email ||
        !form.whatsapp || !form.ciudad || !form.calle || !form.numero || !form.fecha_nacimiento) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    if (!/^\d{7,8}$/.test(form.dni)) {
      setError('El DNI debe tener 7 u 8 dígitos numéricos (sin puntos ni espacios).')
      return
    }
    const birth = new Date(form.fecha_nacimiento)
    const minAge = new Date()
    minAge.setFullYear(minAge.getFullYear() - 18)
    if (birth > minAge) {
      setError('Debés tener 18 años o más para registrarte.')
      return
    }
    setStep(2)
  }

  async function handlePagar() {
    setError('')
    setLoading(true)
    try {
      const data = await initiatePayment({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim().toLowerCase(),
        whatsapp: form.whatsapp.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        domicilio: [form.calle.trim(), form.numero.trim(), form.depto.trim() ? `Dpto. ${form.depto.trim()}` : ''].filter(Boolean).join(' ') || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
        plan_id: selectedPlan.id || undefined,
      })
      if (!data.success) {
        setError(data.error)
        return
      }
      setCheckoutUrl(data.checkoutUrl)
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (checkoutUrl) {
    const registrationEmail = form.email.trim().toLowerCase()
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #12053d 0%, #2d1266 40%, #6535cc 100%)' }}
      >
        <div
          className="flex flex-col gap-5 rounded-3xl p-7 max-w-sm w-full text-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(134,96,239,0.25)' }}
        >
          <div className="flex flex-col gap-2">
            <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              ¡Tu cuenta está lista!
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
              Completá el pago en Mercado Pago para activar tu cobertura.
            </p>
          </div>

          <a
            href={checkoutUrl}
            className="inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-bold text-white text-center"
            style={{
              background: 'linear-gradient(to right, var(--purple), var(--pink))',
              fontFamily: 'var(--font-dm-sans)',
              boxShadow: '0 4px 16px rgba(134,96,239,0.30)',
              textDecoration: 'none',
            }}
          >
            Ir a Mercado Pago →
          </a>
          <button
            onClick={() => setCheckoutUrl('')}
            className="text-xs text-center"
            style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-dm-sans)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Volver al registro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr] relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #12053d 0%, #2d1266 40%, #6535cc 100%)' }}
    >
      {/* ── PANEL IZQUIERDO — branding (solo desktop) ── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: 'url(/registro-bg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(10,3,40,0.72) 0%, rgba(45,18,102,0.58) 50%, rgba(101,53,204,0.45) 100%)' }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.15,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            mixBlendMode: 'overlay',
          }}
        />

        {/* Decorative arcs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 900" fill="none">
          <ellipse cx="500" cy="450" rx="400" ry="500" stroke="rgba(255,255,255,0.04)" strokeWidth="80"/>
          <ellipse cx="80" cy="820" rx="200" ry="180" stroke="rgba(201,79,181,0.07)" strokeWidth="50"/>
        </svg>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <div>
            <a href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Previnca Nexo"
                width={180}
                height={72}
                style={{ objectFit: 'contain', height: '64px', width: 'auto' }}
                priority
              />
            </a>
          </div>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">

            <h1
              className="text-white leading-[1.06] tracking-[-1.5px] mb-8"
              style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 'clamp(40px, 4.5vw, 64px)' }}
            >
              Tu salud y tu<br />
              bienestar sin<br />
              vueltas.
            </h1>

            <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.65, maxWidth: '340px' }}>
              Cobertura médica completa en minutos, sin papeles ni trámites presenciales.
            </p>

            {/* Benefits */}
            <div className="flex flex-col gap-3.5">
              {PLAN_BENEFITS.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', boxShadow: '0 4px 12px rgba(134,96,239,0.25)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-dm-sans)' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price footer */}
          <div
            className="rounded-2xl p-5 mt-8"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>{selectedPlan.name} · Mensual</p>
                <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>Previnca Nexo</p>
              </div>
              <div className="text-right">
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>por mes</p>
                <p
                  className="font-bold leading-none"
                  style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3vw, 40px)', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  ${selectedPlan.price.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO — form ── */}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-12 relative"
        style={{ background: 'rgba(8,2,28,0.60)', backdropFilter: 'blur(0px)' }}
      >
        {/* Grain */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0.16,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            mixBlendMode: 'overlay',
          }}
        />

        <div className="w-full max-w-sm lg:max-w-[460px] relative z-10">
          {/* Logo — solo mobile */}
          <div className="text-center mb-8 lg:hidden">
            <a href="/login" className="inline-block">
              <Image
                src="/logo.png"
                alt="Previnca Nexo"
                width={200}
                height={80}
                style={{ objectFit: 'contain', height: '80px', width: 'auto' }}
                priority
              />
            </a>
          </div>

          {/* Heading */}
          <div className="mb-6 lg:mb-8">
            <h2
              className="text-2xl sm:text-3xl text-white mb-2"
              style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
            >
              {step === 1 ? 'Tus datos' : 'Resumen del plan'}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
              {step === 1 ? 'Completá la información para crear tu cuenta' : 'Revisá tu plan antes de pagar'}
            </p>
          </div>

          {/* ── STEP 1: DATOS ── */}
          {step === 1 && (
            <div
              className="p-6 sm:p-7 rounded-3xl"
              style={{ background: 'rgba(18,5,61,0.55)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 8px 40px rgba(0,0,0,0.30)' }}
            >
              <Stepper step={1} />

              {/* Plan selector — always visible in step 1 */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.42)', fontFamily: 'var(--font-dm-sans)' }}>
                  Plan seleccionado
                </p>
                <div className={`grid gap-2 ${hasMultiplePlans ? 'grid-cols-1' : ''}`}>
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all"
                      style={{
                        background: selectedPlan.id === p.id ? 'rgba(134,96,239,0.18)' : 'rgba(255,255,255,0.06)',
                        border: selectedPlan.id === p.id ? '1.5px solid rgba(134,96,239,0.65)' : '1px solid rgba(255,255,255,0.12)',
                        cursor: hasMultiplePlans ? 'pointer' : 'default',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            borderColor: selectedPlan.id === p.id ? 'var(--purple)' : 'rgba(255,255,255,0.25)',
                            background: selectedPlan.id === p.id ? 'var(--purple)' : 'transparent',
                          }}
                        >
                          {selectedPlan.id === p.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          ${p.price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>/mes</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField id="nombre" label="Nombre" value={form.nombre} onChange={setField('nombre')} placeholder="Juan" required />
                  <InputField id="apellido" label="Apellido" value={form.apellido} onChange={setField('apellido')} placeholder="García" required />
                </div>
                <InputField id="dni" label="DNI" value={form.dni} onChange={setField('dni')} placeholder="12345678" required />
                <InputField id="email" label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="tu@email.com" required />
                <InputField id="whatsapp" label="WhatsApp" type="tel" value={form.whatsapp} onChange={setField('whatsapp')} placeholder="+54 9 341 1234-5678" required />
                <div>
                  <label
                    htmlFor="ciudad"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    Localidad<span style={{ color: 'var(--pink)', marginLeft: 2 }}>*</span>
                  </label>
                  <select
                    id="ciudad"
                    value={form.ciudad}
                    onChange={(e) => setField('ciudad')(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
                    style={{ ...fieldBase, colorScheme: 'dark' }}
                    onFocus={(e) => {
                      e.target.style.border = '1px solid rgba(134,96,239,0.70)'
                      e.target.style.background = 'rgba(255,255,255,0.10)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid rgba(255,255,255,0.15)'
                      e.target.style.background = 'rgba(255,255,255,0.07)'
                    }}
                  >
                    <option value="" disabled>Seleccioná tu localidad</option>
                    <option value="Rosario">Rosario</option>
                    <option value="Granadero Baigorria">Granadero Baigorria</option>
                    <option value="Villa Gobernador Gálvez">Villa Gobernador Gálvez</option>
                  </select>
                </div>
                <InputField id="calle" label="Domicilio" value={form.calle} onChange={setField('calle')} placeholder="Nombre de la calle" required />
                <InputField id="numero" label="Número" value={form.numero} onChange={setField('numero')} placeholder="1234" required />
                <InputField id="depto" label="Departamento (si aplica)" value={form.depto} onChange={setField('depto')} placeholder="Ej: 3B" />
                <DateField id="fecha_nacimiento" label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={setField('fecha_nacimiento')} required max={maxBirthDate} />

                {error && (
                  <div
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {error}
                  </div>
                )}

                <PrimaryButton onClick={handleNext}>
                  Siguiente
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* ── STEP 2: PLAN + PAGAR ── */}
          {step === 2 && (
            <div
              className="p-6 sm:p-7 rounded-3xl"
              style={{ background: 'rgba(18,5,61,0.55)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 8px 40px rgba(0,0,0,0.30)' }}
            >
              <Stepper step={2} />

              {/* Datos ingresados — resumen compacto */}
              <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))' }}
                  >
                    {form.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {form.nombre} {form.apellido}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.42)', fontFamily: 'var(--font-dm-sans)' }}>{form.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-70 px-2.5 py-1 rounded-full"
                  style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Editar
                </button>
              </div>

              {/* Plan card */}
              <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid rgba(255,255,255,0.13)' }}>
                <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--purple), var(--pink))' }} />
                <div className="p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>Plan seleccionado</p>
                      <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{selectedPlan.name}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>por mes</p>
                      <p
                        className="text-2xl font-bold leading-none"
                        style={{ fontFamily: 'var(--font-dm-sans)', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                      >
                        ${selectedPlan.price.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                    {PLAN_BENEFITS.map((b) => (
                      <div key={b.label} className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))' }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-dm-sans)' }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* T&C */}
              <label
                className="flex items-start gap-3 cursor-pointer select-none rounded-xl px-3.5 py-3 mb-1"
                style={{ background: tycAccepted ? 'rgba(134,96,239,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${tycAccepted ? 'rgba(134,96,239,0.35)' : 'rgba(255,255,255,0.08)'}`, transition: 'background 0.2s, border-color 0.2s' }}
              >
                <input
                  type="checkbox"
                  checked={tycAccepted}
                  onChange={(e) => setTycAccepted(e.target.checked)}
                  className="mt-0.5 shrink-0"
                  style={{ accentColor: 'var(--purple)', width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)', fontFamily: 'var(--font-dm-sans)' }}>
                  He leído y acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setTycModalOpen(true)}
                    className="underline transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.88)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', fontSize: 'inherit' }}
                  >
                    Términos y Condiciones
                  </button>
                  {' '}de Previnca Nexo
                </span>
              </label>

              {/* Pay button */}
              <button
                type="button"
                onClick={handlePagar}
                disabled={loading || !tycAccepted}
                className="w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all mt-3"
                style={{
                  background: (loading || !tycAccepted) ? 'rgba(0,158,227,0.40)' : '#009ee3',
                  color: (loading || !tycAccepted) ? 'rgba(255,255,255,0.45)' : 'white',
                  cursor: (loading || !tycAccepted) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                  border: 'none',
                  boxShadow: (loading || !tycAccepted) ? 'none' : '0 6px 20px rgba(0,158,227,0.40)',
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Pagar con Mercado Pago
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-dm-sans)' }}>Pago seguro · Mercado Pago</span>
              </div>

              {error && (
                <div
                  className="text-sm px-4 py-3 rounded-xl mt-3 flex items-start gap-2.5"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <BackButton onClick={() => setStep(1)} />
            </div>
          )}

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>
            ¿Ya tenés cuenta?{' '}
            <a href="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: 'rgba(255,255,255,0.62)' }}>
              Ingresar
            </a>
          </p>
        </div>
      </div>
      {tycModalOpen && <TerminosModal onClose={() => setTycModalOpen(false)} />}
    </div>
  )
}
