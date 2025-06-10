Manual Exhaustivo y Práctico: Uso de las APIs de Mercado Libre para Chile (MLC)1. Introducción a las APIs de Mercado Libre para ChileMercado Libre se ha consolidado como una de las plataformas de comercio electrónico más importantes de América Latina, y su API (Interfaz de Programación de Aplicaciones) juega un rol fundamental para vendedores y desarrolladores que buscan optimizar y escalar sus operaciones. Este manual se enfoca específicamente en el uso de las APIs de Mercado Libre para el mercado chileno, identificado con el código de sitio MLC.Visión general del ecosistema de APIs de Mercado LibreMercado Libre proporciona un extenso conjunto de APIs REST que permiten a los desarrolladores interactuar programáticamente con prácticamente todos los aspectos de la plataforma.1 Estas APIs abren un abanico de posibilidades para la automatización de tareas, la integración con sistemas externos y la creación de soluciones personalizadas. Las funcionalidades cubiertas son amplias, abarcando desde la gestión de inventario y publicaciones (ítems), el procesamiento de órdenes y envíos, la interacción con clientes a través de preguntas y mensajes, hasta la administración de campañas publicitarias y el seguimiento de la reputación del vendedor.1El punto central para los desarrolladores es el DevCenter (accesible en https://developers.mercadolibre.com o su equivalente regional), un portal donde se pueden crear y gestionar aplicaciones, acceder a la documentación técnica y obtener las credenciales necesarias para la autenticación.3Importancia de la API para vendedores y desarrolladores en ChilePara los vendedores y desarrolladores en Chile, la API de Mercado Libre representa una herramienta estratégica. Permite la automatización de procesos que, de realizarse manualmente, consumirían una cantidad significativa de tiempo y recursos. Esto incluye la sincronización de stock y precios con sistemas de gestión empresarial (ERPs), la publicación masiva de productos, la gestión centralizada de preguntas y mensajes, y la integración con sistemas de facturación y logística. Al aprovechar la API, las empresas chilenas pueden escalar sus operaciones en Mercado Libre, mejorar la eficiencia, reducir errores manuales y, en últimaiva instancia, ofrecer una mejor experiencia a sus compradores.Recursos para desarrolladoresMercado Libre ofrece varios recursos para apoyar a la comunidad de desarrolladores:
DevCenter: Como se mencionó, es el portal principal. Aquí se inicia el viaje de integración, creando una aplicación que permitirá interactuar con las APIs.3
Documentación Oficial: Es la fuente primaria y más confiable de información sobre los endpoints de la API, parámetros, flujos de autenticación y mejores prácticas.5 Para funcionalidades específicas como los pagos, Mercado Pago (la plataforma de pagos de Mercado Libre) también cuenta con su propia documentación detallada para desarrolladores.6
Foros y Comunidades: Aunque no se detallan extensamente en la información base, es común que plataformas de este tamaño fomenten comunidades de desarrolladores o foros de soporte donde se pueden compartir conocimientos y resolver dudas. Se recomienda explorar el DevCenter en busca de estos espacios.
Identificando el Mercado Chileno (MLC)Un aspecto fundamental al trabajar con las APIs de Mercado Libre en un contexto multi-país es la correcta identificación del sitio. Muchas llamadas a la API, especialmente aquellas relacionadas con la creación o consulta de ítems, categorías y tipos de publicación, requieren el parámetro site_id. Para Chile, este identificador es MLC. Este detalle será recurrente a lo largo del manual y es crucial para asegurar que las operaciones se realicen en el mercado correcto.Evolución Constante de la APIEs importante comprender que las APIs de Mercado Libre no son estáticas; están en constante evolución. Se introducen nuevas funcionalidades, se mejoran las existentes, se actualizan los protocolos de seguridad y, ocasionalmente, algunas características o versiones de API pueden quedar obsoletas (deprecadas).7 Por ejemplo, se observa la necesidad de especificar versiones en ciertas llamadas (api_version=4 para preguntas 9, app_version=v2 para promociones 10) y la existencia de changelogs o registros de cambios.6Esta naturaleza dinámica implica que las integraciones deben diseñarse con un grado de flexibilidad y que los desarrolladores deben mantenerse informados sobre las últimas actualizaciones. Consultar regularmente la documentación oficial en el DevCenter y, si están disponibles, suscribirse a boletines informativos para desarrolladores 6 son prácticas altamente recomendadas. Estar al tanto de estos cambios es vital para asegurar la continuidad operativa de las aplicaciones integradas y para aprovechar las nuevas capacidades que la plataforma ofrece.2. Primeros Pasos: Creación de Aplicación y AutenticaciónAntes de poder realizar cualquier llamada a las APIs de Mercado Libre, es imprescindible registrar una aplicación en el DevCenter y comprender el flujo de autenticación y autorización OAuth 2.0. Estos pasos iniciales son la puerta de entrada al ecosistema de Mercado Libre.Registro y Creación de una Aplicación en el DevCenterEl proceso para crear una aplicación se realiza a través del DevCenter de Mercado Libre.3 A continuación, se detallan los pasos y consideraciones clave:

Acceder al DevCenter: Ingresar a https://developers.mercadolibre.com (o el portal regional correspondiente) e iniciar sesión con una cuenta de Mercado Libre. Se recomienda que, para fines comerciales o empresariales, la cuenta de Mercado Libre esté creada bajo una entidad legal.3


Crear Nueva Aplicación: Dentro del DevCenter, buscar la opción "Crear nueva aplicación" o similar. Se deberá completar un formulario con la siguiente información 3:

Nombre: Un nombre único para la aplicación.
Descripción: Un texto breve (hasta 150 caracteres) que se mostrará al usuario durante el proceso de autorización, explicando el propósito de la aplicación.
Logo: Una imagen representativa de la aplicación o empresa.
URIs de redirect (Redirect URIs): Son URLs a las que Mercado Libre redirigirá al usuario después de que este autorice (o deniegue) el acceso a la aplicación. Estas URIs son cruciales para el flujo OAuth 2.0. Es fundamental que las URIs ingresadas aquí coincidan exactamente con las que la aplicación utilizará durante el proceso de autorización, y no deben contener información variable o parámetros dinámicos en su definición base.3 Se pueden agregar múltiples URIs si la aplicación tiene diferentes puntos de redirección.
Scopes (Permisos): Definen el alcance del acceso que la aplicación solicita sobre los datos del usuario. Los scopes comunes incluyen 1:

read: Permite a la aplicación leer datos (usar métodos GET).
write: Permite a la aplicación modificar datos (usar métodos POST, PUT, DELETE).
offline_access: Esencial para aplicaciones que necesitan acceder a los datos del usuario incluso cuando este no está activamente usando la aplicación. Este scope permite obtener un refresh_token, que se utiliza para renovar los access_token sin requerir una nueva autenticación del usuario.12


Tópicos de Notificaciones y Notificaciones Callbacks URL: Esta sección permite configurar la recepción de notificaciones en tiempo real (webhooks) sobre eventos específicos en Mercado Libre. Se debe proporcionar una "Notificaciones callbacks URL" pública donde la aplicación pueda recibir estos eventos vía HTTP POST. Los "Tópicos" son los tipos de eventos a los que se desea suscribir (e.g., creación de órdenes, nuevas preguntas).3 Este tema se abordará en detalle en la Sección 9.



Guardar la Aplicación: Una vez completados todos los campos obligatorios, se guarda el proyecto.

Consideraciones Específicas para Chile (MLC)Es de vital importancia tener en cuenta que, en ciertos países, incluyendo Chile, Mercado Libre puede requerir la validación de los datos del titular de la cuenta antes de permitir la creación de una aplicación.3 La información proporcionada al crear la cuenta de Mercado Libre y la información ingresada en el DevCenter para la aplicación deben ser exactamente las mismas. Cualquier discrepancia podría retrasar o impedir la creación de la aplicación. Si surgen problemas en este paso, se sugiere contactar al equipo de atención al cliente de Mercado Libre para obtener orientación.3 Este requisito de validación subraya la importancia de la precisión de los datos y la legitimidad de las aplicaciones que interactúan con la plataforma.Obtención de CredencialesUna vez que la aplicación es creada y aprobada, el DevCenter proporcionará dos credenciales fundamentales 3:
App ID (Client ID): Identificador público de la aplicación.
Clave Secreta (Client Secret / Secret_Key): Una clave confidencial utilizada para autenticar la aplicación. Esta clave debe ser tratada con la máxima confidencialidad y nunca debe ser expuesta en el código del lado del cliente o en repositorios públicos.
Estas credenciales son la base para el proceso de autenticación OAuth 2.0.Proceso de Autenticación y Autorización OAuth 2.0Mercado Libre utiliza el protocolo OAuth 2.0 para la autorización, un estándar de la industria que permite a las aplicaciones acceder a recursos protegidos en nombre de un usuario, sin necesidad de que este último comparta sus credenciales (usuario y contraseña) directamente con la aplicación.12 Este protocolo garantiza 12:
Confidencialidad: El usuario no revela su contraseña a la aplicación de terceros.
Integridad: Solo las aplicaciones con los permisos adecuados pueden acceder a los datos privados.
Disponibilidad: Los datos están accesibles cuando se necesitan, bajo los permisos otorgados.
El flujo de OAuth 2.0 recomendado y más comúnmente utilizado para aplicaciones con un componente de servidor (backend) es el Flujo de Código de Autorización (Authorization Code Grant Type).12Flujo de Código de Autorización (Server-Side)Este flujo consta de los siguientes pasos principales 12:

Redirección del Usuario a Mercado Libre para Autorización:La aplicación redirige el navegador del usuario a la URL de autorización de Mercado Libre. Para Chile, esta URL es:https://auth.mercadolibre.cl/authorization(Es importante notar que la documentación base 12 podría mostrar .com.ar; siempre se debe usar el dominio específico del país, en este caso .cl).
La URL de autorización debe incluir los siguientes parámetros query 12:

response_type=code: Indica que se solicita un código de autorización.
client_id=$APP_ID: El APP_ID de la aplicación.
redirect_uri=$YOUR_URL: Una de las URIs de redirect configuradas en el DevCenter. Debe coincidir exactamente.
state=$RANDOM_STRING (Opcional pero recomendado): Un valor opaco generado por la aplicación para mantener el estado entre la solicitud y la respuesta, y para prevenir ataques CSRF. Mercado Libre devolverá este mismo valor en la redirección.12 Si se necesitan pasar parámetros a través del redirect_uri (que debe ser estático), el parámetro state es el mecanismo adecuado para hacerlo.12



Autenticación y Consentimiento del Usuario:El usuario es dirigido a una página de Mercado Libre donde, si aún no ha iniciado sesión, se le pedirá que lo haga. Luego, se le presentará una pantalla solicitando su consentimiento para que la aplicación acceda a los datos definidos por los scopes solicitados durante la creación de la aplicación. El usuario puede aceptar o denegar la solicitud.Es crucial que el usuario que otorga el consentimiento sea el administrador de la cuenta de Mercado Libre. Si un usuario operador/colaborador intenta autorizar la aplicación, el proceso fallará y se recibirá el error invalid_operator_user_id.12


Redirección de Vuelta a la Aplicación con un Código de Autorización:Si el usuario otorga el permiso, Mercado Libre redirige el navegador del usuario de vuelta a la redirect_uri especificada. Esta redirección incluirá dos parámetros importantes en la query string 12:

code=$SERVER_GENERATED_AUTHORIZATION_CODE: Un código de autorización temporal y de un solo uso.
state=$RANDOM_STRING: El mismo valor de state enviado en el paso 1 (si se utilizó). La aplicación debe verificar que este valor coincida con el original para mitigar riesgos de seguridad.

Si ocurre un error, como que el redirect_uri no coincida, los tokens de la app no sean válidos, el usuario no sea el principal, o haya datos pendientes de validación, se puede mostrar un mensaje de error como "Lo sentimos, la aplicación no puede conectarse a tu cuenta".12


Intercambio del Código de Autorización por un Access Token:Con el código de autorización recibido, la aplicación (desde su backend, de forma segura) realiza una solicitud HTTP POST al endpoint de token de Mercado Libre:https://api.mercadolibre.com/oauth/token.12
Esta solicitud debe ser de tipo application/x-www-form-urlencoded y contener los siguientes parámetros en el cuerpo (body) 12:

grant_type=authorization_code: Indica que se está intercambiando un código de autorización.
client_id=$APP_ID: El APP_ID de la aplicación.
client_secret=$SECRET_KEY: La Secret_Key de la aplicación.
code=$SERVER_GENERATED_AUTHORIZATION_CODE: El código de autorización obtenido en el paso anterior.
redirect_uri=$REDIRECT_URI: La misma redirect_uri utilizada en el paso 1.

Si la solicitud es exitosa, Mercado Libre responderá con un JSON conteniendo 12:

access_token: El token que se utilizará para autenticar las llamadas a la API.
token_type: Generalmente "bearer".
expires_in: El tiempo de vida del access_token en segundos.12
scope: Los scopes autorizados por el usuario.
user_id: El ID del usuario de Mercado Libre que autorizó la aplicación.
refresh_token: Si se solicitó el scope offline_access, se recibirá este token, que permite obtener nuevos access_token sin intervención del usuario.


Uso de PKCE (Proof Key for Code Exchange)PKCE es una extensión de seguridad para el flujo de Código de Autorización, diseñada originalmente para proteger a clientes públicos (como aplicaciones móviles), pero su uso es recomendado para todas las aplicaciones, incluidas las que tienen backend, para mitigar ataques de interceptación del código de autorización.3 Si la opción "Use PKCE" está habilitada en la configuración de la aplicación en el DevCenter, su implementación es obligatoria.3El flujo con PKCE añade los siguientes pasos 12:

Antes del Paso 1 (Redirección para Autorización):

La aplicación cliente genera una cadena aleatoria criptográficamente segura llamada code_verifier.
La aplicación cliente deriva un code_challenge a partir del code_verifier. Esto se hace aplicando una transformación al code_verifier. Los métodos soportados son:

S256: El code_challenge es el hash SHA256 del code_verifier, codificado en Base64URL. (Recomendado)
plain: El code_challenge es el mismo code_verifier. (No recomendado por seguridad).12


El método utilizado para generar el code_challenge se especifica como code_challenge_method.



Durante el Paso 1 (Redirección para Autorización):

La aplicación incluye dos parámetros adicionales en la URL de autorización:

code_challenge=$GENERATED_CODE_CHALLENGE
code_challenge_method=$CHALLENGE_METHOD (e.g., "S256")





Durante el Paso 4 (Intercambio del Código por un Access Token):

La aplicación incluye un parámetro adicional en el cuerpo de la solicitud POST al endpoint de token:

code_verifier=$ORIGINAL_CODE_VERIFIER




El servidor de autorización de Mercado Libre guardó el code_challenge en el paso 1 y ahora, en el paso 4, aplica la misma transformación al code_verifier recibido y compara el resultado con el code_challenge almacenado. Si coinciden, se emite el access_token; de lo contrario, la solicitud se rechaza. Esto asegura que solo la aplicación que inició el flujo puede completarlo. La adopción de PKCE es una clara indicación del compromiso de Mercado Libre con la seguridad de su plataforma y de sus usuarios.Gestión de access_token y refresh_token

Access Token:Este token es de corta duración (generalmente 3-6 horas 12) y se utiliza para autenticar las solicitudes a los recursos protegidos de la API. Se incluye en el encabezado Authorization de cada solicitud HTTP:Authorization: Bearer $ACCESS_TOKEN.12


Refresh Token:Si la aplicación necesita acceder a los datos del usuario durante un período prolongado o cuando el usuario no está presente (e.g., para sincronizaciones nocturnas de inventario), se utiliza el refresh_token. Este token, obtenido si se solicitó el scope offline_access, permite a la aplicación obtener un nuevo access_token cuando el actual expira, sin que el usuario tenga que volver a pasar por el proceso de autorización completo.12
Para renovar un access_token usando un refresh_token, la aplicación realiza una solicitud HTTP POST al endpoint /oauth/token con los siguientes parámetros en el cuerpo 12:

grant_type=refresh_token
refresh_token=$SAVED_REFRESH_TOKEN
client_id=$APP_ID
client_secret=$SECRET_KEY

La respuesta a esta solicitud será un nuevo access_token (con una nueva fecha de expiración) y, muy importante, un nuevo refresh_token.12 El refresh_token anterior se invalida inmediatamente después de su uso. Por lo tanto, la aplicación debe guardar este nuevo refresh_token para futuras renovaciones. Este mecanismo de refresh_token de un solo uso incrementa la seguridad, ya que si un refresh_token es comprometido, su utilidad es limitada a una sola renovación.
Los refresh_token también tienen una vida útil 12 y pueden ser invalidados por otras razones, como un cambio de contraseña por parte del usuario, la revocación explícita de los permisos de la aplicación por parte del usuario, o si la aplicación no interactúa con la API de Mercado Libre durante un período prolongado.12 Si un refresh_token se invalida, la aplicación deberá guiar al usuario a través del flujo de autorización inicial nuevamente.
Es una buena práctica renovar el access_token solo cuando está a punto de expirar o cuando una llamada a la API falla con un error de token inválido, en lugar de hacerlo en cada solicitud, para optimizar los procesos.12

Flujo Device GrantMercado Libre también menciona un flujo llamado "Device Grant".3 Este flujo se utiliza cuando una aplicación necesita acceder a sus propios recursos (no a los de un usuario específico) utilizando únicamente sus credenciales de aplicación. Implica llamadas recurrentes hasta que el proceso de autorización (que puede tener una interfaz de usuario diferente o ser un proceso interno) finaliza y se devuelve un token. Este flujo es menos común para las integraciones típicas de vendedores que actúan en nombre de su propia cuenta de vendedor (que se considera un "usuario").Tabla: Parámetros Clave del Flujo de Autenticación (OAuth 2.0 - Código de Autorización con PKCE)ParámetroDescripciónEndpoint/FlujoObligatorio/Opcional (con PKCE)client_idIdentificador de la aplicación (APP ID).Autorización, Intercambio de Código, Refresh TokenObligatorioclient_secretClave secreta de la aplicación.Intercambio de Código, Refresh TokenObligatorioredirect_uriURL a la que se redirige al usuario tras la autorización.Autorización, Intercambio de CódigoObligatorioresponse_typeDebe ser "code" para el flujo de código de autorización.AutorizaciónObligatorio (code)codeCódigo de autorización temporal devuelto por el servidor.Intercambio de CódigoObligatoriogrant_typeTipo de concesión (authorization_code o refresh_token).Intercambio de Código, Refresh TokenObligatorioaccess_tokenToken para acceder a los recursos de la API.Respuesta del Intercambio/Refresh, Uso en llamadas APIN/A (es una respuesta)refresh_tokenToken para obtener un nuevo access_token.Respuesta del Intercambio/Refresh, Uso en Refresh TokenN/A (es una respuesta)stateValor opaco para mantener el estado y prevenir CSRF.AutorizaciónOpcional (Recomendado)code_verifierCadena aleatoria secreta generada por el cliente.Intercambio de CódigoObligatorio (si PKCE activado)code_challengeDerivado del code_verifier (e.g., SHA256).AutorizaciónObligatorio (si PKCE activado)code_challenge_methodMétodo usado para generar el code_challenge (e.g., S256).AutorizaciónObligatorio (si PKCE activado)Fuentes: 12Ejemplos de Código para el Flujo de AutenticaciónA continuación, se presenta un esquema conceptual de cómo implementar el flujo de autenticación. Los ejemplos específicos de código en lenguajes como Python (usando la librería requests) o JavaScript (Node.js con axios) deberían incluir:
Generación de code_verifier y code_challenge (para PKCE):

Crear una cadena aleatoria para code_verifier.
Aplicar SHA256 y luego Base64URL encoding para obtener code_challenge si code_challenge_method es S256.


Construcción de la URL de Autorización:

Ensamblar la URL https://auth.mercadolibre.cl/authorization con los parámetros response_type=code, client_id, redirect_uri, state, y (si PKCE) code_challenge y code_challenge_method.
Redirigir al usuario a esta URL.


Manejo de la Redirección desde Mercado Libre:

En el endpoint de la redirect_uri, extraer el code y el state de los parámetros query.
Verificar que el state recibido coincida con el enviado.


Intercambio del Código por Tokens:

Realizar una solicitud POST a https://api.mercadolibre.com/oauth/token.
Body: grant_type=authorization_code, client_id, client_secret, code, redirect_uri, y (si PKCE) code_verifier.
Procesar la respuesta JSON para obtener access_token, refresh_token, expires_in, etc.


Almacenamiento Seguro de Tokens:

Guardar el access_token y el refresh_token de forma segura (e.g., base de datos encriptada, gestor de secretos).


Uso del access_token:

Incluir el access_token en el header Authorization: Bearer $ACCESS_TOKEN de las llamadas a la API.


Refresco del access_token:

Cuando el access_token expire o esté cerca de expirar, realizar una solicitud POST a https://api.mercadolibre.com/oauth/token.
Body: grant_type=refresh_token, refresh_token, client_id, client_secret.
Actualizar el access_token y el nuevo refresh_token almacenados.
Manejar el caso en que el refresh_token sea inválido (requiere re-autenticación del usuario).


La implementación de estos flujos debe ser robusta, manejando posibles errores de red y respuestas inesperadas de la API.3. Configuración del Entorno de PruebasProbar adecuadamente una integración con las APIs de Mercado Libre es un paso crítico antes de operar con datos reales de producción. Un entorno de pruebas permite a los desarrolladores simular transacciones, gestionar publicaciones y verificar la lógica de la aplicación sin afectar la cuenta real del vendedor, su reputación o incurrir en costos monetarios.14Importancia del Entorno de PruebasLa principal directriz es clara: todas las operaciones de prueba deben realizarse exclusivamente con usuarios de prueba.14 Utilizar cuentas personales o de producción para pruebas puede llevar a consecuencias no deseadas, como la creación de publicaciones de prueba visibles al público, la alteración de la reputación del vendedor o la generación de cargos financieros. El entorno de pruebas de Mercado Libre se basa en el uso de estos usuarios de prueba dedicados.Creación de Usuarios de PruebaMercado Libre permite la creación de usuarios específicos para fines de prueba. Estos usuarios operan dentro de la infraestructura de producción de Mercado Libre, pero sus acciones están contenidas y no tienen impacto en el mercado real.

Usuario de prueba de Marketplace (para Chile - MLC):Para crear un usuario comprador/vendedor de prueba para el sitio chileno, se realiza una solicitud POST al siguiente endpoint:POST https://api.mercadolibre.com/users/test_userEl cuerpo de la solicitud debe ser un JSON especificando el site_id para Chile:{ "site_id": "MLC" }(Adaptado de los ejemplos en 14 que utilizan MLM para México).
La respuesta a esta solicitud contendrá las credenciales del usuario de prueba recién creado, incluyendo 14:

id: El ID numérico del usuario de prueba.
nickname: El apodo del usuario de prueba (e.g., TETE1234).
password: La contraseña para este usuario de prueba. Es crucial guardar estas credenciales de forma segura, ya que la contraseña no es recuperable.14
site_status: El estado del usuario en el sitio (e.g., active).
email: Una dirección de correo electrónico ficticia asociada al usuario de prueba.



Usuario de prueba Global Selling (CBT):La documentación también menciona la creación de usuarios de prueba para Global Selling (site_id: "CBT").14 Aunque este manual se centra en Chile, es útil conocer esta opción si la integración involucra ventas internacionales a través de ese programa.

Características y Limitaciones de los Usuarios de PruebaLos usuarios de prueba tienen ciertas particularidades que los desarrolladores deben conocer 14:
Límite de Creación: Se pueden crear hasta un máximo de 10 usuarios de prueba por cada cuenta de Mercado Libre.
No Eliminables: Una vez creados, estos usuarios de prueba no pueden ser eliminados, ni por el desarrollador ni por Mercado Libre.
Expiración por Inactividad: Los usuarios de prueba que no muestren actividad (comprar, vender, preguntar, publicar, etc.) durante un período de 60 días son eliminados automáticamente.
Eliminación de Ítems de Prueba: Los ítems (publicaciones) creados por usuarios de prueba se eliminan periódicamente.
Interacción Aislada: Los usuarios de prueba solo pueden interactuar (comprar, vender, hacer preguntas, etc.) con publicaciones creadas por otros usuarios de prueba. No pueden interactuar con publicaciones de usuarios reales.
Validación de Email: Para procesos que requieran validación de correo electrónico, el código de validación para un usuario de prueba corresponde a los últimos 4 o 6 dígitos del id numérico de dicho usuario de prueba. Por ejemplo, si el user_id es 653764425, el código de validación podría ser 764425.14
Publicaciones: Se recomienda listar los ítems de prueba en la categoría "Otros" tanto como sea posible.
La naturaleza efímera de los datos de prueba (ítems eliminados regularmente, usuarios inactivos eliminados) significa que no se puede depender de un estado de prueba persistente a largo plazo. Los scripts y procesos de prueba deben ser capaces de configurar el entorno necesario (crear usuarios, publicar ítems) bajo demanda. Esta dinámica fomenta la creación de pruebas automatizadas y reproducibles.Simulación de Compras y PagosUna parte esencial de las pruebas es la simulación del flujo de compra y pago. Para esto, Mercado Pago (la plataforma de pagos de Mercado Libre) proporciona tarjetas de crédito de prueba.14
Al realizar una compra entre usuarios de prueba, se pueden utilizar estas tarjetas ficticias.
Una característica interesante es que se puede simular diferentes resultados de pago (aprobado, rechazado, etc.) ingresando nombres específicos en el campo del titular de la tarjeta durante el proceso de pago. Por ejemplo, ingresar "APRO APRO" como nombre y apellido del titular puede simular un pago aprobado.14
Es importante acceder al listado de tarjetas de prueba correspondiente al país (Chile), ya que los detalles pueden variar. La documentación usualmente provee un enlace a estas tarjetas, y se debe asegurar que la URL se ajuste al país de operación. Esta funcionalidad solo está disponible en países donde Mercado Pago está activo.14
¿Existe un "Sandbox" Dedicado?El término "sandbox" aparece en varios contextos en la documentación.16 Sin embargo, es importante clarificar su significado en el contexto de las APIs de Mercado Libre.Documentos como 16 y 16 discuten la "Privacy Sandbox" de Google y los esfuerzos de Mercado Libre en relación con las cookies de terceros y la privacidad del usuario. Si bien esto es relevante para aspectos de autenticación y seguimiento a nivel de navegador, no se refiere a un entorno de API de prueba completamente aislado y separado de producción.17 muestra un ejemplo de código en CodeSandbox (una plataforma online para desarrollo web), y 18 menciona una herramienta de terceros (Glama.ai) para probar servidores MCP en un entorno aislado.La estrategia principal de Mercado Libre para las pruebas de API parece centrarse en el uso de usuarios de prueba (test_users) que operan en el entorno de producción, pero cuyos datos y transacciones están aislados y no tienen impacto real en el mercado.14 No parece existir un endpoint base de API completamente separado para un entorno de sandbox (como podría ser api.sandbox.mercadolibre.com). Si tal entorno existiera, sería un componente fundamental y estaría prominentemente destacado en la documentación de configuración inicial y autenticación.Por lo tanto, los desarrolladores deben operar bajo la premisa de que las pruebas se realizan en la infraestructura de producción, pero utilizando las cuentas de prueba designadas, lo que garantiza un entorno de prueba realista y funcionalmente completo.4. Gestión de Publicaciones (Items) en Mercado Libre ChileLa gestión de publicaciones es una de las funcionalidades centrales de la API de Mercado Libre. Permite a los vendedores crear, consultar, actualizar y gestionar sus productos en la plataforma de manera programática. Para el mercado chileno (MLC), este proceso sigue las pautas generales de la API, con consideraciones específicas para el sitio.Categorización de Productos y AtributosLa correcta categorización de un producto es fundamental. No solo asegura que el ítem aparezca en los listados correctos, aumentando su visibilidad para los compradores adecuados, sino que también determina el conjunto de atributos (características) que se deben o pueden completar para describir el producto de manera óptima.19Predictor de CategoríasPara facilitar la elección de la categoría más adecuada, Mercado Libre ofrece una herramienta de predicción basada en el título del producto.19
Endpoint: GET https://api.mercadolibre.com/sites/$SITE_ID/domain_discovery/search
Parámetros Obligatorios:

site_id: Para Chile, debe ser MLC.
q: El título del artículo que se desea predecir. Debe estar en el idioma del sitio (español para MLC) y ser lo más descriptivo posible.


Parámetro Opcional Recomendado:

limit=3: Devuelve las tres predicciones más probables, ofreciendo más opciones al vendedor.19


Ejemplo de Llamada (para Chile):
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' 'https://api.mercadolibre.com/sites/MLC/domain_discovery/search?q=Zapatillas%20Deportivas%20Hombre%20Running&limit=3'
Respuesta: La API devuelve un array de objetos JSON, donde cada objeto representa una categoría predicha. La primera predicción es la de mayor probabilidad. Cada objeto incluye 19:

domain_id: ID del dominio al que pertenece la categoría (e.g., MLC-RUNNING_SHOES).
domain_name: Nombre del dominio (e.g., "Zapatillas de Correr").
category_id: El ID de la categoría predicha (e.g., MLC1234). Este es el valor que se usará al publicar el ítem.
category_name: Nombre de la categoría (e.g., "Zapatillas").
attributes: Un listado de atributos sugeridos para esa categoría, a menudo con valores pre-identificados (e.g., BRAND, MODEL).


Consulta de Categorías por SitioSi se desea explorar la estructura completa de categorías para Chile, se puede utilizar el siguiente endpoint 19:
Endpoint: GET https://api.mercadolibre.com/sites/MLC/categories
Respuesta: Un array JSON con las categorías principales de Mercado Libre Chile. Cada categoría puede tener subcategorías, formando una estructura jerárquica.
Detalle de una Categoría (Atributos)Una vez identificada una category_id (ya sea por el predictor o por exploración), es crucial obtener la lista completa y detallada de sus atributos. Esto permite saber qué información es requerida, opcional, si permite variaciones, qué tipo de valores acepta, etc..19
Endpoint: GET https://api.mercadolibre.com/categories/$CATEGORY_ID
(Reemplazar $CATEGORY_ID con el ID de la categoría chilena, e.g., MLC1234).
Respuesta: Un objeto JSON detallado con información de la categoría, incluyendo un array attributes. Cada elemento de este array describe un atributo con campos como:

id: El identificador del atributo (e.g., BRAND, MODEL, COLOR).
name: El nombre legible del atributo (e.g., "Marca", "Modelo", "Color").
value_type: El tipo de dato del valor del atributo (e.g., string, number, boolean, list).
tags: Un objeto que contiene etiquetas booleanas importantes como:

required: Indica si el atributo es obligatorio para publicar en esta categoría.
allow_variations: Indica si este atributo puede ser usado para crear variaciones del producto (e.g., color, talla).
defines_picture: Indica si el valor de este atributo puede estar asociado a una imagen específica (e.g., diferentes fotos para diferentes colores).
Otros tags como fixed, read_only, hidden.


values: Si el atributo tiene una lista predefinida de valores (e.g., una lista de marcas), estos se listan aquí, cada uno con su id y name.


Es fundamental analizar los tags de cada atributo, especialmente required y allow_variations, ya que esto guiará la construcción del JSON para la publicación del ítem.20 No completar los atributos requeridos puede resultar en un error al intentar publicar o en una publicación de baja calidad.Límite de VariacionesMercado Libre establece un límite en la cantidad de variaciones que una publicación puede tener. Generalmente, el máximo es de 100 variaciones por categoría. Sin embargo, para ciertas categorías como Moda, Accesorios para celulares y Autopartes, este límite se extiende a 250 variaciones.19 Es importante tener esto en cuenta al modelar productos con múltiples combinaciones.Creación de Publicaciones (Items)Una vez determinada la categoría y sus atributos, se puede proceder a crear la publicación (ítem) utilizando una solicitud POST al endpoint /items.

Endpoint: POST https://api.mercadolibre.com/items


Encabezados:

Authorization: Bearer $ACCESS_TOKEN
Content-Type: application/json
Accept: application/json



Cuerpo de la Solicitud (Request Body): Un objeto JSON que describe el ítem. A continuación, una estructura básica con campos relevantes para Chile:
JSON{
  "site_id": "MLC",
  "title": "Celular Inteligente Avanzado 128GB Nuevo",
  "category_id": "MLC1055",
  "price": 350000,
  "currency_id": "CLP",
  "available_quantity": 15,
  "buying_mode": "buy_it_now",
  "listing_type_id": "gold_special",
  "condition": "new",
  "description": {
    "plain_text": "Este es un celular inteligente de última generación con 128GB de almacenamiento, cámara de alta resolución y batería de larga duración. Ideal para profesionales y entusiastas de la tecnología."
  },
  "pictures": [
    {"source": "https://www.ejemplo.com/imagen_celular_frente.jpg"},
    {"source": "https://www.ejemplo.com/imagen_celular_trasera.jpg"},
    {"source": "https://www.ejemplo.com/imagen_celular_detalle.jpg"}
  ],
  "attributes":,
  "shipping": {
    "mode": "me2",
    "local_pick_up": false,
    "free_shipping": false,
    "dimensions": "15,7,0.8,300"
  }
}

Fuentes para la estructura: 20
Campos Clave y Consideraciones:

site_id: Siempre MLC para Chile.
title: El título del producto. Sigue las recomendaciones de estructura: Producto + Marca + Modelo + Especificaciones relevantes.21 Evitar incluir información sobre envíos, cuotas, condición (nuevo/usado, ya que esto va en el campo condition), descuentos (para esto existen mecanismos específicos) o stock.21 El límite de caracteres del título (max_title_length) es definido por la categoría. No se deben mencionar marcas de terceros a menos que sea para indicar compatibilidad, utilizando frases como "para [Marca Compatible]" o "compatible con [Marca Compatible]".21 Es crucial revisar la ortografía y usar espacios para separar palabras, evitando signos de puntuación innecesarios.
Un cambio importante a tener en cuenta es la mención en 21 sobre "User Products": "En la nueva manera de publicar (User Products) el campo titulo cambiará de función, y no deberá ser enviado en la publicación. Necesario identificar las debidas fechas de activación en la documentación de User Products." Esto sugiere una futura modificación significativa en cómo se manejan los títulos a través de la API. Las integraciones actuales deben estar preparadas para este cambio, y los desarrolladores deben monitorear la documentación oficial de Mercado Libre respecto a "User Products" para conocer las fechas de activación y los nuevos procedimientos. Este cambio podría implicar que el título se genere o gestione de manera diferente, posiblemente a partir de los atributos del producto.
category_id: El ID de la categoría chilena (MLCXXXX) obtenido del predictor o consulta de categorías.
price: El precio del producto en la moneda local. Para Chile, este valor debe ser en pesos chilenos (CLP).
currency_id: Siempre CLP para Chile.
available_quantity: La cantidad de unidades disponibles para la venta.
buying_mode: Generalmente buy_it_now (precio fijo). También puede ser auction (subasta), aunque es menos común para la mayoría de los productos.
listing_type_id: El tipo de publicación (e.g., gold_special). Se detalla en la siguiente subsección.
condition: El estado del producto: new, used o refurbished.21 Este campo es obligatorio. Para ítems usados en ciertas categorías (como moda y deportes en algunos países), la cantidad disponible (available_quantity) podría estar limitada a 1, y la publicación se cierra automáticamente tras la venta.21 Es necesario verificar las reglas específicas para MLC, aunque 23 menciona límites para categorías usadas en MPE (Perú).
description: Un objeto que contiene la descripción del producto. Se recomienda usar plain_text. 21 sugiere una práctica interesante: "Antes de crear la descripción de un producto, debes crear la publicación sin descripción pero incluyendo todos los atributos e información detallada del ítem." Esto podría estar relacionado con procesos internos de indexación o validación de Mercado Libre, donde los atributos estructurados tienen prioridad inicial. Posteriormente, la descripción se puede añadir mediante una actualización (PUT).
pictures: Un array de objetos, donde cada objeto tiene una clave source con la URL pública de la imagen del producto. Se recomienda utilizar imágenes de buena calidad y que cumplan con las políticas de Mercado Libre.
attributes: Un array de objetos, donde cada objeto representa un atributo de la categoría. Cada atributo tiene un id (obtenido de la consulta de detalles de la categoría) y un value_name (el valor específico para ese producto). También se puede usar value_id si el atributo tiene valores predefinidos. Se deben incluir todos los atributos marcados como required por la categoría.19
shipping: Un objeto para configurar las opciones de envío. Se detallará más en la Sección 6. mode: "me2" activa Mercado Envíos. dimensions (alto,ancho,largo,peso en gramos) es importante para el cálculo de costos de envío.



Respuesta a la Creación: Si la solicitud es exitosa, la API de Mercado Libre responderá con un código HTTP 201 Created y un cuerpo JSON que contiene la información del ítem recién creado, incluyendo su id (e.g., MLC123456789), permalink (la URL pública del producto), y otros detalles.20 Este id es fundamental para futuras gestiones del ítem (actualizaciones, consultas, etc.).

Tipos de Publicación en Chile (MLC)El listing_type_id es un campo crucial al crear o actualizar una publicación, ya que define la exposición del anuncio en los listados, su duración, y los costos por venta asociados.24 Cada sitio de Mercado Libre (como MLC para Chile) tiene su propio conjunto de tipos de publicación.Consulta de Tipos de Publicación Disponibles para MLCPara conocer los listing_type_id válidos y disponibles específicamente para Mercado Libre Chile, se debe realizar la siguiente consulta GET 24:
Endpoint: GET https://api.mercadolibre.com/sites/MLC/listing_types
Encabezados: Authorization: Bearer $ACCESS_TOKEN
Respuesta Esperada: Un array JSON donde cada objeto representa un tipo de publicación disponible en Chile. Por ejemplo, para Argentina (MLA), la respuesta incluye gold_pro (Premium), gold_special (Clásica), y free (Gratuita).24 Se espera una estructura similar para MLC, con IDs y nombres que pueden variar (e.g., "Premium", "Clásica", "Gratuita"). Es importante notar que 24 indicó que esta información específica para MLC no estaba en el documento analizado en ese momento, y 25 (un intento de acceso directo a la URL) falló, lo que subraya la necesidad de que el desarrollador realice esta llamada para obtener los datos actualizados directamente de la API.
Consulta de Detalles de un Tipo de Publicación EspecíficoUna vez conocidos los IDs de los tipos de publicación para MLC, se puede obtener información detallada sobre uno en particular 24:
Endpoint: GET https://api.mercadolibre.com/sites/MLC/listing_types/$LISTING_TYPE_ID
(Reemplazar $LISTING_TYPE_ID con un ID obtenido de la llamada anterior, e.g., gold_special).
Respuesta: Un JSON con detalles como listing_exposure (nivel de exposición), duration_days (duración en días, aunque tipos como gold_special y gold_pro suelen tener duración ilimitada 24), y criterios de comisión por venta (sale_fee_criteria).
Consulta de Tipos de Publicación Disponibles para un Usuario y CategoríaNo todos los tipos de publicación están disponibles para todos los vendedores o en todas las categorías. Para verificar las opciones para un usuario y categoría específicos 24:
Endpoint: GET https://api.mercadolibre.com/users/$USER_ID/available_listing_types?category_id=$CATEGORY_ID
(Reemplazar $USER_ID con el ID del vendedor y $CATEGORY_ID con el ID de la categoría chilena).
Respuesta: Un array con los tipos de publicación disponibles, su id, name, y remaining_listings (si hay un límite de publicaciones gratuitas, por ejemplo).
Actualización del Tipo de PublicaciónEs posible cambiar el listing_type_id de una publicación existente. Por ejemplo, se puede pasar de una publicación Clásica a una Premium (o viceversa, en algunos casos).24
Endpoint: POST https://api.mercadolibre.com/items/$ITEM_ID/listing_type
(Reemplazar $ITEM_ID con el ID del ítem a modificar).
Cuerpo de la Solicitud: { "id": "nuevo_listing_type_id" }
Consideraciones: Generalmente, cambiar entre tipos pagos (como Clásica y Premium) es posible. Sin embargo, no suele permitirse hacer un "downgrade" a un tipo de publicación free (Gratuita) desde un tipo pago.24
Tabla: Tipos de Publicación Comunes en Mercado Libre (Ejemplo Genérico, a Confirmar para MLC)La elección del tipo de publicación es una decisión estratégica que impacta tanto la visibilidad como los costos. La siguiente tabla presenta una estructura general; los detalles específicos (IDs, nombres exactos, costos) para Chile deben obtenerse mediante la llamada a GET /sites/MLC/listing_types.
ID (listing_type_id)Nombre Común (Ejemplo)Duración (General)Exposición en ListadosCosto por Venta (General)Características PrincipalesfreeGratuitaLimitada (e.g., 60 días)BajaSin costo (o muy bajo)Ideal para probar, stock limitado, pocas unidades.bronzeBronce (si existe)IlimitadaMedia-BajaComisión menorOpción económica para mayor duración. (MLU tenía bronze como Clásica antes de unificación 24)gold_specialClásicaIlimitadaMedia-AltaComisión estándarBuen balance entre exposición y costo.gold_pro / premiumPremiumIlimitadaMáximaComisión mayorMayor visibilidad, acceso a beneficios como cuotas especiales (en algunos sitios como MLA 24).
Nota: La disponibilidad y características exactas de los listing_type_id para MLC deben ser verificadas directamente a través de la API.Gestión de VariacionesMuchos productos se venden en diferentes versiones, como color, talla, material, etc. Mercado Libre permite agrupar todas estas opciones bajo una única publicación mediante el uso de "variaciones".26 Esto es crucial para productos de categorías como moda, calzado, electrónica, entre otras.Definición y Beneficios:Una variación representa una opción específica de un mismo producto. Por ejemplo, una camiseta puede tener variaciones de color (rojo, azul, negro) y para cada color, variaciones de talla (S, M, L). La condición principal es que las variaciones no impliquen un cambio en el precio base del producto, aunque algunas categorías o configuraciones avanzadas podrían permitirlo.26Los beneficios de usar variaciones son significativos 26:
Menos Preguntas: Los compradores ven claramente todas las opciones disponibles, reduciendo consultas innecesarias.
Stock Organizado: Permite llevar un control de inventario preciso para cada combinación específica (e.g., cuántas camisetas rojas talla M quedan).
Más Exposición: Todas las visitas y ventas de las diferentes opciones se acumulan en una única publicación, lo que puede mejorar su posicionamiento en los resultados de búsqueda en comparación con tener publicaciones separadas para cada variante.
Envíos Más Rápidos: Al momento de la compra, el vendedor sabe exactamente qué variante eligió el comprador, agilizando la preparación del envío.
Mejor Reputación: La eficiencia en la gestión y envío contribuye positivamente a la reputación del vendedor.
Estructura JSON para Ítems con Variaciones:Al crear o actualizar un ítem con variaciones, el campo variations en el JSON principal del ítem contendrá un array de objetos, donde cada objeto define una variación específica. Basado en la estructura de respuesta de 21 y la lógica de creación, el JSON de solicitud se vería así:JSON{
  //... otros campos del ítem como title, category_id, price (precio base), etc....
  "variations":,
      "available_quantity": 5, // Stock específico para esta variación (Negro, Talla 45)
      "sold_quantity": 0, // Generalmente 0 al crear
      "picture_ids":,
      "seller_custom_field": "SKU-VAR-NEG-45" // SKU opcional para esta variación específica
    },
    {
      "price": 10000,
      "attribute_combinations":,
      "available_quantity": 8,
      "picture_ids":,
      "seller_custom_field": "SKU-VAR-AZU-42"
    }
    //... más objetos de variación según sea necesario...
  ]
}
Consideraciones al Crear/Modificar Variaciones:
Las variaciones se pueden definir al momento de crear el ítem (POST /items) o se pueden agregar/modificar en un ítem existente (PUT /items/$ITEM_ID).
Cada variación puede (y usualmente debe) tener su propio available_quantity.
Se pueden asociar imágenes específicas a cada variación. Al crear un ítem, estas imágenes se proveen como URLs en el array pictures del ítem principal, y luego se referencian en picture_ids de cada variación (o la API podría permitir URLs directamente en picture_ids de la variación, verificar documentación). Al consultar un ítem, picture_ids contendrá los IDs asignados por Mercado Libre a esas imágenes.
Se puede asignar un SKU (seller_custom_field o inventory_id en algunos contextos) a cada variación para facilitar la gestión interna del inventario.27
Los atributos utilizados en attribute_combinations deben ser aquellos que la categoría marca con allow_variations: true.
La correcta implementación de variaciones es esencial para muchos vendedores. Permite una representación fiel del catálogo y una gestión de inventario precisa, lo cual es crítico para evitar sobreventas o discrepancias que puedan afectar la experiencia del comprador y la reputación del vendedor.Actualización de Stock y PrecioMantener el stock y los precios actualizados es una tarea continua y vital para cualquier vendedor en Mercado Libre. La API proporciona los mecanismos para realizar estas actualizaciones de forma eficiente.23Endpoint General para Actualizaciones:La mayoría de las actualizaciones a un ítem, incluyendo precio y stock, se realizan mediante una solicitud PUT al endpoint del ítem:PUT https://api.mercadolibre.com/items/$ITEM_ID(Reemplazar $ITEM_ID con el ID del ítem a modificar).Actualización para Ítems Sin Variaciones:Si el ítem no tiene variaciones, la actualización de precio y/o stock es directa en el cuerpo del JSON:JSON{
  "price": 12500,
  "available_quantity": 8
}
Fuentes: 23Se pueden actualizar ambos campos o solo uno de ellos.Actualización para Ítems Con Variaciones:Cuando un ítem tiene variaciones, el precio y el stock son generalmente específicos de cada variación. Por lo tanto, las actualizaciones deben dirigirse a las variaciones individuales dentro del array variations. Intentar modificar el price o available_quantity a nivel raíz del ítem cuando existen variaciones puede no tener el efecto deseado o generar un error.Para actualizar variaciones, se necesita el id de cada variación, el cual se obtiene al crear el ítem o al consultarlo.JSON{
  "variations":
}
Es un error común intentar actualizar solo el precio/stock a nivel de ítem cuando existen variaciones; la API espera que estas modificaciones se especifiquen a nivel de cada variation.id. La documentación 23 confirma que "Este cambio es posible hacerlo tanto en ítems como en variaciones de un ítem", lo que implica que la estructura del payload del PUT debe reflejar si se está modificando el ítem base o sus variaciones.Pausar Publicaciones:Una forma común de pausar una publicación es actualizando su cantidad disponible a cero:{ "available_quantity": 0 }Esto generalmente aplica a ítems con condition: "new" y que no sean de listing_type: "free".23 La publicación pasará a un estado paused con un sub-estado como out_of_stock.Reactivar Publicaciones:
Si una publicación fue pausada automáticamente por falta de stock (out_of_stock), simplemente actualizar available_quantity a un valor mayor que cero la reactivará automáticamente.23
Alternativamente, se puede cambiar explícitamente el estado de la publicación a active:
{ "status": "active" }
Es importante notar que el valor del estado debe enviarse en minúsculas.23
Tiempo de Fabricación (manufacturing_time):Para productos que requieren un tiempo de preparación antes de estar listos para el envío (e.g., productos personalizados, por encargo, o que se reabastecen periódicamente), se puede especificar un tiempo de disponibilidad de stock.23
Este tiempo se define en el array sale_terms del ítem (o de la variación, si aplica).
Formato: {"id": "MANUFACTURING_TIME", "value_name": "X días"} (e.g., "5 días", "1 semana").
Consulta de Disponibilidad en Categoría: Antes de usarlo, es bueno verificar si la categoría del ítem soporta el sale_term MANUFACTURING_TIME:
GET https://api.mercadolibre.com/categories/$CATEGORY_ID/sale_terms.23
Para agregar o modificar el tiempo de fabricación en un ítem existente:
PUT https://api.mercadolibre.com/items/$ITEM_ID
Body:
JSON{
  "sale_terms":
}


