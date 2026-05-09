import os
import pandas as pd

carpeta = "Macros"

dfs = []
id_counter = 1  # ID global

for archivo in os.listdir(carpeta):
    if archivo.endswith(".csv"):
        ruta = os.path.join(carpeta, archivo)

        # Leer sin encabezados
        df = pd.read_csv(ruta, header=None)

        # Crear columna ID para este archivo
        filas = len(df)
        df.insert(0, "ID", range(id_counter, id_counter + filas))

        # Actualizar contador global
        id_counter += filas

        dfs.append(df)

        print(f"Merged: {archivo} ({filas} filas)")

# Concatenar todo
df_final = pd.concat(dfs, ignore_index=True)

# Guardar CSV final
df_final.to_csv("base_macros.csv", index=False, header=False, encoding="utf-8")

print("\nMerge completo → archivo generado: base_macros.csv")