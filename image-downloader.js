import fs from "fs";
import axios from "axios";

export const descargarImagen = async (url, rutaDeGuardado) => {
  try {
    const respuesta = await axios.get(url, {responseType: "stream"});
    respuesta.data.pipe(fs.createWriteStream(rutaDeGuardado));
    return new Promise((resolve, reject) => {
      respuesta.data.on("end", () => {
        resolve();
      });
      respuesta.data.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    return 0;
  }
};