La sincronización precisa del stock y los precios es fundamental para evitar ventas de productos agotados (lo que lleva a cancelaciones y afecta la reputación) y para asegurar que los precios reflejen la estrategia comercial del vendedor.Ejemplos de Código para Gestión de PublicacionesSe recomienda incluir ejemplos de código prácticos en Python (usando requests) y/o JavaScript (Node.js con axios o node-fetch) para las siguientes operaciones:
Predecir categoría para un título de producto.
Obtener atributos de una categoría.
Crear un ítem simple.
Crear un ítem con múltiples variaciones (incluyendo asignación de imágenes y SKUs por variación).
Consultar un ítem por su ID.
Actualizar el precio y stock de un ítem sin variaciones.
Actualizar el precio y stock de variaciones específicas de un ítem.
Pausar y reactivar una publicación.
Agregar/modificar el tiempo de fabricación de un ítem.
Estos ejemplos deben estar adaptados para el sitio de Chile (MLC, CLP).5. Gestión de Ventas y ÓrdenesUna vez que los productos están publicados y comienzan a venderse, la gestión eficiente de las órdenes se vuelve primordial. La API de Mercado Libre ofrece un conjunto de recursos para consultar, buscar y obtener detalles de las ventas realizadas, así como para interactuar con la información de los pagos asociados a través de la API de Mercado Pago.Consulta y Búsqueda de ÓrdenesLa API permite acceder a la información de las órdenes tanto de forma individual como mediante búsquedas con diversos filtros.29Obtener una Orden Específica por IDPara recuperar los detalles de una orden particular, se utiliza su ORDER_ID:
Endpoint: GET https://api.mercadolibre.com/orders/$ORDER_ID.29
Autenticación: Esta llamada requiere un access_token que pertenezca al vendedor o al comprador de la orden. Si el caller.id (identificador del usuario que realiza la llamada) no coincide con ninguno de los dos, se producirá un error.29
Campos Clave en la Respuesta: El JSON de respuesta es rico en información y puede incluir 29:

