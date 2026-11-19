import Link from 'next/link'

import Brand from '@/components/Brand'
import Footer from '@/components/Footer'

export default function Privacy() {
  return (
    <>
      <header className='public-header'>
        <Brand />
        <Link className='button secondary small' href='/app'>
          Volver a mi espacio
        </Link>
      </header>
      <main id='main' className='wrap document-page'>
        <p className='eyebrow'>PRIVACIDAD Y CONDICIONES</p>
        <h1>Tus datos se quedan contigo.</h1>
        <p className='lead'>
          RutaCréditos funciona sin cuenta y procesa tu información académica en
          tu navegador.
        </p>
        <h2>Qué se guarda</h2>
        <p>
          Cohorte, configuración de planes, intentos de cursos, notas
          opcionales, declaraciones de reconocimiento y escenarios. Se utiliza
          localStorage, con esquema versionado y una copia anterior recuperable.
          No pedimos nombre, ID universitario, correo ni contraseña.
        </p>
        <h2>Archivos e importaciones</h2>
        <p>
          Los CSV, JSON y PDF se leen localmente. No se envían a un servidor ni
          a servicios de IA. No se conserva el PDF original. Un respaldo
          descargado sí contiene lo que registraste: guárdalo en un lugar
          seguro.
        </p>
        <h2>Almacenamiento y eliminación</h2>
        <p>
          Los datos no se sincronizan. Borrar los datos del navegador, usar
          navegación privada o cambiar de dispositivo puede impedir
          recuperarlos. Exporta un respaldo. El botón «Borrar este espacio»
          elimina el historial, escenarios, reconocimientos y copia anterior de
          ese modo. El otro espacio permanece independiente.
        </p>
        <h2>Conexiones</h2>
        <p>
          Las fuentes, iconos y el lector PDF se sirven desde el mismo sitio. No
          incluimos analítica, cookies de seguimiento ni API de IA. El proveedor
          de alojamiento puede registrar peticiones técnicas habituales, pero no
          recibe tu historial mediante esta aplicación.
        </p>
        <h2>Condiciones de uso</h2>
        <p>
          Herramienta pública y gratuita de orientación. Es un proyecto
          independiente, sin afiliación ni aval institucional de UPAO. La
          matrícula, oferta, convalidación individual y requisitos definitivos
          de egreso se confirman con la universidad. Las limitaciones de cada
          regla aparecen junto al resultado. La marca y las tipografías
          conservan sus derechos y licencias correspondientes.
        </p>
        <p>Versión de esta información: 17 de noviembre de 2026.</p>
      </main>
      <Footer />
    </>
  )
}
