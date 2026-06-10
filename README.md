# OPTINET — Sistema Inteligente de Operaciones, Monitoreo y Mantenimiento de Redes Ópticas

Plataforma web progresiva (PWA) de nivel corporativo diseñada para la gestión, monitoreo y optimización de planes de mantenimiento predictivo, preventivo y correctivo en infraestructuras de redes ópticas (GPON/ODN). Desarrollada como un sistema de alta disponibilidad tolerante a fallas y optimizada para despliegue inmediato en Netlify.

## 🛠️ Arquitectura de Archivos del Proyecto

| Archivo | Descripción |
|---|---|
| `index.html` | Core de la aplicación (Single-Page App) con interfaz optimizada, analítica de datos en `Chart.js` e ingesta masiva por celdas. |
| `manifest.json` | Configuración PWA nativa para habilitar la instalación en dispositivos móviles (iOS / Android). |
| `service-worker.js` | Motor de persistencia y caché en segundo plano para operaciones offline en zonas sin cobertura de campo. |
| `netlify.toml` | Directivas del servidor Netlify para el control agresivo de caché, evitando desincronizaciones en navegadores móviles (Safari/Chrome). |
| `icon.png` | Identidad visual e ícono de la aplicación para pantallas de inicio. |

## 📡 Capa de Persistencia y Sincronización en Tiempo Real

Para resolver los problemas de pérdida de datos entre dispositivos (especialmente en entornos móviles como iPhone), **OPTINET** implementa una arquitectura híbrida de datos:
1. **Firebase Realtime Database (Nodo Principal):** Sincronización bidireccional instantánea. Las averías inyectadas o cerradas se reflejan inmediatamente en las pantallas de los técnicos y gerentes de zona sin necesidad de recargar la página.
2. **Memoria Local de Respaldo (Local-Realtime Fallback):** En caso de caídas de red o zonas sin cobertura, el sistema almacena las planillas localmente y las propaga de manera segura en ráfaga una vez se restablece la portadora.

## 👥 Matriz de Roles Jerárquicos y Permisos

La plataforma cuenta con un gobierno de datos estricto dividido en tres niveles operativos:

* **Gerente General (Administrador Nacional):** Acceso irrestricto a toda la plataforma. Visualización de los KPIs macros del país (Disponibilidad de Red, MTBF, MTTR Nacional, Cumplimiento del Plan CPP). Gestión global de usuarios e ingesta masiva de matrices de avería.
* **Gerente de Zona:** Control táctico limitado exclusivamente a su región geográfica. Puede visualizar cantidad, tipo y detalles de averías locales, administrar técnicos y asignar tareas en lote. **Por diseño de seguridad, tiene restringido el acceso a los KPIs macro corporativos.**
* **Técnico de Zona:** Interfaz ultra-simplificada optimizada para teléfonos móviles. Dispone de pestañas exclusivas para visualizar sus Órdenes de Trabajo (OT) asignadas y ejecutar el llenado de las planillas oficiales en campo. No posee permisos de creación ni reasignación.

## 📋 Planillas Digitales Integradas (Fidelidad Anexo A)

Los formularios han sido despojados de campos irrelevantes, solicitando única y exclusivamente la información técnica exigida en los formatos originales de ingeniería:

### Mantenimiento Preventivo (Formatos MP-D-001 / MP-CON-001)
* Checklist interactivo con selectores rápidos **OK / NOK** para verificar la integridad de cajas CTO/FAT, estanqueidad y limpieza de conectores.
* Campos numéricos estrictos para el registro de Potencia Óptica Downstream (dBm) y Atenuación del Enlace (dB).

### Mantenimiento Correctivo (Formato OT-GPON-001)
* Despliegue automático de datos del abonado (Nombre, ubicación, teléfono).
* Diagnóstico guiado: Menú de selección para Causa Raíz y Acción Técnico-Correctiva aplicada.
* Registro comparativo de Atenuación Antes vs. Después (dB) y confirmación de restablecimiento de portadora.

## 🚀 Guía de Despliegue en Netlify

### Opción Rápida (Drag and Drop)
1. Comprime los archivos (`index.html`, `manifest.json`, `service-worker.js`, `netlify.toml` e `icon.png`) en un archivo `.zip` o manténlos en una carpeta local.
2. Inicia sesión en [app.netlify.com](https://app.netlify.com).
3. Arrastra la carpeta o el `.zip` directamente al área de carga de Netlify (**Deploys**).
4. La plataforma asignará una URL pública segura con certificado SSL automático de inmediato.

### Modificación de Parámetros Firebase
Para apuntar la aplicación a tu propia instancia de base de datos en producción, edita la constante de inicialización en el archivo `index.html`:
```javascript
const firebaseConfig = {
  databaseURL: "[https://tu-nodo-firebase-default-rtdb.firebaseio.com/](https://tu-nodo-firebase-default-rtdb.firebaseio.com/)"
};