id: El identificador único de la orden.
status: El estado actual de la orden (e.g., paid, cancelled, payment_required). Se detallarán los estados más adelante.
date_created: Fecha y hora de creación de la orden.
date_closed: Fecha y hora en que la orden se cerró (generalmente cuando el pago se acredita y el estado cambia a paid por primera vez). Este es un momento crucial, ya que es cuando el stock del ítem se descuenta efectivamente.29
order_items: Un array de objetos, cada uno representando un producto vendido en la orden. Incluye item.id, item.title, quantity, unit_price, currency_id.
payments: Un array de objetos, cada uno representando un pago asociado a la orden. Incluye id (el ID del pago en Mercado Pago), status, transaction_amount.
shipping: Un objeto con información del envío, incluyendo id (el ID del envío), status, shipping_mode, dirección de envío, etc.
buyer: Un objeto con información (limitada por privacidad) del comprador. Usualmente incluye id, nickname, first_name, last_name.
seller: Un objeto con información del vendedor.
tags: Un array de etiquetas que describen características de la orden (e.g., paid, not_yet_shipped, delivered, mshops si es de Mercado Shops, test_order si es una orden de prueba).
total_amount: El monto total de la orden.
currency_id: La moneda de la orden (e.g., CLP).


Buscar ÓrdenesPara buscar múltiples órdenes basadas en criterios específicos, se utiliza el endpoint de búsqueda 29:
Endpoint: GET https://api.mercadolibre.com/orders/search
Consideración: Este endpoint por sí solo (sin filtros) no realiza ninguna acción o podría devolver un error. Es necesario aplicar filtros.
Filtros Comunes (parámetros query) 29:

