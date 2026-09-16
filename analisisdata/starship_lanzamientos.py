import requests
import pandas as pd
from datetime import datetime, timezone
import os

# ============================================================
# CONFIGURACIÓN
# ============================================================

URL = "https://ll.thespacedevs.com/2.3.0/launches/"

# Momento exacto en el que se ejecuta el programa
AHORA_UTC = datetime.now(timezone.utc)

PARAMS = {
    # SOLO STARSHIP
    "rocket__configuration__name": "Starship",

    # Solo lanzamientos hasta este momento
    "net__lte": AHORA_UTC.isoformat(),

    "mode": "detailed",
    "limit": 100,
    "ordering": "net"
}

# RUTA ABSOLUTA GARANTIZADA HACIA LA CARPETA DATA EN LA RAÍZ
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "Starship_lanzamientos_seleccionados.xlsx")


# ============================================================
# FUNCIÓN PARA OBTENER UN VALOR DENTRO DE DATOS ANIDADOS
# ============================================================

def obtener(dato, ruta):
    """
    Permite acceder a campos como:
    rocket.configuration.name
    rocket.launcher_stage[0].launcher.serial_number
    """

    partes = ruta.replace("[", ".").replace("]", "").split(".")

    actual = dato

    for parte in partes:

        if actual is None:
            return None

        if isinstance(actual, dict):
            actual = actual.get(parte)

        elif isinstance(actual, list):
            try:
                actual = actual[int(parte)]
            except (ValueError, IndexError):
                return None

        else:
            return None

    return actual


# ============================================================
# DESCARGAR LANZAMIENTOS
# ============================================================

def descargar_lanzamientos():

    resultados = []

    siguiente = URL
    parametros = PARAMS

    pagina = 1

    while siguiente:

        print()
        print(f"Descargando página {pagina}...")

        respuesta = requests.get(
            siguiente,
            params=parametros,
            timeout=60
        )

        respuesta.raise_for_status()

        datos = respuesta.json()

        resultados_pagina = datos.get("results", [])

        resultados.extend(resultados_pagina)

        print(
            f"  Lanzamientos obtenidos: "
            f"{len(resultados_pagina)}"
        )

        print(
            f"  Total acumulado: "
            f"{len(resultados)}"
        )

        siguiente = datos.get("next")

        # La URL "next" ya contiene los parámetros
        parametros = None

        pagina += 1

    return resultados


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

print("================================================")
print("       LAUNCH LIBRARY 2 - STARSHIP")
print("================================================")

print()
print("Consultando lanzamientos hasta:")
print(AHORA_UTC)

lanzamientos = descargar_lanzamientos()

print()
print("================================================")
print(f"TOTAL LANZAMIENTOS: {len(lanzamientos)}")
print("================================================")


# ============================================================
# CAMPOS QUE QUEREMOS
# ============================================================

CAMPOS = {

    "id":
        "ID lanzamiento",

    "name":
        "Nombre lanzamiento",

    "net":
        "Fecha lanzamiento",

    "status.name":
        "Estado",

    "rocket.configuration.name":
        "Cohete",

    "rocket.configuration.full_name":
        "Versión cohete",

    "rocket.configuration.variant":
        "Variante",

    "pad.name":
        "Plataforma lanzamiento",

    "pad.location.name":
        "Lugar lanzamiento",

    "mission.name":
        "Misión",

    "mission.description":
        "Descripción misión",

    "failreason":
        "Motivo fallo",

    "rocket.spacecraft_stage[0].landing.landing_location.description":
        "Lugar aterrizaje Ship",

    "mission.orbit.abbrev":
        "Órbita",

    "rocket.launcher_stage[0].launcher.serial_number":
        "Booster",

    "rocket.spacecraft_stage[0].spacecraft.name":
        "Ship",

    "rocket.spacecraft_stage[0].spacecraft.serial_number":
        "Nº vuelo Ship"
}


# ============================================================
# CREAR FILAS
# ============================================================

filas = []

for numero, lanzamiento in enumerate(lanzamientos, start=1):

    print(
        f"Procesando lanzamiento "
        f"{numero}/{len(lanzamientos)}"
    )

    fila = {}

    for ruta, alias in CAMPOS.items():

        fila[alias] = obtener(
            lanzamiento,
            ruta
        )

    filas.append(fila)


# ============================================================
# DATAFRAME
# ============================================================

df = pd.DataFrame(filas)


# ============================================================
# FECHAS (FORMATO MM/DD/YYYY)
# ============================================================

if "Fecha lanzamiento" in df.columns:

    fecha = pd.to_datetime(
        df["Fecha lanzamiento"],
        errors="coerce",
        utc=True
    )

    # Conservamos UTC directamente y le damos formato MM/DD/YYYY
    df["Fecha lanzamiento"] = fecha.dt.strftime('%m/%d/%Y')


# ============================================================
# EXPORTAR A EXCEL
# ============================================================

with pd.ExcelWriter(
    OUTPUT_FILE,
    engine="openpyxl"
) as writer:

    df.to_excel(
        writer,
        sheet_name="Starship",
        index=False
    )


print()
print("================================================")
print("ARCHIVO CREADO CORRECTAMENTE")
print("================================================")

print(f"Lanzamientos: {len(df)}")
print(f"Columnas: {len(df.columns)}")
print(f"Archivo: {OUTPUT_FILE}")