import subprocess
import json
import os
import sys
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. EJECUTAR EL SCRIPT DE LA API
print("1/2: Recuperando información actualizada desde la API...")

script_api = os.path.join(BASE_DIR, "analisisdata", "starship_lanzamientos.py")

try:
    resultado = subprocess.run(
        [sys.executable, script_api], 
        check=True, 
        capture_output=True, 
        text=True
    )
    print("✓ Datos de la API recuperados correctamente.")
except subprocess.CalledProcessError as e:
    print(f"❌ Error al ejecutar el script de la API:\n{e.stderr}")
    exit(1)

# 2. CONVERTIR LOS DATOS ACTUALIZADOS A DATA.JS
print("2/2: Generando archivo data.js para la aplicación web...")

ARCHIVO_EXCEL = os.path.join(BASE_DIR, "data", "Starship_lanzamientos_seleccionados.xlsx") 
ARCHIVO_DATA_JS = os.path.join(BASE_DIR, "data.js")

if os.path.exists(ARCHIVO_EXCEL):
    df = pd.read_excel(ARCHIVO_EXCEL)
    
    # Mapeo completo de las 17 columnas a claves estándar para JavaScript
    column_mapping = {
        "ID lanzamiento": "id",
        "Nombre lanzamiento": "mission",
        "Fecha lanzamiento": "date",
        "Estado": "status",
        "Cohete": "rocket",
        "Versión cohete": "version",
        "Variante": "variant",
        "Plataforma lanzamiento": "pad",
        "Lugar lanzamiento": "site",
        "Misión": "missionDetail",
        "Descripción misión": "description",
        "Motivo fallo": "failureReason",
        "Lugar aterrizaje Ship": "landingSite",
        "Órbita": "orbit",
        "Booster": "booster",
        "Ship": "ship",
        "Nº vuelo Ship": "shipFlightNum"
    }
    # Renombrar columnas existentes
    df = df.rename(columns=column_mapping)

    # Formatear la fecha a MM/DD/YYYY en texto limpio
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.strftime("%m/%d/%Y")

    # Limpiar valores nulos para JSON (reemplaza NaN por cadenas vacías)
    df = df.fillna("")
    
    # Convertir todas las filas y columnas a una lista de diccionarios
    records = df.to_dict(orient="records")
    
    # Guardar en data.js asignando la variable global
    js_content = f"window.STARSHIP_DATA = {json.dumps(records, ensure_ascii=False, indent=2)};"

    with open(ARCHIVO_DATA_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"✓ ¡data.js actualizado con éxito! ({len(records)} misiones procesadas)")
    print("\n🚀 Proceso completado. Recarga el navegador.")
else:
    print(f"❌ No se encontró el archivo Excel en: {ARCHIVO_EXCEL}")