seller=$SELLER_ID: Para obtener todas las órdenes de un vendedor específico. Este es el filtro más común para las integraciones de vendedores.
buyer=$BUYER_ID: Para obtener las órdenes de un comprador específico.
status=$ORDER_STATUS: Filtra por el estado de la orden (e.g., paid, cancelled).
item=$ITEM_ID_OR_TITLE: Filtra por un ítem específico, ya sea por su ID o por palabras en su título.
tags=$TAG1,$TAG2: Filtra por etiquetas, separadas por coma (e.g., paid,not_yet_shipped). También existe tags.not para excluir etiquetas.
q=$QUERY_TERM: Un campo de búsqueda genérico que puede usarse para buscar por ID de ítem, ID de pago, ID de envío, etc.
Filtros de Fecha: Se pueden aplicar rangos de fechas a campos como order.date_created o order.date_closed. Por ejemplo: order.date_created:.
Retención de Órdenes: La documentación indica que las órdenes se guardan y son accesibles a través de la búsqueda por un período de hasta 12 meses. Las búsquedas realizadas como vendedor filtran automáticamente las órdenes canceladas, a menos que se especifique lo contrario.29


Ordenamiento (parámetro query sort) 29:

Permite ordenar los resultados. Por ejemplo, sort=date_desc ordena por fecha de creación descendente (más recientes primero). sort=date_asc es el orden por defecto.


Paginación (parámetros query offset y limit):

limit: Define la cantidad máxima de órdenes a devolver por página (e.g., limit=50).
offset: Define el punto de inicio para la paginación (e.g., offset=0 para la primera página, offset=50 para la segunda si limit=50).


Información del CompradorObtener datos del comprador es esencial para el cumplimiento de la orden (envío, facturación) y la comunicación.
La API de órdenes (/orders/$ORDER_ID) proporciona información básica del comprador dentro del objeto buyer, como id, nickname, y a veces first_name y last_name.29
Para datos más específicos como la dirección de envío, esta se encuentra dentro del objeto shipping de la orden.
Para datos de facturación, puede ser necesario consultar APIs adicionales. 2 menciona que la API de facturas permite obtener "datos de facturación de un comprador".
La integración con sistemas CRM como Kommo 30 sugiere que se puede obtener el "Nombre de contacto" del comprador.
Es fundamental manejar la información del comprador con estricto apego a las políticas de privacidad de Mercado Libre y las regulaciones de protección de datos vigentes en Chile. La plataforma busca un equilibrio entre proveer al vendedor la información necesaria para concretar la venta y proteger la privacidad del comprador. Por ello, la API segmenta la exposición de datos, revelando solo lo indispensable en cada contexto.Órdenes de Carrito (packs)Si un comprador adquiere múltiples ítems de un mismo vendedor en una sola transacción (compra de carrito), Mercado Libre puede agrupar estas bajo un pack_id. Para ver las órdenes individuales que componen esta compra de carrito, es necesario utilizar el recurso /packs.29 La orden principal podría tener un pack_id que luego se usa para consultar los detalles del paquete.Tabla: Estados Comunes de Órdenes y su SignificadoEl estado (status) de una orden indica su progreso en el ciclo de vida de la venta. Comprender estos estados es crucial para la lógica de negocio de cualquier integración.Estado (status)DescripciónconfirmedLa orden ha sido confirmada, pero el pago aún puede estar pendiente o en proceso.payment_requiredSe requiere el pago para que la orden proceda.payment_in_processEl pago ha sido iniciado pero aún no se ha acreditado (e.g., pago en revisión).partially_paidSe ha acreditado un pago parcial, pero no es suficiente para cubrir el total de la orden.paidEl pago total de la orden ha sido acreditado. Este es un estado clave para iniciar el proceso de envío.partially_refundedSe ha realizado un reembolso parcial sobre los pagos de la orden.pending_cancelSe ha solicitado la cancelación de la orden, pero está pendiente (e.g., esperando la devolución del pago).cancelledLa orden ha sido cancelada (por el comprador, el vendedor, o el sistema).invalidLa orden es considerada inválida por alguna razón.Fuente: 29Estado del Pago (Integración con Mercado Pago API)Aunque la API de órdenes de Mercado Libre proporciona información sobre los pagos asociados, la fuente autoritativa y más detallada para el estado de un pago es la API de Mercado Pago. Los pagos de las ventas en Mercado Libre se procesan a través de Mercado Pago.6API Separada y Autenticación
La API de Mercado Pago opera en un dominio base diferente: https://api.mercadopago.com.6
Requiere autenticación, usualmente con un ACCESS_TOKEN de Mercado Pago. Este token puede ser el mismo que se usa para la API de Mercado Libre si la aplicación fue creada con los scopes necesarios para ambas plataformas, o si se utilizan las credenciales de la cuenta del vendedor que ya están vinculadas.
Obtener Información de un Pago por IDEl payment_id necesario para consultar en la API de Mercado Pago se puede obtener del array payments en la respuesta de la API de Órdenes de Mercado Libre (/orders/$ORDER_ID).
Endpoint: GET https://api.mercadopago.com/v1/payments/$PAYMENT_ID.31
Respuesta: Un JSON con información detallada del pago, incluyendo:

id: El ID del pago.
status: El estado del pago (e.g., pending, approved, authorized, in_process, in_mediation, rejected, cancelled, refunded, charged_back).
status_detail: Un código más específico que detalla la razón del estado (e.g., accredited, cc_rejected_bad_filled_security_code).
date_created, date_approved, date_last_updated.
transaction_amount, currency_id.
payment_method_id (e.g., visa, master, webpay).
payment_type_id (e.g., credit_card, debit_card, account_money).
payer: Información del pagador.
external_reference: Una referencia externa que se puede establecer al crear el pago (útil para vincularlo con la orden de MELI).
Y muchos otros campos detallando la transacción, comisiones, cuotas, etc..31


Buscar PagosLa API de Mercado Pago también permite buscar pagos utilizando diversos criterios 32:
Endpoint: GET https://api.mercadopago.com/v1/payments/search
Filtros Comunes:

status: Por estado del pago.
external_reference: Si se configuró, puede ser el ID de la orden de Mercado Libre.
payer.id: ID del pagador.
payment_method_id, payment_type_id.
Rangos de fechas: begin_date y end_date (formato ISO 8601). Se pueden usar variables como NOW combinadas con unidades de tiempo (MINUTES, HOURS, DAYS, WEEKS) para búsquedas relativas (e.g., pagos de las últimas 2 horas).32


La sincronización entre una orden de Mercado Libre y su(s) pago(s) en Mercado Pago es un aspecto fundamental de la integración. El estado paid de una orden en Mercado Libre generalmente se activa cuando el pago correspondiente alcanza un estado approved (o similar) en Mercado Pago. Por lo tanto, las aplicaciones a menudo necesitan consultar ambos sistemas para tener una visión completa del estado de una venta y tomar decisiones informadas, como liberar el stock para envío o marcar una orden como lista para facturar.Ejemplos de Código para Gestión de Órdenes y PagosSe recomienda incluir ejemplos de código (Python/JavaScript) para:
Obtener una orden específica de Mercado Libre por su ID.
Buscar órdenes de un vendedor por estado (e.g., paid) y rango de fechas.
Extraer el payment_id de una orden de Mercado Libre.
Consultar el estado detallado de ese pago utilizando la API de Mercado Pago.
Interpretar los estados clave de órdenes y pagos.
Estos ejemplos deben ilustrar cómo manejar la autenticación para ambas APIs si es necesario y cómo correlacionar la información entre ellas.6. Logística y Envíos: Mercado Envíos ChileMercado Envíos es la solución logística integrada de Mercado Libre, diseñada para simplificar el proceso de envío tanto para vendedores como para compradores. En Chile, Mercado Envíos ofrece diferentes modalidades, y la API juega un papel importante en la gestión de estos envíos, desde el cálculo de costos hasta la generación de etiquetas y el seguimiento.33Visión General de Mercado Envíos en ChileMercado Libre Chile (MLC) cuenta con las siguientes modalidades principales de Mercado Envíos 33:

Mercado Envíos Full (Fulfillment):

En esta modalidad, el vendedor envía sus productos en volumen a las bodegas (centros de fulfillment) de Mercado Libre. Una vez allí, Mercado Libre se encarga de todo el proceso logístico: almacenamiento, preparación de pedidos (picking y packing), y el envío final al comprador.33
Disponibilidad: Este servicio está activo en Chile.33
Interacción con la API para Fulfillment: Las APIs relacionadas con Fulfillment se utilizan principalmente para consultar el stock disponible en las bodegas de Mercado Libre y para monitorear las operaciones y movimientos de dicho stock. Por ejemplo, se puede consultar el inventory_id de un ítem (a través del recurso /items/$ITEM_ID) y luego usarlo para buscar operaciones de stock en el endpoint /stock/fulfillment/operations/search.34 La gestión del envío de inventario hacia las bodegas de Fulfillment (inbounding) y el cambio de la logística de una publicación a Fulfillment se realiza generalmente a través del Seller Center (la interfaz web para vendedores) y no directamente por API.34 La facturación para envíos Full en Chile puede ser automática a través de la herramienta de Mercado Libre, y estas facturas pueden obtenerse vía API.34



Mercado Envíos Direct to Consumer (Coleta/Agencia o Cross Docking):

Bajo esta modalidad, el vendedor es responsable de preparar el paquete una vez concretada la venta. Luego, lo entrega a los transportistas asociados de Mercado Libre (mediante recolección o "coleta" en el domicilio del vendedor) o lo deposita en puntos de despacho designados (agencias).33
Disponibilidad: Este modelo está disponible en Chile.33
Interacción con la API: Este es el modelo donde la API de envíos es más utilizada por el vendedor para tareas como el cálculo de costos de envío, la obtención de información del envío de una orden, la generación de etiquetas y el seguimiento.


Es crucial que al publicar un ítem, se incluya información precisa sobre el tamaño y peso del producto, ya que esto es fundamental para calcular los costos de envío y los impuestos correspondientes para cada país.33Cálculo de Costos de EnvíoLa API de Mercado Libre proporciona endpoints para estimar los costos de envío tanto desde la perspectiva del vendedor (cuánto le costará enviar) como desde la del comprador (cuánto pagará por recibir el producto).35Estimación de Costos para el Vendedor (al publicar/editar un ítem)Este endpoint permite al vendedor conocer el costo aproximado que asumirá por el envío de un ítem específico, o simular costos al momento de crear o modificar una publicación.
Endpoint: GET https://api.mercadolibre.com/users/$USER_ID/shipping_options/free.35
(Reemplazar $USER_ID con el ID del vendedor).
Parámetros Query Clave:

item_price: El precio del ítem.
dimensions: Las dimensiones y peso del paquete, en un formato específico: altoxanchoxlargo,peso_en_gramos (e.g., 9x17x22,462 para un paquete de 9cm x 17cm x 22cm y 462 gramos).
listing_type_id: El tipo de publicación del ítem (e.g., gold_pro).
mode: El modo de envío (e.g., me2 para Mercado Envíos).
condition: La condición del ítem (e.g., new).
logistic_type: El tipo de logística (e.g., drop_off si el vendedor lleva el paquete a un punto, cross_docking, fulfillment).
verbose=true: Para obtener una respuesta más detallada.


Respuesta: Un JSON que incluye un objeto coverage. Dentro de coverage.all_country (si aplica a todo el país) se encuentran 35:

list_cost: El costo del envío que se le ofrece al vendedor.
currency_id: La moneda del costo (e.g., CLP).
billable_weight: El peso facturable del envío.
También puede incluir un objeto discount si Mercado Libre aplica algún descuento al costo de envío para el vendedor, con detalles como rate (tasa de descuento) y promoted_amount (monto base sobre el cual se aplica el descuento).


Estimación de Costos para el Comprador (o para el vendedor simular el costo al comprador)Este endpoint se utiliza para calcular las opciones y costos de envío a un destino específico, típicamente en el proceso de compra.
Endpoint: GET https://api.mercadolibre.com/items/$ITEM_ID/shipping_options.35
(Reemplazar $ITEM_ID con el ID del ítem).
Parámetros Query (al menos uno es requerido):

zip_code=$ZIP_CODE: El código postal del destino del comprador.
city_to=$CITY_ID: El ID de la ciudad de destino (formato específico de MELI).


Respuesta: Un JSON que incluye un array options. Cada objeto en options representa una opción de envío disponible (e.g., envío normal, envío express) con detalles como 35:

id: Identificador de la opción de envío.
name: Nombre del servicio de envío.
list_cost: El costo del envío para el comprador.
currency_id: Moneda.
estimated_delivery_time: Un objeto con la estimación del tiempo de entrega.
display: Cómo se debe mostrar la opción (recommended, always, optional).


Envío Gratis ObligatorioPara ciertos ítems, generalmente aquellos que superan un umbral de precio establecido por Mercado Libre, el ofrecimiento de envío gratuito puede ser obligatorio para el vendedor. La API puede indicar esto a través de la etiqueta mandatory_free_shipping en la respuesta de la consulta de un ítem (/items/$ITEM_ID) o en la respuesta de /users/$USER_ID/shipping_options/free.35 En estos casos, el vendedor debe cubrir el costo del envío, o Mercado Libre puede subsidiar una parte. Para productos por debajo de ese umbral, ofrecer envío gratis es opcional y una estrategia comercial del vendedor.El cálculo de costos de envío es un proceso complejo que considera múltiples variables: dimensiones, peso, valor del producto, tipo de publicación, niveles de Mercado Puntos del comprador y del vendedor, origen y destino, y si existen campañas de envío gratuito activas. Las APIs proporcionan las herramientas para navegar esta complejidad y obtener estimaciones precisas.Obtención de Información de Envío de una OrdenUna vez que una orden ha sido confirmada y está lista para ser despachada bajo Mercado Envíos, se genera un shipping_id.
Este shipping_id se obtiene del objeto shipping dentro de la respuesta de la consulta de una orden (GET /orders/$ORDER_ID).29
Para obtener los detalles completos del envío, se utiliza el siguiente endpoint (la documentación puede variar ligeramente en la ruta exacta, por lo que siempre es bueno verificar en el DevCenter; 29 sugiere /shipments/shipping.id mientras que la práctica común es un endpoint más directo):

Endpoint probable: GET https://api.mercadolibre.com/shipments/$SHIPPING_ID o GET /orders/$ORDER_ID/shipments (este último podría devolver un array si hay múltiples envíos, aunque es raro para órdenes simples).


Respuesta: Un JSON con información detallada del envío, como:

id: El shipping_id.
status: El estado actual del envío (e.g., pending, handling, ready_to_ship, shipped, delivered, not_delivered, cancelled).
substatus: Un detalle más específico del estado.
tracking_number: El número de seguimiento del transportista.
tracking_method: El nombre del transportista.
receiver_address: La dirección completa de envío del comprador.
Costos asociados, fechas estimadas, tipo de servicio, etc.


Generación e Impresión de Etiquetas de EnvíoPara los envíos gestionados por el vendedor bajo la modalidad Mercado Envíos Direct to Consumer, es necesario generar e imprimir una etiqueta de envío proporcionada por Mercado Libre. Esta etiqueta contiene toda la información necesaria para el transportista y para el seguimiento del paquete.

Disponibilidad: Aplica a órdenes con Mercado Envíos que no son gestionadas por Fulfillment.


Proceso General:

Identificar las órdenes que están en estado ready_to_ship o similar, indicando que el pago está confirmado y el envío debe prepararse.
Solicitar la etiqueta a la API de Mercado Libre utilizando el shipping_id (o un conjunto de shipping_ids para generación masiva, si la API lo soporta).
La API devuelve la etiqueta, comúnmente en formato PDF (para impresoras estándar) o ZPL (para impresoras térmicas de etiquetas, como las Zebra).



Endpoints Específicos:Los snippets de investigación proporcionados no detallan explícitamente el endpoint directo de la API de Mercado Libre para la generación de etiquetas con la misma claridad que otros recursos. Gran parte de la información sobre generación de etiquetas proviene de documentación de herramientas de terceros que se integran con Mercado Libre, como Multivende 36 o DuxSoftware 39, o se refiere al proceso físico de impresión.40Por ejemplo37 (Multivende) menciona un endpoint Get delivery orders with available labels y luego otro para generar la etiqueta, pero estos parecen ser parte de la API de Multivende.Históricamente, la API de Mercado Libre ha ofrecido endpoints como:GET /shipments/$SHIPPING_ID/labels?responseType=zpl2 (para ZPL)GET /shipments/$SHIPPING_ID/labels?responseType=pdf (para PDF)O para múltiples etiquetas:GET /shipments/labels?shipment_ids=$SHIPPING_ID_1,$SHIPPING_ID_2&responseType=zpl2
Es crucial que los desarrolladores consulten la sección más actualizada de "Envíos" o "Shipments" en el DevCenter de Mercado Libre para confirmar los endpoints exactos, los parámetros requeridos (como responseType o savePdf=Y) y el flujo correcto para la obtención de etiquetas. La falta de un endpoint canónico y simple en los documentos analizados sugiere que este proceso puede tener matices o que Mercado Libre podría estar evolucionando la forma en que se accede a esta funcionalidad.


Formatos de Etiqueta:

PDF: Adecuado para imprimir en hojas A4 o carta usando impresoras convencionales. La hoja luego se recorta y se adhiere al paquete.
ZPL (Zebra Programming Language): Un formato estándar para impresoras térmicas de etiquetas. Estas impresoras utilizan rollos de etiquetas autoadhesivas, lo que agiliza el proceso de etiquetado para vendedores con volumen.40


La generación de etiquetas es un paso indispensable en el flujo de despacho. Aunque herramientas de terceros pueden simplificarlo, comprender cómo interactuar directamente con la API de Mercado Libre para esta tarea es valioso para integraciones personalizadas.Seguimiento de EnvíosTanto el vendedor como el comprador necesitan poder rastrear el progreso de un envío.
Desde la API de Mercado Libre:

Consultando el recurso del envío (GET /shipments/$SHIPPING_ID) se puede obtener el status, substatus, tracking_number y tracking_method (nombre del transportista).41 Mercado Libre actualiza estos estados a medida que recibe información del transportista.


Usando el tracking_number con el Transportista:

Una vez que se tiene el tracking_number y el nombre del transportista, se puede utilizar esta información para rastrear el paquete directamente en el sitio web del transportista asignado (e.g., Chilexpress, Starken, Blue Express, Correos de Chile, o los transportistas internacionales que Mercado Libre utilice para envíos desde/hacia Chile como FedEx 43). Esta es a menudo la fuente más actualizada y detallada del tránsito del paquete.


Herramientas de Terceros para Seguimiento:
Existen plataformas de seguimiento de envíos multichascos como 17TRACK 42, Ship24 44, y Skydropx 41 que permiten ingresar un número de seguimiento y obtener información consolidada de diversos transportistas, incluyendo los utilizados por Mercado Envíos. Estas herramientas pueden ser útiles para los compradores o para los vendedores que desean una vista unificada. 42 incluso menciona que la API de seguimiento de Mercado Libre facilita el rastreo automático y el envío de notificaciones vía Webhook.
Proporcionar al comprador el número de seguimiento y el nombre del transportista es una buena práctica que mejora la experiencia post-venta y reduce las consultas sobre el estado del envío.Ejemplos de Código para Gestión de EnvíosSe recomienda incluir ejemplos de código (Python/JavaScript) para:
Calcular el costo de envío para el vendedor y para el comprador (usando código postal chileno).
Obtener la información detallada de un envío de una orden existente.
(Si se identifica el endpoint oficial y es factible) Solicitar y descargar una etiqueta de envío en formato PDF o ZPL.
Extraer el tracking_number para el seguimiento.
Estos ejemplos deben destacar el uso de shipping_id y los parámetros específicos para Chile.7. Interacción con ClientesLa comunicación efectiva con los clientes es un pilar fundamental del comercio electrónico. Mercado Libre facilita esta interacción a través de dos canales principales accesibles vía API: las preguntas pre-venta, que ocurren antes de que se concrete la compra, y la mensajería post-venta, para la comunicación después de realizada la transacción.Gestión de Preguntas Pre-VentaLas preguntas realizadas por los potenciales compradores en la página de un producto son una oportunidad crucial para aclarar dudas, proporcionar información adicional y, en última instancia, influir en la decisión de compra. Una gestión ágil y precisa de estas preguntas puede impactar significativamente las tasas de conversión.9Buscar PreguntasLa API permite buscar preguntas utilizando diversos criterios. Es importante notar que se recomienda utilizar api_version=4 en las llamadas para obtener la estructura JSON más reciente y completa. Si una pregunta tiene el estado BANNED (prohibida o moderada), su texto se devolverá vacío.9
Preguntas Recibidas por un Vendedor:

Endpoint: GET https://api.mercadolibre.com/questions/search?seller_id=$SELLER_ID&api_version=4.9
(Reemplazar $SELLER_ID con el ID del vendedor).


Preguntas Recibidas Respecto de un Ítem:

Endpoint: GET https://api.mercadolibre.com/questions/search?item=$ITEM_ID&api_version=4.9
(Reemplazar $ITEM_ID con el ID del ítem, e.g., MLC123456789).


Preguntas por ID Específico:

Endpoint: GET https://api.mercadolibre.com/questions/$QUESTION_ID?api_version=4.9


Filtros Adicionales:

status: Permite filtrar por estado de la pregunta (e.g., ANSWERED, UNANSWERED, CLOSED_UNANSWERED, UNDER_REVIEW, BANNED).
from: ID del usuario que formuló la pregunta (para buscar preguntas de un cliente específico sobre un ítem).
date_created (o rangos de fechas): Para buscar preguntas dentro de un período específico.


Ordenamiento:

sort_fields: Campos por los cuales ordenar (e.g., date_created, item_id).
sort_types: Dirección del ordenamiento (ASC o DESC).9


Formular Preguntas (como comprador de prueba)Para probar el flujo completo, se puede simular la acción de un comprador formulando una pregunta sobre un ítem de prueba:
Endpoint: POST https://api.mercadolibre.com/questions.9
Cuerpo de la Solicitud (JSON):
JSON{
  "item_id": "MLC_ITEM_ID_PRUEBA",
  "text": "Hola, ¿tienen este producto en color azul?"
}


Consideraciones: Es importante enviar la solicitud con codificación UTF-8 para evitar problemas con caracteres especiales.9
Responder Preguntas (como vendedor)Una vez identificada una pregunta sin responder (e.g., filtrando por status=UNANSWERED), el vendedor puede responderla a través de la API:
Endpoint: POST https://api.mercadolibre.com/answers.9 (Algunas documentaciones podrían referenciarlo como /questions/$QUESTION_ID/answers o similar, verificar la ruta exacta).
Cuerpo de la Solicitud (JSON):
JSON{
  "question_id": "ID_DE_LA_PREGUNTA_A_RESPONDER",
  "text": "Hola, sí tenemos stock en color azul. Puedes seleccionarlo al momento de comprar."
}


Consideraciones: Las respuestas también deben ser en UTF-8 y deben adherirse a las políticas de comunicación de Mercado Libre (no incluir datos de contacto, enlaces externos no permitidos, etc.).
Eliminar PreguntasEn ciertas circunstancias, puede ser necesario eliminar una pregunta. Esto puede ser realizado tanto por el usuario que formuló la pregunta como por el vendedor sobre una pregunta recibida en su publicación.
Endpoint: DELETE https://api.mercadolibre.com/questions/$QUESTION_ID.9
Autenticación: Requiere el access_token del usuario con permiso para eliminar esa pregunta específica (el que la hizo o el vendedor del ítem).
La automatización de la recepción de preguntas y la facilitación de respuestas rápidas a través de una interfaz integrada puede ser un gran valor añadido para los vendedores, mejorando los tiempos de respuesta y la calidad de la atención pre-venta.Mensajería Post-VentaUna vez que se ha realizado una compra, la comunicación entre el comprador y el vendedor continúa a través del sistema de mensajería post-venta. Este canal es vital para coordinar detalles del envío, ofrecer soporte, resolver dudas sobre el producto recibido o gestionar cualquier eventualidad.45Límites de Tasa (Rate Limits)Es importante destacar que los recursos de mensajería tienen límites de tasa específicos: los endpoints de consulta (GET) comparten un límite de 500 RPM (Requests Per Minute), y los recursos de escritura (POST/PUT) también comparten entre sí un límite de 500 RPM.45Obtener MensajesLos mensajes post-venta están asociados a una orden o, más específicamente, a un pack_id.
Obtención del pack_id: El pack_id se obtiene de la respuesta de la consulta de una orden (GET /orders/$ORDER_ID). Si el campo pack_id en la orden es nulo, se debe tomar por defecto el order_id como pack_id para los recursos de mensajería.45
Obtener Mensajes de un Pack:

Endpoint: GET https://api.mercadolibre.com/messages/packs/$PACK_ID/sellers/$SELLER_ID.45
(Reemplazar $PACK_ID y $SELLER_ID).
Marcar como Leídos: Por defecto, al consultar los mensajes de esta manera, se marcan como leídos. Para evitar esto y solo previsualizarlos, se puede agregar el parámetro mark_as_read=false a la URL:
.../messages/packs/$PACK_ID/sellers/$SELLER_ID?mark_as_read=false.45
Visibilidad: Los mensajes moderados por la contraparte no serán visibles. Sí se podrán ver los mensajes propios que hayan sido moderados.


Obtener un Mensaje Específico por ID:

Endpoint: GET https://api.mercadolibre.com/messages/$MESSAGE_ID.45


Enviar MensajesPara enviar un mensaje al comprador a través de la API:
Endpoint: POST https://api.mercadolibre.com/messages/packs/$PACK_ID/sellers/$USER_ID.45
(Donde $PACK_ID es el identificador de la conversación y $USER_ID es el ID del vendedor que envía el mensaje).
Cuerpo de la Solicitud (JSON):
JSON{
  "from": {
    "user_id": "SELLER_USER_ID", // ID del vendedor
    "email": "seller_email@example.com" // Opcional, verificar si es requerido
  },
  "to":,
  "text": "Estimado cliente, su pedido ha sido enviado. Puede seguirlo con el número de guía: XXXXXX.",
  "attachments":
}

(Estructura adaptada de 45 y la lógica de mensajería).
Consideraciones del Mensaje:

Límite de 350 caracteres por mensaje.
Se permiten caracteres incluidos en la norma ISO-8859-1 (latin1) y una lista específica de emoticones.45 Enviar caracteres no admitidos (e.g., UTF-8 no estándar para la API) resultará en error.
Se pueden incluir enlaces HTML clickeables usando la etiqueta <a>: <a href="su_url_aqui">Texto del enlace</a>.45


Manejo de Adjuntos en Mensajería Post-VentaLa API permite adjuntar archivos a los mensajes, como fotos del producto, manuales de instrucciones, facturas, etc. Este es un proceso de dos pasos 45:

Cargar el Adjunto: Primero, el archivo debe ser cargado al servidor de Mercado Libre.

Endpoint: POST https://api.mercadolibre.com/messages/attachments?tag=post_sale&site_id=MLC
Tipo de Contenido: La solicitud debe ser multipart/form-data.
Cuerpo: La clave debe ser file y el valor, el archivo en sí.
Límites: Tamaño máximo de 25 MB. Formatos permitidos: JPG, PNG, PDF, TXT.
Ejemplo (línea de comandos con cURL):
curl -X POST 'https://api.mercadolibre.com/messages/attachments?tag=post_sale&site_id=MLC' -H 'Authorization: Bearer $ACCESS_TOKEN' -H 'content-type: multipart/form-data;' -F 'file=@/ruta/a/su/archivo.jpg'
Respuesta: Si la carga es exitosa, la API devuelve un JSON con el id del archivo adjunto (e.g., {"id": "210438685_59f0f034-db1b-4ea6-8c5e-1d34e2092482.jpg"}).



Enviar el Mensaje con el Adjunto:

El id del archivo obtenido en el paso anterior se incluye en el array attachments del JSON al enviar el mensaje (ver ejemplo en "Enviar Mensajes"). Si no se necesitan adjuntos, se debe omitir la sección attachments del JSON.



Obtener un Adjunto:

Si se necesita descargar o referenciar un adjunto existente:
GET https://api.mercadolibre.com/messages/attachments/$ATTACHMENT_ID?tag=post_sale&site_id=MLC.45


Restricciones y Errores Comunes en Mensajería
Mensajería Bloqueada: La API puede bloquear el envío de mensajes en ciertas situaciones 45:

Si hay una mediación (reclamo) en proceso (especialmente en Brasil, verificar para MLC).
Si el envío es gestionado por Mercado Envíos Full y aún no ha sido entregado.
Si la orden tiene estado cancelled. Anteriormente, las conversaciones abiertas antes de la cancelación podían continuar, pero la política actual es bloquear la mensajería en órdenes canceladas. El error devuelto es {"status_code": 403, "code": "forbidden", "message": "blocked_conversation_send_message_forbidden"}.
Si el usuario from no tiene acceso a la orden.


Errores de Contenido:

400 - The text has character/s that is/are not supported: Caracteres no admitidos.
400 - The message content is too long, max characters allowed are 350: Mensaje excede el límite.


La mensajería post-venta es una herramienta poderosa para la atención al cliente. Su automatización (e.g., envío de mensajes automáticos en ciertos estados del envío 46) puede mejorar la eficiencia, pero debe hacerse con cuidado para no saturar al comprador y cumplir siempre con las políticas de Mercado Libre.Ejemplos de Código para Interacción con ClientesSe recomienda incluir ejemplos de código (Python/JavaScript) para:
Buscar preguntas no respondidas de un vendedor.
Responder una pregunta.
Obtener los últimos mensajes de una orden.
Enviar un mensaje de texto simple a un comprador.
Cargar un archivo adjunto y luego enviar un mensaje que incluya ese adjunto.
Estos ejemplos deben ilustrar el manejo de pack_id, question_id, y los formatos de datos esperados.8. Estrategias Avanzadas de NegocioMás allá de las operaciones fundamentales de gestión de publicaciones y órdenes, las APIs de Mercado Libre ofrecen capacidades para implementar estrategias de negocio más sofisticadas. Estas incluyen la sincronización avanzada de inventario, la gestión de publicidad (Product Ads), el monitoreo y manejo de la reputación del vendedor, la automatización de precios, la participación en promociones y la gestión de reclamos.Sincronización de InventarioUna sincronización de inventario precisa y en tiempo real es crucial para evitar la sobreventa (vender productos sin stock, lo que lleva a cancelaciones y daña la reputación) y la subutilización del inventario (no mostrar stock disponible en Mercado Libre cuando sí existe).
Actualización de Stock en Mercado Libre: Como se detalló en la Sección 4.5, el stock se actualiza enviando una solicitud PUT a /items/$ITEM_ID (para ítems sin variaciones) o actualizando el campo available_quantity dentro de los objetos de variación correspondientes (para ítems con variaciones).
Sincronización Bidireccional: Una verdadera sincronización de inventario es bidireccional:

Del Sistema del Vendedor a Mercado Libre: Cuando el stock cambia en el sistema interno del vendedor (ERP, sistema de gestión de inventario), este cambio debe reflejarse en Mercado Libre mediante la API.
De Mercado Libre al Sistema del Vendedor: Cuando ocurre una venta en Mercado Libre, el stock del producto vendido debe disminuirse en el sistema interno del vendedor. Esto se logra de dos maneras principales:

Webhooks (Notificaciones): Suscribiéndose al tópico de órdenes (e.g., orders_v2 o similar, ver Sección 9). Cuando se crea o actualiza una orden, Mercado Libre envía una notificación a la URL de callback configurada. La aplicación del vendedor recibe esta notificación, consulta los detalles de la orden (GET /orders/$ORDER_ID), y si la orden está en un estado que implica la confirmación de la venta (e.g., paid, o al momento del date_closed 29 que es cuando el stock se descuenta oficialmente en MELI), actualiza el inventario en su sistema.
Polling (Consultas Periódicas): Si no se utilizan webhooks, la aplicación del vendedor puede consultar periódicamente las órdenes nuevas o actualizadas (GET /orders/search con filtros de fecha y estado) y procesarlas de manera similar. El polling es menos eficiente y tiene mayor latencia que los webhooks.




La clave para una sincronización robusta es un sistema que pueda manejar concurrencia, reintentos en caso de fallos de comunicación y que tenga una lógica clara para determinar cuándo el stock debe ser comprometido o liberado.Publicidad: Gestión de Product AdsProduct Ads es la solución publicitaria integrada de Mercado Libre que permite a los vendedores promocionar sus productos para aumentar su visibilidad y alcanzar a más compradores potenciales dentro de la plataforma.7 La API de Product Ads permite gestionar estas campañas de forma programática.Versión de API y Activación
Nueva Versión: Es fundamental utilizar la versión más reciente de la API de Product Ads. 7 indica que una versión anterior quedará obsoleta el 6 de junio de 2025. Este manual se enfoca en la nueva versión.
Activación del Producto: Si al intentar usar los endpoints de Product Ads se recibe un error 404 - No permissions found for user_id, significa que el vendedor no tiene Product Ads activado en su cuenta. Debe activarlo manualmente desde la interfaz de Mercado Libre (e.g., Mi cuenta > Publicidad o similar) antes de poder gestionarlo vía API.7
Conceptos Clave
advertiser_id: Es el identificador del anunciante (el vendedor que invierte en publicidad). Se puede obtener una lista de los advertiser_id a los que un usuario tiene acceso mediante:
GET https://api.mercadolibre.com/advertising/advertisers?product_id=PADS
(Se debe incluir el encabezado Api-Version: 1 47). La respuesta también incluye site_id y advertiser_name.7
Modos de Gestión de AnunciosProduct Ads ofrece dos modos de gestión 7:
Automático: En este modo (que es el predeterminado al comenzar), Product Ads selecciona automáticamente las publicaciones del vendedor con buen rendimiento de ventas y las promociona. El vendedor puede añadir o quitar manualmente publicaciones de esta campaña automática.
Personalizado: Este modo ofrece un control mucho más granular. Permite al vendedor crear múltiples campañas, agrupar anuncios (publicaciones) dentro de ellas, y asignar un presupuesto y una estrategia (objetivo) específicos para cada campaña. Es ideal para una gestión más estratégica y para optimizar el rendimiento en función de diferentes objetivos.
Gestión de Campañas (Modo Personalizado)
Crear Campaña:

Endpoint: POST https://api.mercadolibre.com/advertising/product_ads/campaigns (Endpoint inferido basado en la estructura de la API, verificar la documentación del DevCenter para la ruta exacta y la versión de API requerida).
Cuerpo de la Solicitud (JSON) - Parámetros Clave 7:

advertiser_site_id: El site_id del anunciante (e.g., MLC).
advertiser_id: El ID del anunciante.
name: Nombre descriptivo para la campaña.
status: Estado inicial de la campaña (active o paused).
budget: Presupuesto diario promedio para la campaña. Mercado Libre puede invertir hasta el doble del presupuesto diario en un día específico, utilizando el saldo no consumido de días anteriores. Por ejemplo, si el presupuesto es de $1.000 CLP, se podría invertir hasta $2.000 CLP si hay saldo remanente.7
strategy: El tipo de estrategia de la campaña. Valores posibles:

profitability (Rentabilidad): Muestra menos anuncios pero a usuarios con mayor probabilidad de compra. Recomendada para productos con alto volumen de ventas.
increase (Crecimiento): Busca un equilibrio entre rentabilidad y visibilidad. Sugerida para productos con buen nivel de ventas, pero no los más vendidos.
visibility (Visibilidad): Invierte más para mostrar anuncios a la mayor cantidad de usuarios posible. Recomendada para publicaciones nuevas o con pocas ventas.


channel: Canal de la campaña. Puede ser marketplace (para Mercado Libre) o mshops (para dirigir tráfico a la tienda online en Mercado Shops). El valor predeterminado es marketplace.
acos_target: Advertising Cost of Sales (ACOS) Objetivo. Es el porcentaje del costo de la campaña en relación con los ingresos generados por ella. Ayuda al algoritmo de Product Ads a definir cómo invertir el presupuesto. Debe ser un valor entre 3 y 500 (%). Mercado Libre suele proveer un ACOS de referencia para cada estrategia.




Consultar Campañas:

Endpoint: GET https://api.mercadolibre.com/advertising/advertisers/$ADVERTISER_ID/product_ads/campaigns.47
(Se debe incluir el encabezado api-version: 2 47).
Filtros: campaign_ids (lista separada por comas), status, channel.
Parámetros para Métricas: date_from y date_to (formato YYYY-MM-DD) para definir el rango de fechas. Se puede consultar hasta 90 días hacia atrás. La información para validar métricas se actualiza a las 10:00 AM GMT-3.47


Métricas de Campaña: La respuesta de la consulta de campañas puede incluir una amplia gama de métricas si se solicita un rango de fechas, tales como 47:

clicks: Número de clics en los anuncios.
impressions (o prints): Número de veces que se mostraron los anuncios.
cost: Gasto total de la campaña.
cpc: Costo Por Clic.
acos: Costo Publicitario de Ventas.
Ventas y unidades atribuidas a la publicidad (directas e indirectas/asistidas): direct_items_quantity, indirect_items_quantity, direct_units_quantity, indirect_units_quantity, direct_amount (valor de ventas directas), indirect_amount (valor de ventas asistidas), total_amount.


Gestión de Anuncios (Ads) dentro de CampañasUna vez creada una campaña personalizada, el siguiente paso es agregarle anuncios (que corresponden a las publicaciones del vendedor). Los endpoints específicos para agregar, quitar, pausar o activar anuncios individuales dentro de una campaña no están explícitamente detallados en 47 o 7, pero son una parte lógica y esperada de la gestión de campañas. Se deberá consultar la documentación del DevCenter para estas operaciones (probablemente bajo un recurso como /product_ads/campaigns/$CAMPAIGN_ID/ads o similar).La nueva API de Product Ads proporciona un control significativo sobre las estrategias publicitarias. La elección adecuada de la strategy, la definición del budget y el acos_target, junto con un seguimiento constante de las métricas, son clave para el éxito de las campañas. La capacidad de gestionar esto vía API permite a los vendedores con catálogos extensos o múltiples campañas automatizar y optimizar sus esfuerzos publicitarios.Gestión de la Reputación del VendedorLa reputación en Mercado Libre es un indicador crucial de la calidad del servicio de un vendedor y tiene un impacto directo en la confianza de los compradores y, por ende, en la visibilidad de sus publicaciones y su capacidad para concretar ventas.48 Se representa visualmente mediante una escala de colores, desde rojo (peor) hasta verde (mejor).Consulta de Reputación vía APILa API permite a los vendedores consultar su reputación y las métricas que la componen.
Endpoint probable: GET https://api.mercadolibre.com/users/$USER_ID/seller_reputation
(Aunque 49 se enfoca en los componentes de la reputación, este es el endpoint comúnmente utilizado).
Respuesta Esperada (campos clave):

level_id: El nivel de reputación actual (e.g., 5_green, 4_light_green, 3_yellow, 2_orange, 1_red).
power_seller_status: Si el vendedor es MercadoLíder, y de qué tipo (e.g., gold, platinum, o null si no lo es).
transactions: Objeto con el total de transacciones, completadas, canceladas, etc., en el período evaluado.

period: El período que se está considerando para el cálculo (e.g., last 60 days, last 365 days).


metrics: Un objeto que detalla las métricas clave que influyen en la reputación:

claims: Relacionado con los reclamos. Incluye rate (porcentaje de ventas con reclamos) y value (cantidad de reclamos).
delayed_handling_time: Relacionado con los despachos con demora. Incluye rate y value.
cancellations: Relacionado con las cancelaciones hechas por el vendedor. Incluye rate y value.




Variables Clave que Afectan la Reputación (Específicas para MLC - Chile)49 proporciona los umbrales exactos para cada color de reputación en Mercado Libre Chile (MLC) basados en tres variables principales:
Reclamos (claims_rate): Porcentaje de ventas que recibieron reclamos por parte de los compradores, sobre el total de ventas concretadas. Se necesita un mínimo de 3 ventas con reclamos para que esta métrica comience a afectar la reputación.49

Fórmula: claims_rate = (ventas con reclamos / ventas totales) * 100


Cancelaciones por el Vendedor (cancellations_rate): Porcentaje de ventas que el propio vendedor canceló, sobre el total de ventas concretadas.

Fórmula: cancellations_rate = (cancelaciones hechas por el vendedor / ventas totales) * 100


Despachos con Demora (delayed_handling_time_rate): Porcentaje de envíos realizados a través de Mercado Envíos que fueron despachados fuera del plazo establecido por Mercado Libre, sobre el total de envíos con Mercado Envíos.
Tabla: Umbrales de Reputación para Mercado Libre Chile (MLC)La siguiente tabla resume los porcentajes máximos permitidos para cada métrica y nivel de reputación en Chile, según 49:VariableMercadoLíderes (%)Verde (%)Amarillo (%)Naranja (%)Rojo (%)Reclamos≤2.5≤3.5≤5.5≤7>7Cancelaciones (Vendedor)≤1.5≤2.5≤7≤9>9Despachos con Demora≤10≤12≤18≤26>26Período de EvaluaciónEl período de tiempo que Mercado Libre considera para calcular estas métricas depende del volumen de ventas del vendedor 49:
Para MLC (Chile):

Si el vendedor tiene 40 o más ventas concretadas en los últimos 60 días, la reputación se calcula con base en el desempeño de esos últimos 60 días.
Si el vendedor tiene menos de 40 ventas concretadas en los últimos 60 días, la reputación se calcula con base en el desempeño de los últimos 365 días.


Protección para Vendedores Nuevos o en TransiciónMercado Libre puede ofrecer períodos de "protección" para vendedores nuevos o aquellos cuya reputación podría verse afectada temporalmente por cambios en el sistema. Durante este tiempo, la reputación mostrada puede no ser la "real". La API puede devolver 49:
real_level: El nivel de reputación real del vendedor si no estuviera protegido.
protection_end_date: La fecha en que finaliza el período de protección.
Monitorear estas métricas a través de la API es vital. Permite a los vendedores detectar tendencias negativas tempranamente y tomar acciones correctivas para mantener o mejorar su color de reputación, lo cual es esencial para el éxito a largo plazo en la plataforma. Por ejemplo, un aumento en la tasa de reclamos podría indicar problemas con la descripción de un producto o con la calidad, mientras que un aumento en los despachos con demora podría señalar cuellos de botella en el proceso de empaque y envío.Automatización de Precios (Repricing)La fijación de precios en el comercio electrónico es dinámica. La automatización de precios, o "repricing", permite a los vendedores ajustar los precios de sus productos de forma automática en respuesta a variables del mercado, como precios de la competencia, demanda, o niveles de stock, con el objetivo de mantenerse competitivos y maximizar los márgenes de ganancia.50La API de Mercado Libre ofrece endpoints para gestionar estas automatizaciones:
Consultar Reglas de Automatización Disponibles para un Ítem:

Endpoint: GET https://api.mercadolibre.com/marketplace/items/$ITEM_ID/prices/automate/rules.50
Precondiciones: El ítem debe existir y ser elegible para la automatización de precios.
Respuesta: Lista las reglas aplicables (e.g., rule_id, title, description).


Asignar Nueva Automatización de Precios a un Ítem:

Endpoint: POST https://api.mercadolibre.com/marketplace/items/$ITEM_ID/prices/automate.50
Cuerpo de la Solicitud: Deberá incluir el rule_id de la regla a aplicar, y parámetros cruciales como min_price (precio mínimo permitido) y max_price (precio máximo permitido) para esa automatización.
Precondiciones: El ítem debe existir, se debe especificar un precio mínimo, y los precios mínimo y máximo deben ser razonables (no absurdos) para evitar errores costosos.


Consultar la Automatización de Precios Existente de un Ítem:

Endpoint: GET https://api.mercadolibre.com/marketplace/items/$ITEM_ID/prices/automate.50
Respuesta: Detalles de la regla aplicada, incluyendo min_price y max_price.


Actualizar una Automatización de Precios Asignada:

Endpoint: PUT https://api.mercadolibre.com/marketplace/items/$ITEM_ID/prices/automate.50
Permite modificar los parámetros de una regla ya asignada (e.g., cambiar min_price o max_price).


Eliminar una Automatización de Precios de un Ítem:

Endpoint: DELETE https://api.mercadolibre.com/marketplace/items/$ITEM_ID/prices/automate.50


La automatización de precios es una herramienta poderosa, pero requiere una configuración cuidadosa. Establecer precios mínimos y máximos adecuados es fundamental para proteger los márgenes de ganancia y evitar que los precios caigan demasiado bajo o suban a niveles irreales debido a fallos en la lógica o datos de mercado incorrectos.Gestión de PromocionesParticipar en las campañas de promociones de Mercado Libre (como Ofertas del Día, Ofertas Relámpago, campañas co-financiadas, etc.) es una estrategia efectiva para aumentar la visibilidad y las ventas. La API permite a los vendedores gestionar su participación en estas promociones.10 Es importante usar app_version=v2 en las llamadas a estos endpoints.Tipos de PromocionesMercado Libre ofrece una variedad de tipos de campañas promocionales, cada una con sus propias características y reglas.10 La siguiente tabla, basada en la información de los documentos, resume algunas de ellas:Nombre de la CampañaTipo de Campaña (API ID)Definición de PrecioSugerencia de Precio MELIBonificación MELIStock para ParticiparDeadlineAprobaciónTradicionalDEALUsuario defineNoNoNoSíSíCo-fondeadaMARKETPLACE_CAMPAIGNUsuario aceptaNoSíNoSíNoDescuento por VolumenVOLUMEUsuario aceptaNoSíNoSíNoOferta del DíaDODUsuario defineSíNoSí (informativo)NoNoOferta RelámpagoLIGHTNINGUsuario defineSíNoSí (mandatorio)NoNoDescuento Pre-acordado por ÍtemPRE_NEGOTIATEDUsuario acuerda/aceptaNoSíSíSíNoCampaña del VendedorSELLER_CAMPAIGNUsuario define/aceptaNoNoNoSíNoCo-fondeada AutomatizadaSMARTUsuario aceptaNoSíNoSíNoCampaña de Precios CompetitivosPRICE_MATCHINGUsuario aceptaNoSíNoSíNoCampaña Liquidación Stock FullUNHEALTHY_STOCKUsuario acuerda/aceptaNoSíSíSíNoEndpoints Principales para Promociones
Consultar Promociones Disponibles para el Vendedor:

Endpoint: GET https://api.mercadolibre.com/seller-promotions/users/$USER_ID?app_version=v2.10
Devuelve una lista de las campañas a las que el vendedor ha sido invitado o puede participar.


Identificar Ítems Invitados (Candidatos):

Cuando un ítem es elegible para una promoción, puede recibir el estado de candidate. Mercado Libre puede enviar una notificación con un candidate_id.
Endpoint: GET https://api.mercadolibre.com/seller-promotions/candidates/$CANDIDATE_ID?app_version=v2 (o similar para buscar candidatos por ítem/promoción).10


Consultar Ofertas (Ítems dentro de una Promoción Activa o Propuesta):

Una "oferta" representa la participación de un ítem en una promoción, con un precio promocional.
Endpoint: GET https://api.mercadolibre.com/seller-promotions/offers/$OFFER_ID?app_version=v2.10


Consultar Ítems de una Promoción Específica:

Endpoint: GET https://api.mercadolibre.com/seller-promotions/promotions/$PROMOTION_ID/items?promotion_type=$PROMOTION_TYPE&app_version=v2.10
Permite ver todos los ítems que forman parte de una campaña y su estado dentro de ella.
Filtros: item_id (para un ítem específico), status (estado de la oferta: started, pending, candidate), status_item (estado del ítem en la plataforma: active, paused).


Participar en Promociones / Modificar Ítems en Promoción:

Para agregar un ítem a una promoción: POST /seller-promotions/promotions/$PROMOTION_ID/items (con el item_id, precio promocional, y stock si es requerido).
Para modificar un ítem en promoción: PUT /seller-promotions/promotions/$PROMOTION_ID/items/$ITEM_ID.
Para eliminar un ítem de una promoción: DELETE /seller-promotions/promotions/$PROMOTION_ID/items/$ITEM_ID.
(La estructura exacta del cuerpo de la solicitud y los parámetros dependerán del tipo de promoción).


Consultar Promociones de un Ítem Específico:

Endpoint: GET https://api.mercadolibre.com/seller-promotions/items/$ITEM_ID?app_version=v2.10
Nota de Deprecación Importante: A partir del 3 de marzo de 2025, este endpoint (/seller-promotions/items/$ITEM_ID) dejará de mostrar información segmentada de las campañas. Para acceder a esos detalles, se deberá utilizar el endpoint "Consultar ítems en una campaña" (/seller-promotions/promotions/$PROMOTION_ID/items).10


La gestión de promociones vía API puede ser compleja debido a la diversidad de tipos y estados. Sin embargo, permite a los vendedores con grandes catálogos o estrategias de marketing dinámicas automatizar su participación y optimizar sus ofertas.Manejo de Reclamos y MediacionesLos reclamos son una parte inevitable del comercio electrónico. Una gestión eficiente y justa de los reclamos es crucial para mantener la satisfacción del cliente y proteger la reputación del vendedor. La API de Mercado Libre proporciona herramientas para consultar y gestionar reclamos.53Tipos de ReclamosLos reclamos pueden originarse por diversas razones 53:
Order: Problemas relacionados directamente con la orden o el producto recibido (e.g., discrepancias, errores en cantidad, producto defectuoso).
Shipment: Problemas relacionados con el proceso de envío (e.g., retrasos, producto dañado durante el transporte, problemas logísticos).
Consultar un Reclamo
Endpoint: GET https://api.mercadolibre.com/post-purchase/v1/claims/$CLAIM_ID.53
Respuesta (campos clave):

id: ID del reclamo.
type: El tipo de flujo del reclamo. Puede ser:

meditations: Reclamo directo entre comprador y vendedor.
return: Una devolución de producto (generalmente sin mensajes, se sigue el flujo de devoluciones).
fulfillment: Reclamo relacionado con una compra con envío Full (entre comprador y Mercado Libre).
ml_case: Cancelación de la compra por el comprador debido a envío demorado.
Otros como cancel_sale, cancel_purchase, change, service.


stage: La etapa actual del reclamo:

claim: Etapa inicial donde interactúan comprador y vendedor.
dispute: Etapa de mediación donde interviene un representante de Mercado Libre.
recontact: Etapa donde alguna de las partes se contacta después de cerrado el reclamo/disputa.


status: Estado general del reclamo.
reason_id: Un código que identifica el motivo del reclamo.
due_date: Fecha límite para que la parte responsable tome una acción.
action_responsible: Quién tiene la siguiente acción (seller, buyer, mediator).
title, description: Detalles sobre el estado y problema del reclamo.
problem: Descripción del problema que originó el reclamo.


Obtener Detalle del Motivo del ReclamoPara entender mejor la causa raíz de un reclamo, se puede consultar el reason_id:
Endpoint: GET https://api.mercadolibre.com/post-purchase/v1/claims/reasons/$REASON_ID.53
Gestionar Resolución de ReclamosLa API permite a los vendedores interactuar con el flujo de resolución de reclamos 54:
Escalar a Disputa (Pedir Mediación de Mercado Libre): Si no se llega a un acuerdo con el comprador en la etapa de claim, el vendedor (o el comprador) puede solicitar la intervención de Mercado Libre.

Endpoint: POST https://api.mercadolibre.com/post-purchase/v1/claims/$CLAIM_ID/actions/open-dispute.54


Proponer/Aceptar/Rechazar Resoluciones:

La API permite ver las resoluciones esperadas por cada parte (expected_resolution: refund, product, change_product, return_product) y el estado de estas propuestas (pending, accepted, rejected).54
Existen endpoints para enviar mensajes dentro del reclamo, adjuntar evidencia (ver documentación de "Gestionar evidencia de reclamos"), proponer reembolsos parciales (consultar ofertas disponibles con /claims/$CLAIM_ID/partial-refund/available-offers-resolutions y luego POST para proponer/aceptar).
Si una propuesta de reembolso parcial es rechazada por el comprador, la resolución esperada se marca como rejected. El flujo puede continuar con otras propuestas hasta llegar a una solución, como un reembolso total.54
Identificar el tipo de reclamo por los primeros caracteres del reason_id (e.g., "PNR" para "Producto No Recibido", "PDD" para "Producto Defectuoso o Diferente") ayuda a entender las opciones de resolución disponibles.54


Una gestión proactiva de los reclamos a través de la API puede ayudar a resolverlos más rápidamente, minimizar el impacto en la reputación y mejorar la experiencia del cliente.Ejemplos de Código para Estrategias AvanzadasSe recomienda incluir ejemplos de código (Python/JavaScript) para:
Crear una campaña de Product Ads personalizada y consultar sus métricas.
Consultar la reputación actual de un vendedor, enfocándose en las métricas de MLC.
Consultar las promociones disponibles para un vendedor y cómo agregar un ítem a una promoción tipo DEAL.
Consultar los detalles de un reclamo existente.
Estos ejemplos deben ilustrar cómo interactuar con estos sistemas más complejos y cómo interpretar sus respuestas.9. Notificaciones (Webhooks)Las notificaciones, comúnmente implementadas a través de webhooks, son un mecanismo esencial para que las aplicaciones reciban actualizaciones en tiempo real sobre eventos que ocurren en la plataforma de Mercado Libre. En lugar de realizar consultas periódicas a la API (polling) para verificar si algo ha cambiado, Mercado Libre puede notificar proactivamente a la aplicación cuando ocurre un evento de interés, como la creación de una nueva orden, un cambio de precio en un ítem, o una nueva pregunta de un comprador.1 Esto resulta en sistemas más eficientes, con menor carga para la API de Mercado Libre y una capacidad de respuesta más rápida por parte de la aplicación integrada.Concepto y UtilidadUn webhook es una URL HTTP (un endpoint) que la aplicación expone para recibir datos. Cuando ocurre un evento en Mercado Libre para el cual la aplicación se ha suscrito, Mercado Libre envía una solicitud HTTP POST a esa URL con información sobre el evento.1Beneficios:
Tiempo Real: Las actualizaciones se reciben casi instantáneamente.
Eficiencia: Reduce la necesidad de polling constante
